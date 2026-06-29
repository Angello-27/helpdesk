# terraform/variables.tf
# Variables de configuración para AWS

# ==================== PROJECT VARS ====================
variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "helpdesk"
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment debe ser dev, staging o prod."
  }
}

# ==================== VPC VARS ====================
variable "vpc_cidr" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks para subnets públicas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks para subnets privadas"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ==================== ECS/CONTAINER VARS ====================
variable "container_port" {
  description = "Puerto en el contenedor"
  type        = number
  default     = 3000
}

variable "tickets_service_image" {
  description = "Imagen Docker del tickets-service"
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:latest" # Reemplazar con imagen real
}

variable "routing_service_image" {
  description = "Imagen Docker del routing-service"
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:latest" # Reemplazar con imagen real
}

variable "notifications_service_image" {
  description = "Imagen Docker del notifications-service"
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:latest" # Reemplazar con imagen real
}

variable "container_cpu" {
  description = "CPU reservada para contenedor (Fargate)"
  type        = number
  default     = 256 # 0.25 vCPU
}

variable "container_memory" {
  description = "Memoria reservada para contenedor (MB, Fargate)"
  type        = number
  default     = 512 # 512 MB
}

variable "desired_task_count" {
  description = "Número deseado de tasks en ECS"
  type        = number
  default     = 1
}

# ==================== RDS DATABASE VARS ====================
variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "helpdesk_db"
  sensitive   = true
}

variable "db_user" {
  description = "Usuario principal de la base de datos"
  type        = string
  default     = "helpdesk_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Contraseña de la base de datos (generar aleatoria en producción)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "La contraseña debe tener al menos 8 caracteres."
  }
}

variable "db_instance_class" {
  description = "Clase de instancia RDS"
  type        = string
  default     = "db.t4g.micro" # Gratis en eligible accounts
  # Opciones: db.t4g.micro, db.t4g.small, db.t4g.medium
}

variable "db_allocated_storage" {
  description = "Almacenamiento asignado (GB)"
  type        = number
  default     = 20 # Mínimo 20 GB para PostgreSQL
}

variable "db_engine_version" {
  description = "Versión de PostgreSQL"
  type        = string
  default     = "15"
}

variable "db_multi_az" {
  description = "Habilitar Multi-AZ para alta disponibilidad"
  type        = bool
  default     = false # true en producción
}

# ==================== FRONTEND VARS ====================
variable "enable_cloudfront" {
  description = "Habilitar CloudFront para el frontend"
  type        = bool
  default     = false # true en producción para mejor performance
}

variable "frontend_bucket_name" {
  description = "Nombre del bucket S3 para frontend"
  type        = string
  default     = "helpdesk-frontend"
}

# ==================== TAGS ====================
variable "common_tags" {
  description = "Tags comunes para todos los recursos"
  type        = map(string)
  default = {
    Grupo     = "Grupo 4"
    Proyecto  = "Helpdesk"
    ManagedBy = "Terraform"
  }
}

# ==================== LOCAL VARIABLES ====================
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = merge(
    var.common_tags,
    {
      Environment = var.environment
      Region      = var.aws_region
    }
  )
}
