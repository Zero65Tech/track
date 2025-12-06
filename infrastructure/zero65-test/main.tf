terraform { 
  cloud { 
    organization = "Zero65Tech" 
    workspaces { 
      name = "zero65-test" 
    } 
  } 
}

module "track-v4" {
  source     = "../module"
  project_id = "zero65-test" 
  region     = "asia-south1"
  zone       = "asia-south1-a"
  name       = "track-v4"
  stage      = "beta"
}
