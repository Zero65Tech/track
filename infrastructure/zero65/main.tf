terraform { 
  cloud { 
    organization = "Zero65Tech" 
    workspaces { 
      name = "zero65" 
    } 
  } 
}

module "track-v4" {
  source     = "../module"
  project_id = "zero65" 
  region     = "asia-south1"
  zone       = "asia-south1-a"
  name       = "track-v4"
  stage      = "prod"
}

module "paisa-v4" {
  source     = "../module"
  project_id = "zero65" 
  region     = "asia-south1"
  zone       = "asia-south1-a"
  name       = "paisa-v4"
  stage      = "prod"
}
