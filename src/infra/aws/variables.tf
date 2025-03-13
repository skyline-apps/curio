variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
}

variable "api_endpoint" {
  description = "API endpoint URL to send email contents"
  type        = string
}

variable "ses_email_identity" {
  description = "Email domain to verify for SES"
  type        = string
}

variable "vercel_protection_bypass" {
  description = "Vercel protection bypass token"
  type        = string
  sensitive   = true
}

variable "curio_app_secret" {
  description = "Curio app secret for API authentication"
  type        = string
  sensitive   = true
}

variable "project_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "curio"
}
