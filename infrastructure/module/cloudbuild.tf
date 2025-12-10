resource "google_project_service" "cloudbuild" {
  service = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "cloudbuild" {
  account_id = "cloudbuild-${var.name}"
}

// IAM Bindings for the Service Account

resource "google_project_iam_member" "cloudbuild_artifactregistry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_firebase_admin" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_cloudrun_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_project_iam_member" "cloudbuild_logs_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloudbuild.email}"
}

resource "google_cloudbuildv2_repository" "github_repo" {
  location    = var.region
  name        = "${var.github.org}-${var.name}"
  parent_connection = "projects/${var.project_id}/locations/${var.region}/connections/${var.github.org}"
  remote_uri  = "https://github.com/${var.github.org}/${var.github.repo}.git"
}

// Cloud Build Triggers

resource "google_cloudbuild_trigger" "frontend" {
  name     = "${var.name}-frontend"
  location = var.region
  repository_event_config {
    repository = google_cloudbuildv2_repository.github_repo.id
    push {
      branch = var.stage == "prod" ? "^master$" : ".*"
    }
  }
  included_files = [
    "shared/**",
    "frontend/**",
    "package-lock.json"
  ]
  build {
    step {
      name = "node:22-alpine"
      entrypoint = "npm"
      args = [ "install" ]
      dir = "frontend"
    }
    step {
      name = "node:22-alpine"
      entrypoint = "npm"
      args = [ "run", "build" ]
      dir = "frontend"
    }
    step {
      name = "us-docker.pkg.dev/firebase-cli/us/firebase"
      args = [ "deploy", "--project=$PROJECT_ID", "--only=hosting:${var.stage == "prod" ? var.name : var.project_id }" ]
      dir = "frontend"
    }
    options {
      logging = "CLOUD_LOGGING_ONLY"
    }
  }
  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"
  service_account = google_service_account.cloudbuild.id
}

resource "google_cloudbuild_trigger" "backend" {
  name     = "${var.name}-backend"
  location = var.region
  repository_event_config {
    repository = google_cloudbuildv2_repository.github_repo.id
    push {
      branch = var.stage == "prod" ? "^master$" : ".*"
    }
  }
  included_files = [
    "shared/**",
    "backend/**",
    "package-lock.json"
  ]
  build {
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "build", ".",
        "-t", "${google_artifact_registry_repository.artifact_registry.registry_uri}/backend:$COMMIT_SHA",
        "-f", "backend/Dockerfile",
      ]
    }
    step {
      name = "gcr.io/cloud-builders/docker"
      args = [
        "push",
        "${google_artifact_registry_repository.artifact_registry.registry_uri}/backend:$COMMIT_SHA"
      ]
    }
    step {
      name = "gcr.io/cloud-builders/gcloud"
      args = [
        "run", "deploy", var.name,
        "--image", "${google_artifact_registry_repository.artifact_registry.registry_uri}/backend:$COMMIT_SHA",
        "--region", var.region,
      ]
    }
    options {
      logging = "CLOUD_LOGGING_ONLY"
    }
  }
  include_build_logs = "INCLUDE_BUILD_LOGS_WITH_STATUS"
  service_account = google_service_account.cloudbuild.id
}
