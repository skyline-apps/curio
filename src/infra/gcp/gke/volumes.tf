resource "google_compute_disk" "persistent_volumes" {
  for_each = toset(var.namespaces)
  provider = google-beta

  name = "${var.cluster_name}-${each.key}-pv"
  type = var.persistent_volume_disk_type
  size = var.persistent_volume_disk_size_gb
  zone = var.zone

  labels = {
    cluster = var.cluster_name
    purpose = "persistent-volume"
  }
}
resource "google_compute_resource_policy" "daily_snapshot" {
  name    = "${var.cluster_name}-daily-snapshot-policy"
  project = var.project_id
  region  = var.region

  snapshot_schedule_policy {
    schedule {
      dynamic "daily_schedule" {
        for_each = [1]
        content {
          days_in_cycle = 1
          start_time    = "00:00"
        }
      }
    }
    retention_policy {
      max_retention_days    = 14
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }
    snapshot_properties {
      labels            = {}
      storage_locations = ["us"]
      guest_flush       = true
    }
  }
}

resource "google_compute_disk_resource_policy_attachment" "attachment" {
  for_each = google_compute_disk.persistent_volumes

  name    = google_compute_resource_policy.daily_snapshot.name
  disk    = each.value.name
  project = var.project_id
  zone    = var.zone

  lifecycle {
    replace_triggered_by = [google_compute_resource_policy.daily_snapshot]
  }
}
