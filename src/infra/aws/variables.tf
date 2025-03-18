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

variable "ses_email_identity_receiver" {
  description = "Email domain to verify for SES (receiver)"
  type        = string
}

variable "ses_email_identity_sender" {
  description = "Email domain to verify for SES (sender)"
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

variable "email_healthcheck_warn_endpoint" {
  description = "Endpoint URL to send warnings on email ingestion"
  type        = string
}

variable "email_healthcheck_error_endpoint" {
  description = "Endpoint URL to send errors on email ingestion"
  type        = string
}

variable "email_healthcheck_token" {
  description = "Token for email healthcheck"
  type        = string
  sensitive   = true
}
