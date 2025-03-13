module "aws" {
  source = "./aws"

  environment    = "prod"
  project_prefix = var.project_prefix

  api_endpoint             = var.curio_email_api_endpoint
  ses_email_identity       = var.email_domain
  curio_app_secret         = var.curio_app_secret
  vercel_protection_bypass = var.vercel_protection_bypass
}

# GCP Module
module "gcp" {
  source     = "./gcp"
  project_id = var.gcp_project_id
}

# GKE Cluster Module
module "gke" {
  source = "./gcp/gke"

  project_id = var.gcp_project_id

  # Use module defaults for region and zone
  region = module.gcp.region
  zone   = module.gcp.zone

  # Cluster configuration
  cluster_name       = var.project_prefix
  initial_node_count = var.initial_node_count
  min_nodes          = var.min_nodes
  max_nodes          = var.max_nodes
  disk_size_gb       = var.disk_size_gb

  # Persistent volume configuration
  namespaces                     = ["staging", "prod"]
  persistent_volume_disk_size_gb = var.persistent_volume_disk_size_gb
}
