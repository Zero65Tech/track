resource "google_project_service" "artifact_registry" {
  service = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "artifact_registry" {
  repository_id = var.name
  format        = "DOCKER"
  docker_config {
    immutable_tags = false
  }
  cleanup_policies {
    id     = "keep-most_recent_versions-10"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }
  cleanup_policies {
    id     = "delete-older_than-30days"
    action = "DELETE"
    condition {
      older_than = "30d"
    }
  }
  vulnerability_scanning_config {
    enablement_config = "DISABLED"
  }
}