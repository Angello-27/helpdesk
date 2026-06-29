# 📝 Guía de Implementación Paso a Paso - Helpdesk

## Fase 1: Setup Inicial (30 min)

### 1.1 Crear estructura de directorios

```bash
mkdir -p helpdesk-project
cd helpdesk-project

# Backend
mkdir -p backend/{tickets-service,routing-service,notifications-service,shared}/{src,node_modules}

# Frontend
mkdir -p frontend/components

# Terraform
mkdir -p terraform/modules/{vpc,ecs,rds,alb,cloudmap,ecr,iam,security-groups,s3-frontend,cloudwatch}

# Docs
mkdir -p docs

echo "✅ Estructura creada"
```

### 1.2 Inicializar repositorio Git

```bash
git init
git config user.name "Grupo 4"
git config user.email "grupo4@helpdesk.local"

# Crear .gitignore
touch .gitignore
```

### 1.3 Copiar archivos base

```bash
# Copiar los archivos que hemos creado:
# - .gitignore
# - docker-compose.yml
# - init-db.sql
# - README.md
# - terraform/main.tf, variables.tf, etc.
```

---

## Fase 2: Desarrollo Local (1-2 horas)

### 2.1 Crear Tickets Service

```bash
cd backend/tickets-service

# package.json
cat > package.json << 'EOF'
{
  "name": "tickets-service",
  "version": "1.0.0",
  "description": "Servicio de CRUD de tickets",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "start:dev": "ts-node src/main.ts",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.10.0",
    "nats": "^2.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@nestjs/cli": "^10.0.0"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

npm install

# Crear estructura src/
mkdir -p src/{entities,dto,tickets}

echo "✅ Tickets Service setup completado"
```

### 2.2 Crear Routing Service

```bash
cd ../routing-service

# package.json (similar)
cat > package.json << 'EOF'
{
  "name": "routing-service",
  "version": "1.0.0",
  "description": "Servicio worker para asignación de tickets",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "start:dev": "ts-node src/main.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.10.0",
    "nats": "^2.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  }
}
EOF

# tsconfig.json (copiar del anterior)
# Dockerfile (copiar del anterior)

npm install

mkdir -p src/{routing}

echo "✅ Routing Service setup completado"
```

### 2.3 Crear Notifications Service

```bash
cd ../notifications-service

# Igual que routing-service pero con el nombre notifications
npm install

mkdir -p src/{notifications}

echo "✅ Notifications Service setup completado"
```

### 2.4 Crear Frontend

```bash
cd ../../frontend

# package.json (opcional, si quisieran bundling)
cat > package.json << 'EOF'
{
  "name": "helpdesk-frontend",
  "version": "1.0.0",
  "description": "Frontend SPA del Helpdesk",
  "scripts": {
    "build": "echo 'Static files ready'",
    "serve": "python -m http.server 3001"
  }
}
EOF

# nginx.conf (si usan Nginx en Docker)
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        location /api/ {
            proxy_pass http://tickets-service:3000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF

mkdir -p components

echo "✅ Frontend setup completado"
```

### 2.5 Levantar stack local

```bash
cd ../..

# Construir imágenes
docker-compose build

# Levantar servicios
docker-compose up -d

# Esperar a que estén listos
sleep 10

# Verificar salud
docker-compose logs tickets-service | grep "✅ Tickets Service"
docker-compose logs postgres | grep "database system is ready"

echo "✅ Stack local corriendo"
```

### 2.6 Probar APIs

```bash
# Crear ticket
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Prueba local",
    "categoria": "redes",
    "prioridad": "media",
    "solicitante_nombre": "Test User",
    "solicitante_email": "test@local.dev"
  }'

# Listar tickets
curl http://localhost:3000/tickets

# Ver logs
docker-compose logs -f routing-service | grep "Procesando"
docker-compose logs -f notifications-service | grep "Notificado"

echo "✅ APIs funcionando"
```

---

## Fase 3: Build Docker Images (1 hora)

### 3.1 Crear Dockerfiles completos

```bash
# Cada servicio necesita su Dockerfile optimizado
# Ver ejemplos arriba

cd backend/tickets-service

# Multi-stage build (recomendado)
cat > Dockerfile << 'EOF'
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --only=production
EXPOSE 3000
CMD ["npm", "start"]
EOF

echo "✅ Dockerfiles creados"
```

### 3.2 Probar builds

```bash
# Test local builds
docker build -t tickets-service:test ./backend/tickets-service
docker build -t routing-service:test ./backend/routing-service
docker build -t notifications-service:test ./backend/notifications-service
docker build -t helpdesk-frontend:test ./frontend

docker images | grep helpdesk

echo "✅ Imágenes locales construidas"
```

---

## Fase 4: Terraform Setup (1-2 horas)

### 4.1 Crear módulos Terraform

```bash
cd terraform

# VPC Module
mkdir -p modules/vpc
cat > modules/vpc/main.tf << 'EOF'
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Route Table Público
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block      = "0.0.0.0/0"
    gateway_id      = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  value = [for s in aws_subnet.private : s.id]
}
EOF

cat > modules/vpc/variables.tf << 'EOF'
variable "project_name" {
  type = string
}

variable "cidr_block" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}
EOF

echo "✅ VPC Module creado"
```

### 4.2 Crear módulos de RDS, ECS, ALB, etc

```bash
# Esto requeriría muchas líneas. Usar referencia de proyecto real:
# https://github.com/terraform-aws-modules/terraform-aws-rds/
# https://github.com/terraform-aws-modules/terraform-aws-ecs/

# Para este proyecto, puede ser simpler empezar con resources
# directos en main.tf y luego refactorizar a módulos

echo "✅ Crear módulos siguiendo estructura..."
```

### 4.3 Terraform Plan

```bash
cd terraform

# Configurar credenciales AWS
export AWS_PROFILE=default
aws sts get-caller-identity

# Inicializar
terraform init

# Plan (ver qué se va a crear)
terraform plan -var-file="terraform.tfvars"

# Si todo OK:
echo "✅ Plan completado"
```

---

## Fase 5: Despliegue en AWS (1-2 horas)

### 5.1 Pushear imágenes a ECR

```bash
#!/bin/bash
# build-and-push.sh

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Login
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Crear repos
aws ecr create-repository --repository-name tickets-service --region $AWS_REGION || true
aws ecr create-repository --repository-name routing-service --region $AWS_REGION || true
aws ecr create-repository --repository-name notifications-service --region $AWS_REGION || true
aws ecr create-repository --repository-name helpdesk-frontend --region $AWS_REGION || true

# Build y push
services=("tickets-service" "routing-service" "notifications-service" "helpdesk-frontend")

for service in "${services[@]}"; do
  if [ "$service" = "helpdesk-frontend" ]; then
    docker build -t $service:latest ./frontend
  else
    docker build -t $service:latest ./backend/$service
  fi
  
  docker tag $service:latest $ECR_REGISTRY/$service:latest
  docker push $ECR_REGISTRY/$service:latest
  echo "✅ $service pushed"
done

echo "✅ Todas las imágenes en ECR"
```

### 5.2 Aplicar Terraform

```bash
cd terraform

# Actualizar tfvars con ECR URIs
# vi terraform.tfvars
# Cambiar:
# tickets_service_image = "123456789.dkr.ecr.us-east-1.amazonaws.com/tickets-service:latest"
# etc.

# Aplicar
terraform apply -var-file="terraform.tfvars"

# Esperar 15-20 minutos...

# Guardar outputs
terraform output > ../deployment.log

# Obtener endpoints
ALB_DNS=$(terraform output -raw alb_dns_name)
echo "API: http://$ALB_DNS"

echo "✅ Infraestructura desplegada"
```

### 5.3 Verificar despliegue

```bash
ALB_DNS=$(cd terraform && terraform output -raw alb_dns_name)

# Probar API
curl http://$ALB_DNS/tickets

# Ver logs
aws logs tail /ecs/tickets-service --follow

# Verificar RDS
aws rds describe-db-instances --db-instance-identifier helpdesk-postgres-dev

echo "✅ Despliegue verificado"
```

---

## Fase 6: Testing End-to-End (30 min)

### 6.1 Test de flujo completo

```bash
#!/bin/bash
# test-e2e.sh

ALB_DNS=$(cd terraform && terraform output -raw alb_dns_name)
API_URL="http://$ALB_DNS"

echo "🧪 Testing E2E..."

# 1. Crear ticket
TICKET=$(curl -s -X POST $API_URL/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Test E2E",
    "categoria": "redes",
    "prioridad": "alta",
    "solicitante_nombre": "Test User",
    "solicitante_email": "test@e2e.local"
  }')

TICKET_ID=$(echo $TICKET | jq -r '.id')
echo "✅ Ticket creado: $TICKET_ID"

# 2. Esperar a que routing asigne
sleep 3

# 3. Verificar asignación
TICKET_STATE=$(curl -s $API_URL/tickets/$TICKET_ID | jq '.estado')
echo "✅ Estado del ticket: $TICKET_STATE"

if [ "$TICKET_STATE" = '"asignado"' ]; then
  echo "✅ Ticket asignado correctamente"
elif [ "$TICKET_STATE" = '"sin_asignar"' ]; then
  echo "⚠️ Ticket sin agentes disponibles"
else
  echo "❌ Estado inesperado: $TICKET_STATE"
fi

# 4. Ver logs de routing
echo "📋 Logs de routing-service:"
aws logs tail /ecs/routing-service --follow --lines 20

echo "✅ E2E Testing completado"
```

### 6.2 Performance testing

```bash
# Crear 100 tickets
for i in {1..100}; do
  curl -X POST http://$ALB_DNS/tickets \
    -H "Content-Type: application/json" \
    -d "{
      \"asunto\": \"Ticket $i\",
      \"categoria\": \"hardware\",
      \"prioridad\": \"media\",
      \"solicitante_nombre\": \"User $i\",
      \"solicitante_email\": \"user$i@test.local\"
    }" &
done

wait

# Ver estadísticas
curl http://$ALB_DNS/tickets | jq '.total'

echo "✅ Load testing completado"
```

---

## Fase 7: Documentación y Demo (1 hora)

### 7.1 Crear documentación

```bash
# Ya tenemos:
# - README.md
# - FLUJO_EVENTOS_COMPLETO.md
# - Agregar:
# - ARQUITECTURA.md (diagrama)
# - DEPLOYMENT.md (paso a paso)
# - TROUBLESHOOTING.md

echo "✅ Documentación completa"
```

### 7.2 Preparar presentación

```bash
# Preparar diapositivas con:
# 1. Problema -> Solución
# 2. Arquitectura (diagrama)
# 3. Flujo de eventos (animado)
# 4. Código clave (snippets)
# 5. Terraform (modules)
# 6. Decisiones de diseño
# 7. Demo en vivo
# 8. Costos y mejoras futuras

echo "✅ Presentación lista"
```

---

## Checklist Final

- [ ] 3 microservicios implementados (tickets, routing, notifications)
- [ ] Frontend CRUD completado y desplegado
- [ ] Docker Compose funcional para desarrollo
- [ ] Terraform con módulos y variables
- [ ] Base de datos PostgreSQL con schema
- [ ] NATS configurado para eventos
- [ ] CloudWatch Logs configurado
- [ ] Security Groups con mínimo privilegio
- [ ] CloudMap para service discovery
- [ ] ALB exponiendo API
- [ ] S3 sirviendo frontend
- [ ] README.md completo
- [ ] Documentación de arquitectura
- [ ] Diagrama de flujo de eventos
- [ ] Tests E2E pasando
- [ ] Presentación preparada
- [ ] Demo ensayada

---

## Línea de tiempo estimada

| Fase      | Tiempo   | Tareas                      |
| --------- | -------- | --------------------------- |
| 1         | 30 min   | Setup, Git, directorios     |
| 2         | 1-2h     | Dev local, Docker Compose   |
| 3         | 1h       | Dockerfiles, build test     |
| 4         | 1-2h     | Terraform modules           |
| 5         | 1-2h     | ECR, apply, verificación    |
| 6         | 30 min   | E2E testing                 |
| 7         | 1h       | Documentación, presentación |
| **Total** | **6-9h** | **Proyecto completo**       |

---

## Preguntas que surgirán

**P: ¿Cuándo creo la tabla de agentes?**  
R: En `init-db.sql` se crea automáticamente cuando levanta PostgreSQL. Ver section `SEED DATA`.

**P: ¿Cómo agrego más agentes?**  
R: `docker exec postgres psql -U helpdesk_user -d helpdesk_db -c "INSERT INTO agents (nombre, email, categoria, status) VALUES (...)"`

**P: ¿Dónde configuro CORS?**  
R: En `tickets-service/src/main.ts` → `app.enableCors()`

**P: ¿Cómo veo NATS en funcionamiento?**  
R: <http://localhost:8222> (admin UI) o `docker logs helpdesk-nats`

---

## Recursos útiles

- [NestJS Docs](https://docs.nestjs.com)
- [NATS Docs](https://docs.nats.io)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [ECS Task Definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)

---

**¡Éxito con el proyecto!** 🚀
