terraform { 
  cloud { 
    organization = "Zero65Tech" 
    workspaces { 
      name = "track_zero65" 
    } 
  } 
}

module "track-v4" {
  source      = "../module"
  name        = "track-v4"
  stage       = "prod"
  github      = {
    org = "Zero65Tech"
    repo = "track-v4"
  }
  project_id  = "zero65"
  region      = "asia-south1"
  zone        = "asia-south1-a"
}

module "track-v5" {
  source      = "../module"
  name        = "track-v5"
  stage       = "prod"
  github      = {
    org = "Zero65Tech"
    repo = "track"
  }
  project_id  = "zero65"
  region      = "asia-south1"
  zone        = "asia-south1-a"
}

module "paisa-v5" {
  source      = "../module"
  name        = "paisa-v5"
  stage       = "prod"
  github      = {
    org = "Zero65Tech"
    repo = "track"
  }
  project_id  = "zero65"
  region      = "asia-south1"
  zone        = "asia-south1-a"
}
