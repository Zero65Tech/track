resource "google_project_service" "cloudrun" {
  service = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "cloudrun" {
  account_id = "cloudrun-${var.name}"
}

resource "google_service_account_iam_member" "cloudrun_user_cloudbuild" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${google_service_account.cloudrun.email}"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.cloudbuild.email}"
}

// Cloud Run Service

resource "google_cloud_run_v2_service" "backend" {
  name     = var.name
  location = var.region
  template {
    containers {
      image = "us-docker.pkg.dev/cloudrun/container/hello"
      ports {
        container_port = 8080
      }
      name = "default"
      resources {
        limits = {
          cpu    = "1"
          memory = "128Mi"
        }
        cpu_idle = true
        startup_cpu_boost = true
      }
      startup_probe {
        tcp_socket {
          port = 8080
        }
        initial_delay_seconds = 0
        period_seconds = 5
        failure_threshold = 1
        timeout_seconds = 5
      }
      env {
        name  = "STAGE"
        value = var.stage
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name = "MONGODB_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mongodb-url.secret_id
            version = "latest"
          }
        }
      }
    }
    timeout = "5s"
    max_instance_request_concurrency = 10
    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }
    service_account = google_service_account.cloudrun.email
  }
  ingress = "INGRESS_TRAFFIC_ALL"
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image,
      scaling
    ]
  }
}

// Cloud Run Service Public Access

resource "google_cloud_run_service_iam_binding" "public_access" {
  service  = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}

