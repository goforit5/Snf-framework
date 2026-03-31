# =============================================================================
# Production Environment — SNF Agentic Platform
# =============================================================================
# Multi-AZ, larger instances, enhanced monitoring, deletion protection.
# HIPAA-compliant configuration for Ensign Group's healthcare workload.
#
# Production Safeguards:
# - Multi-AZ for high availability
# - Deletion protection on database
# - 30-day backup retention (long-term archival separate)
# - Enhanced monitoring and audit logging
# - Geo-redundant backups (Azure)
# - Private cluster API (Azure AKS)
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  # Uncomment and configure for your cloud provider:

  # AWS S3 backend
  # backend "s3" {
  #   bucket         = "snf-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true  # HIPAA: state file encryption
  #   dynamodb_table = "snf-terraform-locks"
  # }

  # Azure Blob backend
  # backend "azurerm" {
  #   resource_group_name  = "snf-terraform-state-rg"
  #   storage_account_name = "snftfstate"
  #   container_name       = "tfstate"
  #   key                  = "production/terraform.tfstate"
  # }
}

module "snf_platform" {
  source = "../../"

  # --- Cloud Provider ---
  cloud_provider = "aws" # Change to "azure" if Ensign chooses Azure

  # --- Environment ---
  environment  = "production"
  project_name = "snf-agentic-platform"
  region       = "us-east-1" # Or "eastus" for Azure

  # --- Networking ---
  vpc_cidr = "10.0.0.0/16"
  az_count = 3 # Multi-AZ for production HA

  # --- Database ---
  db_instance_size         = "db.r6g.xlarge"     # AWS Aurora (Azure: "GP_Standard_D4s_v3")
  db_storage_gb            = 500                  # Production storage
  db_backup_retention_days = 30                   # 30-day automated backups

  # --- Compute ---
  compute_cpu           = 2048                    # 2 vCPU
  compute_memory        = 4096                    # 4 GB
  compute_desired_count = 3                       # 3 instances across AZs
  container_image       = "snf-agentic-platform:latest"
}

# --- Outputs ---

output "service_url" {
  value = module.snf_platform.service_url
}

output "database_host" {
  value     = module.snf_platform.database_host
  sensitive = true
}

output "vpc_id" {
  value = module.snf_platform.vpc_id
}
