resource "google_secret_manager_secret" "mongodb-url" {
  secret_id = "${var.name}_mongodb-url"
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
}

resource "google_secret_manager_secret_iam_member" "mongodb-url_access_cloudrun" {
  secret_id = google_secret_manager_secret.mongodb-url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun.email}"
}