variable "name" {
  type = string
}

variable "stage" {
  type = string
}

variable "github" {
  type = object({
    org  = string
    repo = string
  })
}
variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "zone" {
  type = string
}
