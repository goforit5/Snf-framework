# =============================================================================
# Staging Environment — SNF Agentic Platform
# =============================================================================
# Single AZ, smaller instances, cost-optimized for development and QA.
# Uses the same module structure as production for environment parity.
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  # S3 backend — bucket name suffixed with account ID at init time:
  #   terraform init -backend-config="bucket=snf-terraform-state-<ACCOUNT_ID>"
  backend "s3" {
    bucket         = "snf-terraform-state" # overridden at init via -backend-config
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true # HIPAA: state file encryption
    dynamodb_table = "snf-terraform-locks"
  }
}

module "snf_platform" {
  source = "../../"

  # --- Cloud Provider ---
  cloud_provider = "aws" # Change to "azure" if Ensign chooses Azure

  # --- Environment ---
  environment  = "staging"
  project_name = "snf-agentic-platform"
  region       = "us-east-1" # Or "eastus" for Azure

  # --- Networking ---
  vpc_cidr = "10.0.0.0/16"
  az_count = 1 # Single AZ for staging (cost savings)

  # --- Database ---
  db_instance_size         = "db.r6g.large"     # AWS Aurora (Azure: "GP_Standard_D2s_v3")
  db_storage_gb            = 50                  # Smaller storage for staging
  db_backup_retention_days = 7                   # 7-day backups for staging

  # --- Compute ---
  compute_cpu           = 512                    # 0.5 vCPU
  compute_memory        = 1024                   # 1 GB
  compute_desired_count = 1                      # Single instance for staging
  container_image       = "snf-agentic-platform:staging"
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
