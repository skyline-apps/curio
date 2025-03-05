variable "app_namespaces" {
  description = "List of Kubernetes namespaces to create"
  type        = list(string)
  default     = ["staging", "prod"]
}

variable "cluster_name" {
  description = "Name of the cluster"
  type        = string
}

variable "default_namespace" {
  description = "Default namespace for deployments"
  type        = string
  default     = "staging"
}

variable "persistent_volume_disk_size_gb" {
  description = "Size of persistent volume disk in GB"
  type        = number
  default     = 40
}

variable "meilisearch_image" {
  description = "Docker image for Meilisearch"
  type        = string
  default     = "getmeili/meilisearch:v1.12"
}

variable "init_script_content" {
  description = "Content of the initialization script"
  type        = string
}
