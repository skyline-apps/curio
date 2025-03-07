# Connection String for Manual Credential Retrieval
output "_connection_string" {
  value       = var.enable_private_endpoint ? "gcloud container clusters get-credentials ${var.cluster_name} --zone ${var.zone} --project ${var.project_id} --internal-ip" : "gcloud container clusters get-credentials ${var.cluster_name} --zone ${var.zone} --project ${var.project_id}"
  description = "CLI command used to obtain Kubernetes credentials for the GKE cluster."
}

# IAP Tunnel Creation Command
output "create_iap_tunnel" {
  value       = var.enable_private_endpoint ? "gcloud compute ssh ${google_compute_instance.iap-proxy[0].name} --zone ${var.zone} --project ${var.project_id} -- -L 8888:localhost:8888 -N -q -f" : "N/A - private cluster not enabled"
  description = "CLI command use to enable IAP tunnel to GCE VM instance to forward kubectl commands."
}

# Debugging Outputs for Cluster Connection
output "cluster_name" {
  value       = var.cluster_name
  description = "Name of the GKE cluster"
}

output "cluster_zone" {
  value       = var.zone
  description = "Zone of the GKE cluster"
}

output "cluster_project_id" {
  value       = var.project_id
  description = "Project ID of the GKE cluster"
}

output "primary_node_label" {
  value       = "primary"
  description = "Label of the primary node pool"
}

output "address_name" {
  value       = google_compute_address.static_ip.name
  description = "Name of the static IP address"
}

output "ip_address" {
  value       = google_compute_address.static_ip.address
  description = "IP address of the static IP address"
}
