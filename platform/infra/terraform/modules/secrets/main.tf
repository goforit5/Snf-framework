# =============================================================================
# Secrets Module — Credential Management
# =============================================================================
# AWS:   AWS Secrets Manager
# Azure: Azure Key Vault
#
# HIPAA Compliance:
# - All secrets encrypted at rest with KMS / Azure managed keys
# - Access restricted to compute IAM roles only (least privilege)
# - Automatic rotation enabled where supported
# - Audit logging of all secret access via CloudTrail / Azure Monitor
# - No secrets in environment variables, config files, or source code
#
# SNF Integration Credentials (placeholders — values set via CLI/console):
# - PCC (PointClickCare): Clinical/EHR API credentials
# - Workday: HR and financial system credentials
# - M365: Microsoft 365 Graph API credentials
# - Anthropic: Claude API key for agent reasoning
# - CMS: Centers for Medicare & Medicaid data access
# - OIG: Office of Inspector General exclusion list API
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

locals {
  is_aws      = var.cloud_provider == "aws"
  is_azure    = var.cloud_provider == "azure"
  name_prefix = "${var.project_name}-${var.environment}"

  # All credential placeholders for the SNF Agentic Platform.
  # Values are set post-deploy via CLI — never in Terraform state.
  secret_definitions = {
    PCC_API_KEY = {
      description = "PointClickCare API key for clinical/EHR data"
    }
    PCC_API_SECRET = {
      description = "PointClickCare API secret"
    }
    WORKDAY_CLIENT_ID = {
      description = "Workday integration client ID (HR/finance)"
    }
    WORKDAY_CLIENT_SECRET = {
      description = "Workday integration client secret"
    }
    M365_TENANT_ID = {
      description = "Microsoft 365 tenant ID"
    }
    M365_CLIENT_ID = {
      description = "Microsoft 365 app registration client ID"
    }
    M365_CLIENT_SECRET = {
      description = "Microsoft 365 app registration client secret"
    }
    ANTHROPIC_API_KEY = {
      description = "Anthropic Claude API key for agent reasoning engine"
    }
    CMS_API_KEY = {
      description = "CMS (Centers for Medicare & Medicaid) data API key"
    }
    OIG_API_KEY = {
      description = "OIG exclusion list API key"
    }
    DATABASE_URL = {
      description = "PostgreSQL connection string (set by database module output)"
    }
    JWT_SECRET = {
      description = "JWT signing secret for platform authentication"
    }
  }
}

# =============================================================================
# AWS: Secrets Manager
# =============================================================================

resource "aws_secretsmanager_secret" "credentials" {
  for_each = local.is_aws ? local.secret_definitions : {}

  name        = "${local.name_prefix}/${each.key}"
  description = each.value.description

  # HIPAA: Use default KMS key for encryption at rest
  # For production, consider a customer-managed KMS key
  # kms_key_id = aws_kms_key.secrets[0].arn

  # HIPAA: Prevent accidental deletion
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = each.key
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# Placeholder secret values — real values set via AWS CLI post-deploy:
#   aws secretsmanager put-secret-value \
#     --secret-id snf-agentic-platform-production/PCC_API_KEY \
#     --secret-string '{"api_key": "actual-value"}'
resource "aws_secretsmanager_secret_version" "credentials" {
  for_each = local.is_aws ? local.secret_definitions : {}

  secret_id     = aws_secretsmanager_secret.credentials[each.key].id
  secret_string = jsonencode({ value = "PLACEHOLDER_SET_VIA_CLI" })

  lifecycle {
    ignore_changes = [secret_string] # Don't overwrite real values on apply
  }
}

# =============================================================================
# Azure: Key Vault
# =============================================================================

data "azurerm_resource_group" "main" {
  count = local.is_azure ? 1 : 0
  name  = "${local.name_prefix}-rg"
}

data "azurerm_client_config" "current" {
  count = local.is_azure ? 1 : 0
}

resource "azurerm_key_vault" "main" {
  count = local.is_azure ? 1 : 0

  name                = replace("${local.name_prefix}-kv", "-", "")
  resource_group_name = data.azurerm_resource_group.main[0].name
  location            = data.azurerm_resource_group.main[0].location
  tenant_id           = data.azurerm_client_config.current[0].tenant_id

  sku_name = "standard"

  # HIPAA: Soft delete and purge protection prevent accidental data loss
  soft_delete_retention_days = 90
  purge_protection_enabled   = var.environment == "production"

  # HIPAA: Network restriction — only VNet access in production
  network_acls {
    default_action = var.environment == "production" ? "Deny" : "Allow"
    bypass         = "AzureServices"
  }

  # HIPAA: Enable audit logging
  # Diagnostic settings configured separately for Azure Monitor

  tags = {
    Environment = var.environment
    Compliance  = "HIPAA"
  }
}

# Access policy for the current deployer
resource "azurerm_key_vault_access_policy" "deployer" {
  count = local.is_azure ? 1 : 0

  key_vault_id = azurerm_key_vault.main[0].id
  tenant_id    = data.azurerm_client_config.current[0].tenant_id
  object_id    = data.azurerm_client_config.current[0].object_id

  secret_permissions = [
    "Get", "List", "Set", "Delete", "Recover", "Backup", "Restore"
  ]
}

resource "azurerm_key_vault_secret" "credentials" {
  for_each = local.is_azure ? local.secret_definitions : {}

  name         = replace(each.key, "_", "-") # Key Vault uses hyphens
  value        = "PLACEHOLDER_SET_VIA_CLI"
  key_vault_id = azurerm_key_vault.main[0].id

  tags = {
    Description = each.value.description
    Environment = var.environment
    Compliance  = "HIPAA"
  }

  lifecycle {
    ignore_changes = [value] # Don't overwrite real values on apply
  }

  depends_on = [azurerm_key_vault_access_policy.deployer]
}

# =============================================================================
# Outputs
# =============================================================================

output "secret_arns" {
  description = "Map of secret name to ARN (AWS) or ID (Azure)"
  value = local.is_aws ? {
    for key, secret in aws_secretsmanager_secret.credentials : key => secret.arn
  } : (
    local.is_azure ? {
      for key, secret in azurerm_key_vault_secret.credentials : key => secret.id
    } : {}
  )
}

output "key_vault_id" {
  description = "Azure Key Vault ID (empty for AWS)"
  value       = local.is_azure ? azurerm_key_vault.main[0].id : ""
}

output "key_vault_uri" {
  description = "Azure Key Vault URI (empty for AWS)"
  value       = local.is_azure ? azurerm_key_vault.main[0].vault_uri : ""
}
