# =============================================================================
# Rotation Module — Variables
# =============================================================================

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "snf"
}

variable "region" {
  description = "AWS region for Lambda deployment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda networking (optional — omit for non-VPC deployment)"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "Private subnet IDs for Lambda VPC configuration (required if vpc_id is set)"
  type        = list(string)
  default     = []
}

variable "alarm_email" {
  description = "Email address for rotation failure alarm notifications"
  type        = string
}

variable "rotation_schedule" {
  description = "EventBridge schedule expression for credential rotation"
  type        = string
  default     = "rate(90 days)"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}
