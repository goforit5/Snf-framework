# =============================================================================
# SNF Agentic Platform — Input Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Cloud Provider Selection
# -----------------------------------------------------------------------------

variable "cloud_provider" {
  description = "Target cloud provider: 'aws' or 'azure'. Ensign has not finalized their choice."
  type        = string
  default     = "aws"

  validation {
    condition     = contains(["aws", "azure"], var.cloud_provider)
    error_message = "cloud_provider must be 'aws' or 'azure'."
  }
}

# -----------------------------------------------------------------------------
# Common Variables
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment: staging, production"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "region" {
  description = "Cloud region for deployment (e.g., us-east-1, eastus)"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project identifier used in resource naming"
  type        = string
  default     = "snf-agentic-platform"
}

# -----------------------------------------------------------------------------
# Networking
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC/VNet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to deploy across (1 for staging, 2-3 for production)"
  type        = number
  default     = 2
}

# -----------------------------------------------------------------------------
# Database (PostgreSQL)
# -----------------------------------------------------------------------------

variable "db_instance_size" {
  description = "Database instance size (e.g., 'db.r6g.large' for AWS, 'GP_Standard_D2s_v3' for Azure)"
  type        = string
  default     = "db.r6g.large"
}

variable "db_storage_gb" {
  description = "Allocated database storage in GB"
  type        = number
  default     = 100
}

variable "db_backup_retention_days" {
  description = "Number of days to retain database backups. HIPAA requires minimum 6 years for PHI — this controls automated backups; long-term archival handled separately."
  type        = number
  default     = 30
}

# -----------------------------------------------------------------------------
# Compute (Container Orchestration)
# -----------------------------------------------------------------------------

variable "compute_cpu" {
  description = "CPU units for the platform container (1024 = 1 vCPU on Fargate)"
  type        = number
  default     = 1024
}

variable "compute_memory" {
  description = "Memory in MB for the platform container"
  type        = number
  default     = 2048
}

variable "compute_desired_count" {
  description = "Number of container instances to run"
  type        = number
  default     = 2
}

variable "container_image" {
  description = "Docker image URI for the orchestrator (e.g., ECR/ACR repository URI with tag)"
  type        = string
  default     = "snf-agentic-platform:latest"
}

variable "mcp_gateway_image" {
  description = "Docker image URI for the MCP gateway (e.g., ECR/ACR repository URI with tag)"
  type        = string
  default     = "snf-mcp-gateway:latest"
}

# -----------------------------------------------------------------------------
# MCP Gateway mTLS Configuration
# -----------------------------------------------------------------------------

variable "mtls_cert_path" {
  description = "Path to mTLS certificate file mounted in the MCP gateway container"
  type        = string
  default     = "/etc/mtls/tls.crt"
}

variable "mtls_key_path" {
  description = "Path to mTLS private key file mounted in the MCP gateway container"
  type        = string
  default     = "/etc/mtls/tls.key"
}

variable "mtls_ca_path" {
  description = "Path to mTLS CA certificate file mounted in the MCP gateway container"
  type        = string
  default     = "/etc/mtls/ca.crt"
}
