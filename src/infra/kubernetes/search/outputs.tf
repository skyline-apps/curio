# Namespace Outputs
output "namespace_names" {
  description = "Names of created namespaces"
  value       = [for ns in kubernetes_namespace.app_namespaces : ns.metadata[0].name]
}

# Meilisearch Service Outputs
output "meilisearch_service_name" {
  description = "Name of the Meilisearch service"
  value       = kubernetes_service.meilisearch.metadata[0].name
}

output "meilisearch_namespace" {
  description = "Namespace where Meilisearch is deployed"
  value       = var.default_namespace
}

# Meilisearch Secret Outputs
output "meilisearch_secret_name" {
  description = "Name of the Meilisearch secret"
  value       = kubernetes_secret.meilisearch_key.metadata[0].name
}

# Persistent Volume Claim Outputs
output "meilisearch_pvc_name" {
  description = "Name of the Meilisearch Persistent Volume Claim"
  value       = kubernetes_persistent_volume_claim.meilisearch_pvc.metadata[0].name
}

# Sensitive Master Key Output
output "meilisearch_master_key" {
  description = "Generated Meilisearch master key"
  value       = random_password.meilisearch_master_key.result
  sensitive   = true
}
