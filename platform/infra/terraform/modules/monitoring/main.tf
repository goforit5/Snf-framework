# =============================================================================
# Monitoring Module — CloudWatch Dashboard + Alarms + Budget
# =============================================================================
# AWS:   CloudWatch dashboards, metric alarms, SNS notifications, AWS Budgets
# Azure: Azure Monitor dashboards, metric alerts, Action Groups
#
# HIPAA Compliance:
# - All metrics sourced from encrypted services (no PHI in metric names)
# - SNS notifications encrypted with KMS
# - Alarm history retained for compliance auditing
# =============================================================================

variable "cloud_provider" {
  type = string
}

variable "environment" {
  type = string
}

variable "project_name" {
  type = string
}

variable "region" {
  type = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name for compute metrics"
  type        = string
  default     = ""
}

variable "ecs_orchestrator_service_name" {
  description = "ECS service name for orchestrator"
  type        = string
  default     = ""
}

variable "ecs_gateway_service_name" {
  description = "ECS service name for MCP gateway"
  type        = string
  default     = ""
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix for request metrics"
  type        = string
  default     = ""
}

variable "aurora_cluster_id" {
  description = "Aurora cluster identifier for DB metrics"
  type        = string
  default     = ""
}

variable "notification_email" {
  description = "Email for alarm notifications"
  type        = string
  default     = "andrew@taskvisory.com"
}

variable "monthly_budget_usd" {
  description = "Monthly AWS budget limit in USD"
  type        = number
  default     = 400
}

variable "daily_anthropic_spend_limit" {
  description = "Daily Anthropic API spend threshold in USD"
  type        = number
  default     = 50
}

locals {
  is_aws      = var.cloud_provider == "aws"
  is_azure    = var.cloud_provider == "azure"
  name_prefix = "${var.project_name}-${var.environment}"
}

# =============================================================================
# AWS: SNS Topic for Alarm Notifications
# =============================================================================

resource "aws_sns_topic" "alarms" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-platform-alarms"

  # HIPAA: Encrypt SNS at rest
  kms_master_key_id = "alias/aws/sns"

  tags = {
    Name        = "${local.name_prefix}-platform-alarms"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  count     = local.is_aws ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# =============================================================================
# AWS: CloudWatch Dashboard
# =============================================================================

resource "aws_cloudwatch_dashboard" "platform" {
  count          = local.is_aws ? 1 : 0
  dashboard_name = "${local.name_prefix}-platform"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1: ECS Compute Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS CPU Utilization (Orchestrator + Gateway)"
          region  = var.region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_orchestrator_service_name, { label = "Orchestrator" }],
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_gateway_service_name, { label = "MCP Gateway" }],
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS Memory Utilization (Orchestrator + Gateway)"
          region  = var.region
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_orchestrator_service_name, { label = "Orchestrator" }],
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_gateway_service_name, { label = "MCP Gateway" }],
          ]
          period = 300
          stat   = "Average"
        }
      },
      # Row 2: ALB Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "ALB Request Count"
          region  = var.region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum" }],
          ]
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "ALB 5xx Error Rate"
          region  = var.region
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", label = "5xx Count" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", label = "Target 5xx" }],
          ]
          period = 300
        }
      },
      # Row 3: Aurora Serverless
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title   = "Aurora Serverless ACU Consumption"
          region  = var.region
          metrics = [
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", var.aurora_cluster_id, { stat = "Average", label = "ACU (avg)" }],
            ["AWS/RDS", "ServerlessDatabaseCapacity", "DBClusterIdentifier", var.aurora_cluster_id, { stat = "Maximum", label = "ACU (max)" }],
          ]
          period = 300
        }
      },
      # Row 3: Anthropic API Spend (custom metric)
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title   = "Estimated Anthropic API Spend (Daily)"
          region  = var.region
          metrics = [
            ["SNF/Platform", "EstimatedAnthropicSpendUSD", "Environment", var.environment, { stat = "Sum", period = 86400 }],
          ]
          period = 86400
        }
      },
    ]
  })
}

# =============================================================================
# AWS: CloudWatch Alarms
# =============================================================================

# 5xx error rate > 1% for 5 minutes
resource "aws_cloudwatch_metric_alarm" "alb_5xx_rate" {
  count = local.is_aws ? 1 : 0

  alarm_name          = "${local.name_prefix}-alb-5xx-high"
  alarm_description   = "ALB 5xx error rate exceeds 1% for 5 minutes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "5xx Error Rate %"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "HTTPCode_ELB_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_arn_suffix
      }
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_arn_suffix
      }
    }
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]
  ok_actions    = [aws_sns_topic.alarms[0].arn]

  tags = {
    Severity = "critical"
  }
}

# Aurora ACU > 8 (staging should stay under 2)
resource "aws_cloudwatch_metric_alarm" "aurora_acu_high" {
  count = local.is_aws ? 1 : 0

  alarm_name          = "${local.name_prefix}-aurora-acu-high"
  alarm_description   = "Aurora Serverless ACU consumption exceeds 8 — staging should stay under 2"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  period              = 300
  threshold           = 8
  statistic           = "Average"
  metric_name         = "ServerlessDatabaseCapacity"
  namespace           = "AWS/RDS"

  dimensions = {
    DBClusterIdentifier = var.aurora_cluster_id
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]
  ok_actions    = [aws_sns_topic.alarms[0].arn]

  tags = {
    Severity = "warning"
  }
}

# Estimated daily Anthropic spend > $50
resource "aws_cloudwatch_metric_alarm" "anthropic_spend_high" {
  count = local.is_aws ? 1 : 0

  alarm_name          = "${local.name_prefix}-anthropic-spend-high"
  alarm_description   = "Estimated daily Anthropic API spend exceeds $${var.daily_anthropic_spend_limit}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  period              = 86400
  threshold           = var.daily_anthropic_spend_limit
  statistic           = "Sum"
  metric_name         = "EstimatedAnthropicSpendUSD"
  namespace           = "SNF/Platform"

  dimensions = {
    Environment = var.environment
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Severity = "critical"
  }
}

# ECS task unhealthy for > 5 minutes
resource "aws_cloudwatch_metric_alarm" "ecs_orchestrator_unhealthy" {
  count = local.is_aws ? 1 : 0

  alarm_name          = "${local.name_prefix}-orchestrator-unhealthy"
  alarm_description   = "ECS orchestrator task has 0 running tasks for 5+ minutes"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  period              = 300
  threshold           = 1
  statistic           = "Minimum"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_orchestrator_service_name
  }

  alarm_actions = [aws_sns_topic.alarms[0].arn]

  tags = {
    Severity = "critical"
  }
}

# =============================================================================
# AWS: Budget Alarm
# =============================================================================

resource "aws_budgets_budget" "monthly" {
  count = local.is_aws ? 1 : 0

  name         = "${local.name_prefix}-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 75
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.notification_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.notification_email]
  }
}

# =============================================================================
# Azure: Monitor Dashboard + Alerts (placeholder)
# =============================================================================

data "azurerm_resource_group" "main" {
  count = local.is_azure ? 1 : 0
  name  = "${local.name_prefix}-rg"
}

resource "azurerm_monitor_action_group" "alarms" {
  count               = local.is_azure ? 1 : 0
  name                = "${local.name_prefix}-platform-alarms"
  resource_group_name = data.azurerm_resource_group.main[0].name
  short_name          = "snf-alarms"

  email_receiver {
    name          = "admin"
    email_address = var.notification_email
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  value       = local.is_aws ? aws_sns_topic.alarms[0].arn : ""
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = local.is_aws ? aws_cloudwatch_dashboard.platform[0].dashboard_name : ""
}
