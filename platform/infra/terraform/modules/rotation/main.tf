# =============================================================================
# Rotation Module — Credential Rotation Lambda Infrastructure
# =============================================================================
# SNF-152: Automated credential rotation for PCC, Workday, and M365 OAuth
# credentials stored in AWS Secrets Manager at snf/{tenant}/{credential-name}.
#
# HIPAA Compliance:
# - Credentials rotate on a 90-day schedule (configurable)
# - Dual-key pattern: both AWSCURRENT and AWSPREVIOUS valid during rotation
# - All rotation events logged to CloudWatch (audit trail)
# - Rotation failures trigger SNS alarm within the rotation window
# - Lambda runs in private subnets when VPC is configured (no public endpoint)
# - IAM least-privilege: Lambda can only access snf/* secrets
# =============================================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Credential systems to rotate — each gets its own Lambda, schedule, and alarm
  credentials = {
    pcc     = { name = "pcc-oauth", display = "PCC (PointClickCare)" }
    workday = { name = "workday-oauth", display = "Workday" }
    m365    = { name = "m365-oauth", display = "Microsoft 365" }
  }

  use_vpc = var.vpc_id != null && length(var.subnet_ids) > 0
}

# =============================================================================
# IAM Role — Shared by all rotation Lambdas
# =============================================================================

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "rotation_lambda" {
  name = "${local.name_prefix}-rotation-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${local.name_prefix}-rotation-lambda"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# HIPAA: Least-privilege access to Secrets Manager — only snf/* secrets
resource "aws_iam_role_policy" "secrets_access" {
  name = "${local.name_prefix}-rotation-secrets"
  role = aws_iam_role.rotation_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage",
          "secretsmanager:DescribeSecret",
          "secretsmanager:TagResource"
        ]
        Resource = "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:snf/*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.name_prefix}-rotate-*"
      }
    ]
  })
}

# VPC access policy — only attached when VPC is configured
resource "aws_iam_role_policy_attachment" "vpc_access" {
  count      = local.use_vpc ? 1 : 0
  role       = aws_iam_role.rotation_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# =============================================================================
# Security Group — Lambda VPC networking (optional)
# =============================================================================

resource "aws_security_group" "rotation_lambda" {
  count       = local.use_vpc ? 1 : 0
  name        = "${local.name_prefix}-rotation-lambda-sg"
  description = "Security group for credential rotation Lambda functions"
  vpc_id      = var.vpc_id

  # HIPAA: Outbound HTTPS only — Lambda needs to reach Secrets Manager and
  # provider OAuth endpoints for credential rotation
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to Secrets Manager and OAuth providers"
  }

  tags = {
    Name        = "${local.name_prefix}-rotation-lambda-sg"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# =============================================================================
# Lambda Functions — One per credential system
# =============================================================================

# Placeholder archive — real deployment uses CI/CD to build and upload
# the TypeScript handler from lambda/index.ts
data "archive_file" "rotation_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "rotate" {
  for_each = local.credentials

  function_name = "${local.name_prefix}-rotate-${each.key}"
  description   = "SNF-152: Credential rotation for ${each.value.display}"
  role          = aws_iam_role.rotation_lambda.arn

  runtime     = "nodejs20.x"
  handler     = "index.handler"
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory

  filename         = data.archive_file.rotation_lambda.output_path
  source_code_hash = data.archive_file.rotation_lambda.output_base64sha256

  environment {
    variables = {
      TENANT_NAME              = "${var.project_name}-ensign-${var.environment}"
      CREDENTIAL_NAME          = each.value.name
      PROVIDER                 = each.key
      PROVISION_VAULTS_COMMAND = "npx tsx platform/scripts/provision-vaults.ts --force-rotate --tenant=${var.project_name}-ensign-${var.environment}"
      # HIPAA: Never store secrets in environment variables — read from Secrets Manager at runtime
    }
  }

  # VPC configuration — only when vpc_id and subnet_ids are provided
  dynamic "vpc_config" {
    for_each = local.use_vpc ? [1] : []
    content {
      subnet_ids         = var.subnet_ids
      security_group_ids = [aws_security_group.rotation_lambda[0].id]
    }
  }

  tags = {
    Name        = "${local.name_prefix}-rotate-${each.key}"
    Environment = var.environment
    Compliance  = "HIPAA"
    System      = each.value.display
  }
}

# =============================================================================
# CloudWatch Log Groups — Explicit creation for retention policy
# =============================================================================

# HIPAA: Retain rotation logs for 365 days (audit trail requirement)
resource "aws_cloudwatch_log_group" "rotation" {
  for_each = local.credentials

  name              = "/aws/lambda/${local.name_prefix}-rotate-${each.key}"
  retention_in_days = 365

  tags = {
    Name        = "${local.name_prefix}-rotate-${each.key}-logs"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# =============================================================================
# EventBridge Schedule Rules — Trigger rotation on schedule
# =============================================================================

resource "aws_cloudwatch_event_rule" "rotation_schedule" {
  for_each = local.credentials

  name                = "${local.name_prefix}-rotate-${each.key}-schedule"
  description         = "SNF-152: Trigger ${each.value.display} credential rotation on ${var.rotation_schedule}"
  schedule_expression = var.rotation_schedule

  tags = {
    Name        = "${local.name_prefix}-rotate-${each.key}-schedule"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_cloudwatch_event_target" "rotation_lambda" {
  for_each = local.credentials

  rule = aws_cloudwatch_event_rule.rotation_schedule[each.key].name
  arn  = aws_lambda_function.rotate[each.key].arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  for_each = local.credentials

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rotate[each.key].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.rotation_schedule[each.key].arn
}

# =============================================================================
# SNS Topic — Rotation failure notifications
# =============================================================================

resource "aws_sns_topic" "rotation_alerts" {
  name = "${local.name_prefix}-rotation-alerts"

  # HIPAA: Encrypt SNS messages at rest
  kms_master_key_id = "alias/aws/sns"

  tags = {
    Name        = "${local.name_prefix}-rotation-alerts"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.rotation_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# =============================================================================
# CloudWatch Alarms — Fire on rotation Lambda errors
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "rotation_failure" {
  for_each = local.credentials

  alarm_name        = "${local.name_prefix}-rotate-${each.key}-failure"
  alarm_description = "SNF-152: ${each.value.display} credential rotation Lambda reported errors"

  namespace   = "AWS/Lambda"
  metric_name = "Errors"
  dimensions = {
    FunctionName = aws_lambda_function.rotate[each.key].function_name
  }

  statistic           = "Sum"
  comparison_operator  = "GreaterThanThreshold"
  threshold            = 0
  period               = 300
  evaluation_periods   = 1
  treat_missing_data   = "notBreaching"

  alarm_actions = [aws_sns_topic.rotation_alerts.arn]
  ok_actions    = [aws_sns_topic.rotation_alerts.arn]

  tags = {
    Name        = "${local.name_prefix}-rotate-${each.key}-alarm"
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}
