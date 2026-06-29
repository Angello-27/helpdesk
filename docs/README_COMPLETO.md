# 🎟️ Proyecto Helpdesk - Sistema de Mesa de Ayuda

Grupo 4 | Diplomado DevSecOps Essentials

Sistema de gestión de tickets de soporte con arquitectura de microservicios en AWS, desplegable con Terraform.

## 📋 Tabla de contenidos

- [Descripción General](#descripcion-general)
- [Requisitos Previos](#requisitos-previos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Desarrollo Local (Docker Compose)](#desarrollo-local-docker-compose)
- [Despliegue en AWS (Terraform)](#despliegue-en-aws-terraform)
- [Flujo de Eventos](#flujo-de-eventos)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General {#descripcion-general}

Sistema de mesa de ayuda que permite gestionar solicitudes de soporte de TI mediante:

- **Frontend**: CRUD de tickets desplegado en S3/CloudFront
- **Backend**: 3 microservicios comunicados vía NATS
  - `tickets-service`: API HTTP para CRUD de tickets
  - `routing-service`: Worker que asigna tickets a agentes
  - `notifications-service`: Worker que notifica asignaciones
- **Infraestructura**: Terraform + AWS (ECS, RDS, ALB, CloudMap)
- **Base de datos**: PostgreSQL en RDS

### Características clave

✅ CRUD de tickets  
✅ Asignación automática a agentes por categoría  
✅ Flujo de eventos asíncrono con NATS  
✅ Service discovery vía CloudMap  
✅ Logging con CloudWatch  
✅ Security Groups con mínimo privilegio  
✅ Reproducible con `terraform apply`

---

## 🔧 Requisitos Previos {#requisitos-previos}

### Para desarrollo local

```bash
# Instalar Docker y Docker Compose
docker --version  # >= 20.10
docker-compose --version  # >= 2.0

# Node.js (para desarrollo sin Docker)
node --version  # >= 18
npm --version  # >= 9
```

### Para despliegue en AWS

```bash
# AWS CLI configurado con credenciales
aws --version  # >= 2.0
aws sts get-caller-identity  # Verificar credenciales

# Terraform
terraform --version  # >= 1.0
```

### Credenciales AWS

```bash
# Configurar credenciales
aws configure

# Verifica que tengas permisos para:
# - ECS, Fargate
# - RDS, VPC
# - ALB, CloudMap
# - ECR, CloudWatch
# - S3, CloudFront (para frontend)
```

---

## 📁 Estructura del Proyecto {#estructura-del-proyecto}

```text
helpdesk-project/
├── backend/
│   ├── tickets-service/          # API HTTP
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── tickets/
│   │   │   │   ├── tickets.controller.ts
│   │   │   │   └── tickets.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       └── ticket.entity.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── routing-service/          # Worker NATS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── routing/
│   │   │   │   ├── routing.controller.ts
│   │   │   │   └── routing.service.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── notifications-service/    # Worker NATS
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── shared/
│       └── nats-config.ts
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── Dockerfile
│   └── nginx.conf
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── terraform.tfvars.example
│   ├── outputs.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── ecs/
│   │   ├── rds/
│   │   ├── alb/
│   │   ├── cloudmap/
│   │   ├── ecr/
│   │   ├── iam/
│   │   ├── security-groups/
│   │   ├── s3-frontend/
│   │   └── cloudwatch/
│   └── .gitignore
├── docker-compose.yml
├── init-db.sql
├── nginx.conf
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   ├── ARQUITECTURA.md
│   ├── FLUJO_EVENTOS.md
│   └── DEPLOYMENT.md
├── .gitignore
├── README.md
└── package.json
```

---

## 🚀 Desarrollo Local (Docker Compose) {#desarrollo-local-docker-compose}

### Setup inicial

```bash
# 1. Clonar repositorio
git clone <url-del-repo>
cd helpdesk-project

# 2. Instalar dependencias (opcional, Docker maneja esto)
npm install --workspace=backend/tickets-service
npm install --workspace=backend/routing-service
npm install --workspace=backend/notifications-service

# 3. Levantar stack completo
docker-compose up --build

# Esperar logs como:
# ✅ Tickets Service corriendo en puerto 3000
# ✅ Routing Service escuchando en NATS
# ✅ Notifications Service escuchando en NATS
# ✅ Frontend disponible en http://localhost:3001
```

### Acceso a servicios locales

| Servicio        | URL                             | Descripción          |
| --------------- | ------------------------------- | -------------------- |
| Frontend        | <http://localhost:3001>         | Interfaz web         |
| Tickets API     | <http://localhost:3000/tickets> | CRUD de tickets      |
| NATS Admin      | <http://localhost:8222>         | Monitoring NATS      |
| PostgreSQL      | localhost:5432                  | Base de datos        |
| PgAdmin (debug) | <http://localhost:5050>         | Gestor BD (opcional) |

### Ejemplos de prueba

```bash
# 1. Crear ticket
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Mi impresora no funciona",
    "descripcion": "No puedo imprimir documentos",
    "categoria": "hardware",
    "prioridad": "alta",
    "solicitante_nombre": "Juan Pérez",
    "solicitante_email": "juan@empresa.com"
  }'

# 2. Listar tickets
curl http://localhost:3000/tickets

# 3. Ver logs de routing-service
docker logs helpdesk-routing-service -f

# 4. Ver logs de notifications-service
docker logs helpdesk-notifications-service -f

# 5. Consultar BD
psql -h localhost -U helpdesk_user -d helpdesk_db
# Password: helpdesk_password
# SQL: SELECT * FROM tickets;
```

### Desarrollo iterativo

```bash
# Hot reload está habilitado
# Editar archivos en src/ se refleja automáticamente

# Ver logs en tiempo real
docker-compose logs -f tickets-service
docker-compose logs -f routing-service
docker-compose logs -f notifications-service

# Detener y reiniciar servicios específicos
docker-compose restart routing-service

# Limpiar stack (destructivo)
docker-compose down -v
```

### Monitoreo local

```bash
# CPU y memoria
docker stats

# Inspeccionar red
docker network inspect helpdesk_helpdesk-network

# Conectarse a contenedor
docker exec -it helpdesk-postgres psql -U helpdesk_user -d helpdesk_db
```

---

## ☁️ Despliegue en AWS (Terraform) {#despliegue-en-aws-terraform}

### 1. Preparación

```bash
cd terraform

# Copiar archivo de variables
cp terraform.tfvars.example terraform.tfvars

# Editar con tus valores
# IMPORTANTE: Cambiar db_password, región, etc.
vi terraform.tfvars
```

### 2. Construir imágenes Docker y pushear a ECR

```bash
# Primero crear ECR repositories
aws ecr create-repository \
  --repository-name tickets-service \
  --region us-east-1

# Construir imágenes
docker build -t tickets-service:latest ./backend/tickets-service
docker build -t routing-service:latest ./backend/routing-service
docker build -t notifications-service:latest ./backend/notifications-service
docker build -t helpdesk-frontend:latest ./frontend

# Tag y push a ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Login a ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Push imágenes
docker tag tickets-service:latest $ECR_REGISTRY/tickets-service:latest
docker push $ECR_REGISTRY/tickets-service:latest

# Repetir para otros servicios...

# Actualizar terraform.tfvars con URIs de ECR
```

### 3. Desplegar infraestructura con Terraform

```bash
# Inicializar Terraform
terraform init

# Ver cambios que se harán
terraform plan

# Aplicar cambios (puede tardar 15-20 minutos)
terraform apply

# Outputs:
# alb_dns_name = "helpdesk-lb-123456.us-east-1.elb.amazonaws.com"
# api_endpoint = "http://helpdesk-lb-123456.us-east-1.elb.amazonaws.com"
# frontend_url = "https://d123456.cloudfront.net" (si CloudFront)
```

### 4. Verificar despliegue

```bash
# Verificar ECS tasks
aws ecs describe-services \
  --cluster helpdesk-dev \
  --services tickets-service routing-service notifications-service

# Verificar RDS
aws rds describe-db-instances \
  --db-instance-identifier helpdesk-postgres-dev

# Verificar ALB health
aws elbv2 describe-target-health \
  --target-group-arn <ARN_del_target_group>

# Verificar logs CloudWatch
aws logs tail /ecs/tickets-service --follow
aws logs tail /ecs/routing-service --follow
aws logs tail /ecs/notifications-service --follow
```

### 5. Pruebas end-to-end

```bash
# Obtener DNS del ALB
ALB_DNS=$(terraform output -raw alb_dns_name)

# Crear ticket
curl -X POST http://${ALB_DNS}/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Problema de conexión",
    "categoria": "redes",
    "prioridad": "alta",
    "solicitante_nombre": "Test User",
    "solicitante_email": "test@example.com"
  }'

# Verificar que routing-service asignó o rechazó el ticket
aws logs tail /ecs/routing-service --follow

# Verificar notificación en notifications-service
aws logs tail /ecs/notifications-service --follow
```

### 6. Destruir infraestructura (limpiar)

```bash
# CUIDADO: Esto elimina TODO
terraform destroy

# O selectivamente
terraform destroy -target=module.s3_frontend
```

---

## 🔄 Flujo de Eventos {#flujo-de-eventos}

```text
┌─────────────────────────────────────────────────────────┐
│ 1. Frontend crea ticket vía POST /tickets               │
│    → Tickets Service recibe y guarda en BD              │
│    → Publica evento: ticket.created                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   NATS Broker          │
        │ (Message Bus)          │
        └─────────┬──────────────┘
                  │
                  ▼
    ┌─────────────────────────────┐
    │ 2. Routing Service          │
    │ Escucha: ticket.created     │
    │                             │
    │ 2a. Busca agente disponible │
    │     en categoría del ticket │
    │                             │
    │ 2b. Si existe:              │
    │     → Publica: ticket.assigned  │
    │                             │
    │ 2c. Si no existe:           │
    │     → Publica: ticket.unassigned│
    └────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
 ASIGNADO    SIN ASIGNAR
 (evento)    (evento)
      │             │
      └──────┬──────┘
             ▼
    ┌─────────────────────────────┐
    │ 3. Notifications Service    │
    │ Escucha: ticket.assigned    │
    │           ticket.unassigned │
    │                             │
    │ 3a. Si assigned:            │
    │     → Notifica al agente    │
    │     → Notifica solicitante  │
    │                             │
    │ 3b. Si unassigned:          │
    │     → Alerta al admin       │
    │     → Registra en BD        │
    └─────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────┐
    │ 4. Frontend actualiza       │
    │ Polling cada 5 seg          │
    │ GET /tickets                │
    │ Muestra estado actualizado  │
    └─────────────────────────────┘
```

### Eventos NATS

| Evento              | Publicador      | Suscriptores          | Payload                             |
| ------------------- | --------------- | --------------------- | ----------------------------------- |
| `ticket.created`    | tickets-service | routing-service       | {ticketId, asunto, categoria, ...}  |
| `ticket.assigned`   | routing-service | notifications-service | {ticketId, agentId, agentName, ...} |
| `ticket.unassigned` | routing-service | notifications-service | {ticketId, razon, ...}              |

---

## 🔌 API Reference {#api-reference}

### Tickets Service (HTTP)

#### POST /tickets - Crear ticket

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "asunto": "Mi monitor no enciende",
    "descripcion": "Monitor Samsung 24\" no enciende",
    "categoria": "hardware",
    "prioridad": "alta",
    "solicitante_nombre": "Carlos López",
    "solicitante_email": "carlos@empresa.com"
  }'
```

**Response 201:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "asunto": "Mi monitor no enciende",
  "estado": "abierto",
  "creado_en": "2024-01-15T10:30:00Z",
  "message": "Ticket creado. En revisión para asignación..."
}
```

#### GET /tickets - Listar todos los tickets

```bash
curl http://localhost:3000/tickets
```

**Response 200:**

```json
{
  "total": 5,
  "tickets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "asunto": "Mi monitor no enciende",
      "categoria": "hardware",
      "prioridad": "alta",
      "estado": "asignado",
      "agente_nombre": "Carlos López",
      "creado_en": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /tickets/:id - Obtener ticket específico

```bash
curl http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

#### GET /tickets/categoria/:categoria - Filtrar por categoría

```bash
curl http://localhost:3000/tickets/categoria/hardware
```

**Categorías válidas:** redes, hardware, software

#### PATCH /tickets/:id - Actualizar ticket

```bash
curl -X PATCH http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "en_progreso",
    "agente_id": "agent-123"
  }'
```

#### DELETE /tickets/:id - Eliminar ticket

```bash
curl -X DELETE http://localhost:3000/tickets/550e8400-e29b-41d4-a716-446655440000
```

#### GET /tickets/health/check - Health check

```bash
curl http://localhost:3000/tickets/health/check
```

---

## 🐛 Troubleshooting {#troubleshooting}

### Problema: "Cannot connect to NATS"

```bash
# Verificar NATS está corriendo
docker-compose ps | grep nats

# Si no está, reiniciar
docker-compose restart nats

# Verificar que servicios puedan alcanzarlo
docker-compose exec tickets-service nc -zv nats 4222
```

### Problema: "Database connection refused"

```bash
# Verificar PostgreSQL está listo
docker-compose logs postgres | tail -20

# Esperar a que esté listo (healthcheck)
docker-compose up -d postgres && sleep 30

# Verificar credenciales en docker-compose.yml
```

### Problema: "Service assignment failed"

```bash
# Ver logs de routing-service
docker-compose logs routing-service -f

# Verificar que haya agentes en BD
docker exec helpdesk-postgres psql -U helpdesk_user -d helpdesk_db -c "SELECT * FROM agents;"

# Insertar agentes si falta
docker exec helpdesk-postgres psql -U helpdesk_user -d helpdesk_db -c \
  "INSERT INTO agents (nombre, email, categoria, status) VALUES ('Juan', 'juan@test.local', 'redes', 'disponible');"
```

### Problema: "Port already in use"

```bash
# Identificar proceso
lsof -i :3000  # Tickets service
lsof -i :3001  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :4222  # NATS

# Detener servicio local conflictivo o cambiar puerto en docker-compose.yml
```

### Problema: "CORS error from frontend"

```bash
# Verificar que tickets-service tiene CORS habilitado
grep -A 5 "enableCors" backend/tickets-service/src/main.ts

# Verificar que FRONTEND_URL matches origin en el navegador
# Debe ser http://localhost:3001 en dev

# En producción, actualizar FRONTEND_URL en variables de ambiente
```

### Problema: "Terraform apply fails"

```bash
# Verificar credenciales AWS
aws sts get-caller-identity

# Verificar límites de recursos
aws service-quotas list-service-quotas \
  --service-code ecs

# Ver errores detallados
terraform apply -input=false -var-file="terraform.tfvars" 2>&1 | tail -50

# Limpiar y reintentar
terraform destroy
terraform apply
```

---

## 📊 Monitoreo y Logging

### CloudWatch Logs (AWS)

```bash
# Ver logs en tiempo real
aws logs tail /ecs/tickets-service --follow

# Buscar patrones de error
aws logs filter-log-events \
  --log-group-name /ecs/routing-service \
  --filter-pattern "ERROR"

# Ver últimas líneas
aws logs get-log-events \
  --log-group-name /ecs/notifications-service \
  --log-stream-name <log-stream-name> \
  --limit 100
```

### NATS Monitoring

```bash
# Web UI
http://localhost:8222

# CLI stats
# En el contenedor NATS:
nats-cli stats

# Conectar a NATS server
nats -s nats://localhost:4222
```

### Métricas ECS

```bash
# Ver tasks corriendo
aws ecs list-tasks \
  --cluster helpdesk-dev

# Ver detalles de task
aws ecs describe-tasks \
  --cluster helpdesk-dev \
  --tasks <task-arn>
```

---

## 📝 Notas importantes

### Seguridad

- ⚠️ **NUNCA** commitear `terraform.tfvars` (contiene db_password)
- ⚠️ **NUNCA** usar contraseña "helpdesk_password" en producción
- ✅ Usar AWS Secrets Manager en producción
- ✅ Habilitar encryption en RDS Multi-AZ

### Costos

- db.t4g.micro: ~$0.025/hora
- t3.micro ECS task: ~$0.0035/hora
- S3: ~$0.023 por GB/mes
- CloudWatch: ~$0.50/GB logs
- **Total estimado dev**: ~$30-50/mes

### Performance

- Aumentar `desired_task_count` para high availability
- Configurar auto-scaling en ECS
- Habilitar CloudFront para frontend
- Usar RDS Multi-AZ en producción

---

## 📚 Documentación adicional

- [ARQUITECTURA.md](./docs/ARQUITECTURA.md) - Diagrama y detalles técnicos
- [FLUJO_EVENTOS.md](./docs/FLUJO_EVENTOS.md) - Especificación de eventos NATS
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Guía de despliegue paso a paso

---

## ❓ Preguntas frecuentes

**P: ¿Cómo agregar más microservicios?**  
R: Seguir el patrón de routing-service: crear module en Terraform, registrar en CloudMap, conectar a NATS.

**P: ¿Cómo cambiar de PostgreSQL a otra BD?**  
R: Actualizar módulo RDS en `terraform/modules/rds/`, cambiar connection string en variables de ambiente.

**P: ¿Cómo habilitar HTTPS en ALB?**  
R: Crear certificado en ACM, agregar listener en ALB module con certificado. Ver `terraform/modules/alb/`.

**P: ¿Cómo hacer backup de BD?**  
R: RDS hace backups automáticos. Configurar retención en `db_backup_retention_period` en RDS module.

---

## 🤝 Contribución

Para cambios grandes:

1. Crear rama feature: `git checkout -b feature/nombre`
2. Commitear cambios: `git commit -am 'Descripción'`
3. Push a rama: `git push origin feature/nombre`
4. Abrir Pull Request

---

## 📄 Licencia

Proyecto educativo - Diplomado DevSecOps Essentials

---

**Última actualización**: Enero 2024  
**Versión**: 1.0.0  
**Grupo**: Grupo 4 - Helpdesk
