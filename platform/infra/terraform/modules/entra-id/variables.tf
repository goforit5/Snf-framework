# =============================================================================
# Entra ID Module — Variables
# =============================================================================

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'"
  }
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "snf-platform"
}

variable "tenant_domain" {
  description = "Azure AD tenant domain (e.g. ensigngroup.onmicrosoft.com)"
  type        = string
}
