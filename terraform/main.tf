# terraform/main.tf
# Configuración principal de infraestructura AWS para Helpdesk

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Descomentar para usar estado remoto en S3
  # backend "s3" {
  #   bucket         = "helpdesk-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Proyecto    = "Helpdesk"
      Grupo       = "Grupo 4"
      Ambiente    = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# ==================== VPC ====================
module "vpc" {
  source = "./modules/vpc"

  project_name     = var.project_name
  environment      = var.environment
  cidr_block       = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
  
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ==================== ECS CLUSTER ====================
module "ecs" {
  source = "./modules/ecs"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  container_port     = var.container_port

  # Task definitions
  tickets_service_image    = var.tickets_service_image
  routing_service_image    = var.routing_service_image
  notifications_service_image = var.notifications_service_image

  # DB credentials (from RDS module)
  db_host     = module.rds.db_endpoint
  db_name     = module.rds.db_name
  db_user     = var.db_user
  db_password = var.db_password
  
  # NATS
  nats_url = "nats://${module.ecs.nats_service_url}:4222"

  depends_on = [module.rds, module.security_groups]
}

# ==================== RDS DATABASE ====================
module "rds" {
  source = "./modules/rds"

  project_name   = var.project_name
  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  db_subnet_ids  = module.vpc.private_subnet_ids
  
  db_name           = var.db_name
  db_user           = var.db_user
  db_password       = var.db_password
  db_instance_class = var.db_instance_class
  
  security_group_id = module.security_groups.rds_sg_id

  depends_on = [module.security_groups]
}

# ==================== APPLICATION LOAD BALANCER ====================
module "alb" {
  source = "./modules/alb"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_id  = module.security_groups.alb_sg_id
  
  target_group_arn = module.ecs.alb_target_group_arn
  ecs_service_port = var.container_port

  depends_on = [module.security_groups]
}

# ==================== CLOUDMAP (SERVICE DISCOVERY) ====================
module "cloudmap" {
  source = "./modules/cloudmap"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id

  services = {
    tickets_service = {
      name = "tickets"
      port = var.container_port
    }
    routing_service = {
      name = "routing"
      port = 3001 # Worker
    }
    notifications_service = {
      name = "notifications"
      port = 3002 # Worker
    }
    nats_service = {
      name = "nats"
      port = 4222
    }
  }
}

# ==================== ECR REPOSITORIES ====================
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment

  repositories = [
    "tickets-service",
    "routing-service",
    "notifications-service",
    "frontend"
  ]
}

# ==================== SECURITY GROUPS ====================
module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# ==================== IAM ROLES ====================
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
  
  ecr_repositories = module.ecr.repository_arns
}

# ==================== CLOUDWATCH ====================
module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name = var.project_name
  environment  = var.environment
  
  log_group_names = [
    "/ecs/tickets-service",
    "/ecs/routing-service",
    "/ecs/notifications-service",
    "/ecs/nats-service"
  ]
}

# ==================== S3 FRONTEND ====================
module "s3_frontend" {
  source = "./modules/s3-frontend"

  project_name = var.project_name
  environment  = var.environment
  
  # Enable CloudFront (optional)
  enable_cloudfront = var.enable_cloudfront
  alb_dns_name      = module.alb.alb_dns_name
}

# ==================== Data Sources ====================
data "aws_availability_zones" "available" {
  state = "available"
}

# ==================== Outputs ====================
output "alb_dns_name" {
  description = "DNS nombre del Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "api_endpoint" {
  description = "Endpoint del API (tickets-service)"
  value       = "http://${module.alb.alb_dns_name}"
}

output "frontend_url" {
  description = "URL del frontend"
  value       = var.enable_cloudfront ? module.s3_frontend.cloudfront_domain_name : module.s3_frontend.s3_website_endpoint
}

output "rds_endpoint" {
  description = "Endpoint de la base de datos RDS"
  value       = module.rds.db_endpoint
}

output "cloudmap_namespace" {
  description = "Namespace privado de CloudMap"
  value       = module.cloudmap.private_namespace
}

output "nats_service_discovery_url" {
  description = "URL de NATS vía service discovery"
  value       = "nats.app.internal:4222"
}
