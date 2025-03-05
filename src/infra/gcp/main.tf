# Enable required Google Cloud APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "servicenetworking.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com"
  ])

  service            = each.key
  disable_on_destroy = false
}