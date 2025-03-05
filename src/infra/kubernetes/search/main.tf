resource "kubernetes_namespace" "app_namespaces" {
  for_each = toset(var.app_namespaces)

  metadata {
    name = each.key
    
    labels = {
      environment = each.key == "prod" ? "production" : "staging"
      cluster     = var.cluster_name
    }
  }
}

# Meilisearch Persistent Volume Claim
resource "kubernetes_persistent_volume_claim" "meilisearch_pvc" {
  metadata {
    name      = "${var.cluster_name}-meilisearch-data"
    namespace = var.cluster_name
    labels = {
      app     = "meilisearch"
      cluster = var.cluster_name
    }
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "${var.persistent_volume_disk_size_gb}Gi"
      }
    }
  }
}

# ConfigMap for Meilisearch init script
resource "kubernetes_config_map" "meilisearch_init" {
  metadata {
    name      = "${var.cluster_name}-meilisearch-init"
    namespace = var.cluster_name
    labels = {
      cluster = var.cluster_name
    }
  }

  data = {
    "init.sh" = var.init_script_content
  }
}

# Meilisearch Deployment
resource "kubernetes_deployment" "meilisearch" {
  metadata {
    name      = "${var.cluster_name}-meilisearch"
    namespace = var.cluster_name
    labels = {
      app     = "meilisearch"
      cluster = var.cluster_name
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app     = "meilisearch"
        cluster = var.cluster_name
      }
    }

    template {
      metadata {
        labels = {
          app     = "meilisearch"
          cluster = var.cluster_name
        }
      }

      spec {
        container {
          image = var.meilisearch_image
          name  = "meilisearch"

          env {
            name  = "MEILI_ENV"
            value = "development"
          }

          env {
            name = "MEILI_MASTER_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.meilisearch_key.metadata[0].name
                key  = "SEARCH_MASTER_API_KEY"
              }
            }
          }

          command = ["/bin/sh", "/init.sh"]

          volume_mount {
            name       = "meilisearch-data"
            mount_path = "/meili_data"
          }

          volume_mount {
            name       = "init-script"
            mount_path = "/init.sh"
            sub_path   = "init.sh"
          }
        }

        volume {
          name = "meilisearch-data"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.meilisearch_pvc.metadata[0].name
          }
        }

        volume {
          name = "init-script"
          config_map {
            name = kubernetes_config_map.meilisearch_init.metadata[0].name
            default_mode = "0555"  # Make script executable
          }
        }
      }
    }
  }
}

# Meilisearch Service
resource "kubernetes_service" "meilisearch" {
  metadata {
    name      = "${var.cluster_name}-meilisearch"
    namespace = var.cluster_name
    labels = {
      cluster = var.cluster_name
    }
  }

  spec {
    selector = {
      app     = "meilisearch"
      cluster = var.cluster_name
    }

    port {
      port        = 7700
      target_port = 7700
    }

    type = "ClusterIP"
  }
}

# Secret for Meilisearch Master Key
resource "kubernetes_secret" "meilisearch_key" {
  metadata {
    name      = "${var.cluster_name}-meilisearch-secret"
    namespace = var.cluster_name
    labels = {
      cluster = var.cluster_name
    }
  }

  data = {
    SEARCH_MASTER_API_KEY = base64encode(random_password.meilisearch_master_key.result)
  }

  type = "Opaque"
}

# Generate a random master key
resource "random_password" "meilisearch_master_key" {
  length  = 32
  special = true
}
