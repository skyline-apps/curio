variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
}

variable "project_prefix" {
  description = "Project name"
  type        = string
  default     = "curio"
}

variable "initial_node_count" {
  description = "Initial number of nodes in the cluster"
  type        = number
  default     = 1
}

variable "min_nodes" {
  description = "Minimum number of nodes in the cluster"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum number of nodes in the cluster"
  type        = number
  default     = 1
}

variable "disk_size_gb" {
  description = "Disk size for GKE nodes in GB"
  type        = number
  default     = 40
}

variable "persistent_volume_disk_size_gb" {
  description = "Size of each persistent volume disk in GB"
  type        = number
  default     = 20
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
