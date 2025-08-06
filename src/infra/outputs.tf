output "aws" {
  value = module.aws
}

output "gcp" {
  value = module.gcp
}

output "project_id" {
  value = var.gcp_project_id
}

output "zone" {
  value = module.gcp.zone
}

output "cluster_name" {
  value = var.project_prefix
}
