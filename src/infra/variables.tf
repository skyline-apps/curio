variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "project_prefix" {
  description = "Project name"
  type        = string
  default     = "curio"
}

variable "curio_app_secret" {
  description = "Curio app secret for API authentication"
  type        = string
  sensitive   = true
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

variable "curio_email_api_endpoint" {
  description = "Curio email receipt API endpoint URL"
  type        = string
}

variable "receiver_email_domain" {
  description = "Domain to use for receiving mail"
  type        = string
}

variable "sender_email_domain" {
  description = "Domain to use for sending mail"
  type        = string
}

variable "project_forwarding_email_address" {
  description = "Email address to forward sender domain emails to"
  type        = string
}

variable "bounce_webhook_url" {
  description = "Webhook URL to receive SES bounce notifications"
  type        = string
}
