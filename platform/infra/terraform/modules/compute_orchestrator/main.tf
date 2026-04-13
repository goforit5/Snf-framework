# =============================================================================
# Compute Orchestrator Module — SNF Platform API + Orchestrator
# =============================================================================
# AWS:   ECS Fargate (serverless containers, no cluster management)
# Azure: AKS (managed Kubernetes)
#
# Runs @snf/api which boots the orchestrator from main.ts:
# - SessionManager, TriggerRouter, EventRelay
# - HITLBridge, AuditMirror, Fastify API
# - Cron scheduler + WebSocket fan-out (stateful — single replica)
#
# HIPAA Compliance:
# - Containers run in private subnets only
# - Secrets injected via Secrets Manager / Key Vault (never env vars)
# - CloudWatch / Azure Monitor for audit logging
# - TLS termination at load balancer
# - No SSH/RDP access to container hosts
#
# Created by SNF-106: split from monolithic compute module
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

variable "cpu" {
  description = "CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 1024
}

variable "memory" {
  description = "Memory in MB"
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Number of container instances (default 1 — stateful: cron scheduler + WebSocket fan-out)"
  type        = number
  default     = 1
}

variable "container_image" {
  description = "Docker image URI for the orchestrator"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "compute_security_group_id" {
  type = string
}

variable "db_connection_string" {
  type      = string
  sensitive = true
}

variable "secret_arns" {
  description = "Map of secret ARNs/IDs for injection into containers"
  type        = map(string)
  default     = {}
}

locals {
  is_aws      = var.cloud_provider == "aws"
  is_azure    = var.cloud_provider == "azure"
  name_prefix = "${var.project_name}-${var.environment}"
}

# =============================================================================
# AWS: ECS Fargate
# =============================================================================

resource "aws_ecs_cluster" "orchestrator" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-orchestrator-cluster"

  # HIPAA: Container Insights for monitoring and audit
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${local.name_prefix}-orchestrator-cluster"
  }
}

resource "aws_cloudwatch_log_group" "orchestrator" {
  count             = local.is_aws ? 1 : 0
  name              = "/ecs/${local.name_prefix}-orchestrator"
  retention_in_days = var.environment == "production" ? 365 : 30
}

# IAM role for ECS task execution (pulling images, writing logs)
resource "aws_iam_role" "ecs_execution" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-orchestrator-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  count      = local.is_aws ? 1 : 0
  role       = aws_iam_role.ecs_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# HIPAA: Task role can read secrets but not modify them
resource "aws_iam_role" "ecs_task" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-orchestrator-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_secrets" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-orchestrator-secrets-read"
  role  = aws_iam_role.ecs_task[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = values(var.secret_arns)
    }]
  })
}

resource "aws_ecs_task_definition" "orchestrator" {
  count = local.is_aws ? 1 : 0

  family                   = "${local.name_prefix}-orchestrator"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution[0].arn
  task_role_arn            = aws_iam_role.ecs_task[0].arn

  container_definitions = jsonencode([{
    name      = "snf-orchestrator"
    image     = var.container_image
    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    # HIPAA: Secrets injected from Secrets Manager — never plain env vars
    secrets = [
      for key, arn in var.secret_arns : {
        name      = key
        valueFrom = arn
      }
    ]

    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "PORT", value = "3000" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.orchestrator[0].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "orchestrator"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "orchestrator" {
  count = local.is_aws ? 1 : 0

  name            = "${local.name_prefix}-orchestrator"
  cluster         = aws_ecs_cluster.orchestrator[0].id
  task_definition = aws_ecs_task_definition.orchestrator[0].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  # HIPAA: Run in private subnets only
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.compute_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.orchestrator[0].arn
    container_name   = "snf-orchestrator"
    container_port   = 3000
  }
}

# Application Load Balancer (public subnet, TLS termination)
resource "aws_lb" "orchestrator" {
  count = local.is_aws ? 1 : 0

  name               = "${local.name_prefix}-orch-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.compute_security_group_id]
  subnets            = var.public_subnet_ids

  # HIPAA: Access logs for audit trail
  access_logs {
    bucket  = "${local.name_prefix}-alb-logs"
    enabled = var.environment == "production"
  }

  tags = {
    Name = "${local.name_prefix}-orchestrator-alb"
  }
}

resource "aws_lb_target_group" "orchestrator" {
  count = local.is_aws ? 1 : 0

  name        = "${local.name_prefix}-orch-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "https" {
  count = local.is_aws ? 1 : 0

  load_balancer_arn = aws_lb.orchestrator[0].arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06" # HIPAA: TLS 1.2+ only
  certificate_arn   = "arn:aws:acm:${var.region}:ACCOUNT_ID:certificate/PLACEHOLDER"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.orchestrator[0].arn
  }
}

# =============================================================================
# Azure: AKS Cluster
# =============================================================================

data "azurerm_resource_group" "main" {
  count = local.is_azure ? 1 : 0
  name  = "${local.name_prefix}-rg"
}

resource "azurerm_kubernetes_cluster" "orchestrator" {
  count = local.is_azure ? 1 : 0

  name                = "${local.name_prefix}-orchestrator-aks"
  resource_group_name = data.azurerm_resource_group.main[0].name
  location            = data.azurerm_resource_group.main[0].location
  dns_prefix          = "${local.name_prefix}-orchestrator"

  # HIPAA: Private cluster — API server not exposed to internet
  private_cluster_enabled = var.environment == "production"

  default_node_pool {
    name           = "system"
    node_count     = var.desired_count
    vm_size        = "Standard_D2s_v5"
    vnet_subnet_id = var.private_subnet_ids[0]

    # HIPAA: Encryption at host for node disks
    enable_host_encryption = true
  }

  identity {
    type = "SystemAssigned"
  }

  # HIPAA: Azure Monitor for container logs
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.orchestrator[0].id
  }

  network_profile {
    network_plugin = "azure"
    network_policy = "calico" # HIPAA: Network policy for pod-level isolation
  }

  tags = {
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

resource "azurerm_log_analytics_workspace" "orchestrator" {
  count               = local.is_azure ? 1 : 0
  name                = "${local.name_prefix}-orchestrator-logs"
  resource_group_name = data.azurerm_resource_group.main[0].name
  location            = data.azurerm_resource_group.main[0].location
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "production" ? 365 : 30
}

# =============================================================================
# Outputs
# =============================================================================

output "service_url" {
  description = "URL of the orchestrator API"
  value = local.is_aws ? (
    "https://${aws_lb.orchestrator[0].dns_name}"
  ) : (
    local.is_azure ? "https://${azurerm_kubernetes_cluster.orchestrator[0].fqdn}" : ""
  )
}

output "cluster_arn" {
  description = "ECS Cluster ARN (AWS) or AKS Cluster ID (Azure)"
  value = local.is_aws ? aws_ecs_cluster.orchestrator[0].arn : (
    local.is_azure ? azurerm_kubernetes_cluster.orchestrator[0].id : ""
  )
}

output "security_group_id" {
  description = "Security group ID for the orchestrator (used by MCP gateway to allow inbound)"
  value       = var.compute_security_group_id
}
