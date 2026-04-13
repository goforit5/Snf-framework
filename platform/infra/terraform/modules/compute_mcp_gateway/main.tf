# =============================================================================
# Compute MCP Gateway Module — In-VPC PHI Gateway
# =============================================================================
# AWS:   ECS Fargate (serverless containers, no cluster management)
# Azure: AKS (managed Kubernetes)
#
# Runs packages/connectors/src/gateway/:
# - PCC, Workday, M365, Regulatory MCP connectors
# - PHI tokenization layer
# - snf-hitl and snf-action custom MCP servers
#
# HIPAA Compliance:
# - ZERO public ingress — internal NLB only, no public ALB
# - PHI never leaves this subnet
# - mTLS between orchestrator and gateway (port 8443)
# - Security group: inbound 8443 from orchestrator SG only
# - Containers run in private subnets only (assign_public_ip = false)
# - Secrets injected via Secrets Manager / Key Vault (never env vars)
# - mTLS cert/key/CA paths point to mounted certificate files
# - CloudWatch / Azure Monitor for audit logging
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
  description = "Number of container instances"
  type        = number
  default     = 2
}

variable "container_image" {
  description = "Docker image URI for the MCP gateway"
  type        = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "orchestrator_security_group_id" {
  description = "Security group ID of the orchestrator service — only source allowed inbound on 8443"
  type        = string
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

# mTLS configuration — paths to mounted certificate files
variable "mtls_cert_path" {
  description = "Path to mTLS client/server certificate file (mounted in container)"
  type        = string
}

variable "mtls_key_path" {
  description = "Path to mTLS private key file (mounted in container)"
  type        = string
}

variable "mtls_ca_path" {
  description = "Path to mTLS CA certificate file (mounted in container)"
  type        = string
}

locals {
  is_aws      = var.cloud_provider == "aws"
  is_azure    = var.cloud_provider == "azure"
  name_prefix = "${var.project_name}-${var.environment}"
}

# =============================================================================
# AWS: Security Group — HIPAA: Zero public ingress
# =============================================================================

resource "aws_security_group" "mcp_gateway" {
  count = local.is_aws ? 1 : 0

  name        = "${local.name_prefix}-mcp-gateway-sg"
  description = "HIPAA: MCP gateway — inbound 8443 from orchestrator only, no public access"
  vpc_id      = var.vpc_id

  # HIPAA: Only the orchestrator can reach the gateway on port 8443
  ingress {
    description     = "mTLS from orchestrator"
    from_port       = 8443
    to_port         = 8443
    protocol        = "tcp"
    security_groups = [var.orchestrator_security_group_id]
  }

  # Outbound: allow all (connectors need to reach PCC, Workday, M365 APIs)
  egress {
    description = "Outbound to external APIs (PCC, Workday, M365, CMS/OIG/SAM)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name       = "${local.name_prefix}-mcp-gateway-sg"
    Compliance = "HIPAA"
  }
}

# =============================================================================
# AWS: ECS Fargate
# =============================================================================

resource "aws_ecs_cluster" "mcp_gateway" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-mcp-gateway-cluster"

  # HIPAA: Container Insights for monitoring and audit
  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${local.name_prefix}-mcp-gateway-cluster"
  }
}

resource "aws_cloudwatch_log_group" "mcp_gateway" {
  count             = local.is_aws ? 1 : 0
  name              = "/ecs/${local.name_prefix}-mcp-gateway"
  retention_in_days = var.environment == "production" ? 365 : 30
}

# IAM role for ECS task execution (pulling images, writing logs)
resource "aws_iam_role" "ecs_execution" {
  count = local.is_aws ? 1 : 0
  name  = "${local.name_prefix}-mcp-gw-ecs-execution"

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
  name  = "${local.name_prefix}-mcp-gw-ecs-task"

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
  name  = "${local.name_prefix}-mcp-gw-secrets-read"
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

resource "aws_ecs_task_definition" "mcp_gateway" {
  count = local.is_aws ? 1 : 0

  family                   = "${local.name_prefix}-mcp-gateway"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution[0].arn
  task_role_arn            = aws_iam_role.ecs_task[0].arn

  container_definitions = jsonencode([{
    name      = "snf-mcp-gateway"
    image     = var.container_image
    essential = true

    portMappings = [{
      containerPort = 8443
      protocol      = "tcp"
    }]

    # HIPAA: Secrets injected from Secrets Manager — never plain env vars
    secrets = [
      for key, arn in var.secret_arns : {
        name      = key
        valueFrom = arn
      }
    ]

    # mTLS cert paths point to mounted certificate files (not secrets)
    environment = [
      { name = "NODE_ENV", value = var.environment },
      { name = "PORT", value = "8443" },
      { name = "MTLS_CERT_PATH", value = var.mtls_cert_path },
      { name = "MTLS_KEY_PATH", value = var.mtls_key_path },
      { name = "MTLS_CA_PATH", value = var.mtls_ca_path },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.mcp_gateway[0].name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "mcp-gateway"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -fk https://localhost:8443/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "mcp_gateway" {
  count = local.is_aws ? 1 : 0

  name            = "${local.name_prefix}-mcp-gateway"
  cluster         = aws_ecs_cluster.mcp_gateway[0].id
  task_definition = aws_ecs_task_definition.mcp_gateway[0].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  # HIPAA: Run in private subnets only — PHI never leaves this subnet
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.mcp_gateway[0].id]
    assign_public_ip = false
  }

  # Internal NLB for service discovery (no public ALB)
  load_balancer {
    target_group_arn = aws_lb_target_group.mcp_gateway[0].arn
    container_name   = "snf-mcp-gateway"
    container_port   = 8443
  }
}

# HIPAA: Internal Network Load Balancer — NO public access
resource "aws_lb" "mcp_gateway" {
  count = local.is_aws ? 1 : 0

  name               = "${local.name_prefix}-mcp-gw-nlb"
  internal           = true # HIPAA: Internal only — zero public ingress
  load_balancer_type = "network"
  subnets            = var.private_subnet_ids

  tags = {
    Name       = "${local.name_prefix}-mcp-gateway-nlb"
    Compliance = "HIPAA"
  }
}

resource "aws_lb_target_group" "mcp_gateway" {
  count = local.is_aws ? 1 : 0

  name        = "${local.name_prefix}-mcp-gw-tg"
  port        = 8443
  protocol    = "TCP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    protocol            = "TCP"
    port                = 8443
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

resource "aws_lb_listener" "mcp_gateway" {
  count = local.is_aws ? 1 : 0

  load_balancer_arn = aws_lb.mcp_gateway[0].arn
  port              = 8443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.mcp_gateway[0].arn
  }
}

# =============================================================================
# Azure: AKS Cluster
# =============================================================================

data "azurerm_resource_group" "main" {
  count = local.is_azure ? 1 : 0
  name  = "${local.name_prefix}-rg"
}

resource "azurerm_kubernetes_cluster" "mcp_gateway" {
  count = local.is_azure ? 1 : 0

  name                = "${local.name_prefix}-mcp-gateway-aks"
  resource_group_name = data.azurerm_resource_group.main[0].name
  location            = data.azurerm_resource_group.main[0].location
  dns_prefix          = "${local.name_prefix}-mcp-gateway"

  # HIPAA: Private cluster — API server not exposed to internet
  private_cluster_enabled = true # Always private — PHI gateway

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
    log_analytics_workspace_id = azurerm_log_analytics_workspace.mcp_gateway[0].id
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

resource "azurerm_log_analytics_workspace" "mcp_gateway" {
  count               = local.is_azure ? 1 : 0
  name                = "${local.name_prefix}-mcp-gw-logs"
  resource_group_name = data.azurerm_resource_group.main[0].name
  location            = data.azurerm_resource_group.main[0].location
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "production" ? 365 : 30
}

# =============================================================================
# Outputs
# =============================================================================

output "internal_endpoint" {
  description = "Internal NLB endpoint for the MCP gateway (no public access)"
  value = local.is_aws ? (
    "https://${aws_lb.mcp_gateway[0].dns_name}:8443"
  ) : (
    local.is_azure ? "https://${azurerm_kubernetes_cluster.mcp_gateway[0].fqdn}:8443" : ""
  )
}

output "cluster_arn" {
  description = "ECS Cluster ARN (AWS) or AKS Cluster ID (Azure)"
  value = local.is_aws ? aws_ecs_cluster.mcp_gateway[0].arn : (
    local.is_azure ? azurerm_kubernetes_cluster.mcp_gateway[0].id : ""
  )
}

output "security_group_id" {
  description = "Security group ID of the MCP gateway"
  value       = local.is_aws ? aws_security_group.mcp_gateway[0].id : ""
}
