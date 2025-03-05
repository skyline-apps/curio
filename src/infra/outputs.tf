output "gcp" {
  value = module.gcp
}

output "gke" {
  value = module.gke
}

output "project_id" {
  value = var.gcp_project_id
}

output "zone" {
  value = module.gcp.zone
}

output "cluster_name" {
  value = var.cluster_name
}

output "connection_string" {
  value = module.gke._connection_string
}

output "persistent_volume_disk_size_gb" {
  value = var.persistent_volume_disk_size_gb
}

output "primary_node_label" {
  value = module.gke.primary_node_label
}