# =============================================================================
# SNF Agentic Platform — Root Terraform Module
# =============================================================================
# Cloud-agnostic root module that conditionally deploys to AWS or Azure
# based on the `cloud_provider` variable. Ensign Group has not finalized
# their cloud choice, so both paths are fully supported.
#
# HIPAA Compliance Notes:
# - All data encrypted at rest (AES-256) and in transit (TLS 1.2+)
# - VPC/VNet isolation for all compute and database resources
# - Audit logging enabled on all services
# - PHI never leaves the customer's cloud boundary (AWS Bedrock / Azure OpenAI)
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Remote state — configure per environment
  # backend "s3" {}    # AWS
  # backend "azurerm" {} # Azure
}

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.cloud_provider == "aws" ? var.region : "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Compliance  = "HIPAA"
    }
  }
}

provider "azurerm" {
  features {}
  skip_provider_registration = var.cloud_provider != "azure"
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  is_aws   = var.cloud_provider == "aws"
  is_azure = var.cloud_provider == "azure"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Compliance  = "HIPAA"
  }
}

# -----------------------------------------------------------------------------
# Networking Module
# -----------------------------------------------------------------------------

module "networking" {
  source = "./modules/networking"

  cloud_provider = var.cloud_provider
  environment    = var.environment
  project_name   = var.project_name
  region         = var.region
  vpc_cidr       = var.vpc_cidr
  az_count       = var.az_count
}

# -----------------------------------------------------------------------------
# Database Module (PostgreSQL)
# -----------------------------------------------------------------------------

module "database" {
  source = "./modules/database"

  cloud_provider   = var.cloud_provider
  environment      = var.environment
  project_name     = var.project_name
  region           = var.region
  instance_size    = var.db_instance_size
  storage_gb       = var.db_storage_gb
  backup_retention = var.db_backup_retention_days

  # Network dependencies
  vpc_id            = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  db_security_group_id = module.networking.db_security_group_id
}

# -----------------------------------------------------------------------------
# Secrets Module
# -----------------------------------------------------------------------------

module "secrets" {
  source = "./modules/secrets"

  cloud_provider = var.cloud_provider
  environment    = var.environment
  project_name   = var.project_name
  region         = var.region
}

# -----------------------------------------------------------------------------
# Compute Module (Container Orchestration)
# -----------------------------------------------------------------------------

module "compute" {
  source = "./modules/compute"

  cloud_provider  = var.cloud_provider
  environment     = var.environment
  project_name    = var.project_name
  region          = var.region
  cpu             = var.compute_cpu
  memory          = var.compute_memory
  desired_count   = var.compute_desired_count
  container_image = var.container_image

  # Network dependencies
  vpc_id             = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids
  compute_security_group_id = module.networking.compute_security_group_id

  # Database connection
  db_connection_string = module.database.connection_string

  # Secrets
  secret_arns = module.secrets.secret_arns
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "service_url" {
  description = "URL of the deployed platform API"
  value       = module.compute.service_url
}

output "database_host" {
  description = "Database hostname"
  value       = module.database.host
  sensitive   = true
}

output "vpc_id" {
  description = "VPC/VNet identifier"
  value       = module.networking.vpc_id
}
