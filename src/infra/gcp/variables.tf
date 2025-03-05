variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Region to deploy GCP resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Zone to deploy GCP resources"
  type        = string
  default     = "us-central1-c"
}
