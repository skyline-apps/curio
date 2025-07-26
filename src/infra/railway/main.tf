terraform {
  required_providers {
    railway = {
      source = "terraform-community-providers/railway"
    }
  }
}

provider "railway" {
}

locals {
  staging_envs = { for tuple in regexall("(.*)=(.*)", file(".env.staging")) : tuple[0] => tuple[1] }
  prod_envs    = { for tuple in regexall("(.*)=(.*)", file(".env.prod")) : tuple[0] => tuple[1] }
}

resource "railway_project" "search" {
  name = "search"
}

resource "railway_environment" "staging" {
  name       = "staging"
  project_id = railway_project.search.id
}

resource "railway_service" "search_staging" {
  project_id = railway_project.search.id
  name       = "search"

  source_repo        = "getmeili/meilisearch"
  source_repo_branch = "v1.12"
  config_path        = "./railway.toml"


  volume = {
    mount_path = "/meili_data"
    name       = "search-data"
  }
}

resource "railway_variable_collection" "search_staging" {
  environment_id = railway_environment.staging.id
  service_id     = railway_service.search_staging.id

  variables = [
    {
      name  = "MEILI_MASTER_KEY"
      value = local.staging_envs["SEARCH_MASTER_API_KEY"]
    },
    {
      name  = "MEILI_ENV"
      value = "production"
    },
    // Uncomment this to import a dump. Also uncomment the preDeployCommand in railway.toml
    {
      name  = "MEILI_IMPORT_DUMP"
      value = "/meili_data/import.dump"
    },
  ]
}
