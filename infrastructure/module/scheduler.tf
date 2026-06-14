resource "google_project_service" "cloudscheduler" {
  service = "cloudscheduler.googleapis.com"
  disable_on_destroy = false
}

resource "google_service_account" "cloudscheduler" {
  account_id = "cloudscheduler-${var.name}"
}

resource "google_cloud_scheduler_job" "trigger_processor" {
  name             = "${var.name}-worker"
  region           = var.region
  description      = "Invoke worker service to process pending triggers every minute"
  schedule         = "* * * * *"
  time_zone        = "Asia/Calcutta"

  http_target {
    uri        = "${google_cloud_run_v2_service.worker.uri}/api/triggers/process"
    http_method = "GET"
    oidc_token {
      service_account_email = google_service_account.cloudscheduler.email
      audience              = google_cloud_run_v2_service.worker.uri
    }
  }

  attempt_deadline = "600s"
}
