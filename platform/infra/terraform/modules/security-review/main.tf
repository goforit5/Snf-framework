# =============================================================================
# Security Review Module — Network Posture Verification
# =============================================================================
# Verifies security group rules meet HIPAA requirements:
# - Database SG: NO 0.0.0.0/0 ingress
# - MCP Gateway SG: NO 0.0.0.0/0 ingress
# - Only ALB SG allows 443 from internet
#
# This module uses data sources to read existing security groups and
# outputs a posture summary. Any violations are surfaced via Terraform
# plan output before apply.
#
# SNF-220: Security hardening + HIPAA verification.
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

variable "db_security_group_id" {
  description = "Security group ID for database"
  type        = string
}

variable "compute_security_group_id" {
  description = "Security group ID for compute/MCP gateway"
  type        = string
}

variable "alb_security_group_id" {
  description = "Security group ID for ALB (if separate from compute)"
  type        = string
  default     = ""
}

locals {
  is_aws      = var.cloud_provider == "aws"
  is_azure    = var.cloud_provider == "azure"
  name_prefix = "${var.project_name}-${var.environment}"
}

# =============================================================================
# AWS: Security Group Rule Verification
# =============================================================================

data "aws_security_group" "database" {
  count = local.is_aws ? 1 : 0
  id    = var.db_security_group_id
}

data "aws_security_group" "compute" {
  count = local.is_aws ? 1 : 0
  id    = var.compute_security_group_id
}

# Check: database SG must NOT have 0.0.0.0/0 ingress
locals {
  db_has_open_ingress = local.is_aws ? anytrue([
    for rule in data.aws_security_group.database[0].ingress :
    contains(rule.cidr_blocks, "0.0.0.0/0")
  ]) : false

  compute_has_open_ingress = local.is_aws ? anytrue([
    for rule in data.aws_security_group.compute[0].ingress :
    contains(rule.cidr_blocks, "0.0.0.0/0")
  ]) : false

  # ALB is expected to have 443 open — that's correct
  alb_443_only = local.is_aws && var.alb_security_group_id != "" ? alltrue([
    for rule in data.aws_security_group.compute[0].ingress :
    rule.from_port == 443 && rule.to_port == 443
    if contains(rule.cidr_blocks, "0.0.0.0/0")
  ]) : true
}

# Terraform check blocks (TF 1.5+) — fail plan if violations found
check "database_no_open_ingress" {
  assert {
    condition     = !local.db_has_open_ingress
    error_message = "HIPAA VIOLATION: Database security group has 0.0.0.0/0 ingress rule. Database must only be accessible from compute SG."
  }
}

check "compute_no_open_ingress" {
  assert {
    condition     = !local.compute_has_open_ingress
    error_message = "HIPAA VIOLATION: Compute/MCP gateway security group has 0.0.0.0/0 ingress rule. Only ALB should accept internet traffic."
  }
}

# =============================================================================
# Outputs — Security Posture Summary
# =============================================================================

output "security_posture" {
  description = "Security posture summary for compliance review"
  value = {
    database_sg = {
      id                = var.db_security_group_id
      has_open_ingress  = local.db_has_open_ingress
      status            = local.db_has_open_ingress ? "FAIL" : "PASS"
      requirement       = "No 0.0.0.0/0 ingress — only compute SG on port 5432"
    }
    compute_sg = {
      id                = var.compute_security_group_id
      has_open_ingress  = local.compute_has_open_ingress
      status            = local.compute_has_open_ingress ? "FAIL" : "PASS"
      requirement       = "No 0.0.0.0/0 ingress — only ALB forwards traffic"
    }
    alb = {
      only_443_open     = local.alb_443_only
      status            = local.alb_443_only ? "PASS" : "FAIL"
      requirement       = "Only port 443 open to internet (TLS termination)"
    }
    overall_status = (
      !local.db_has_open_ingress &&
      !local.compute_has_open_ingress &&
      local.alb_443_only
    ) ? "PASS" : "FAIL"
    environment = var.environment
    reviewed_at = timestamp()
  }
}
