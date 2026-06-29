# Proyecto Helpdesk — Sistema de Mesa de Ayuda

Grupo 4 | Diplomado DevSecOps Essentials

> **Este documento reemplaza el PDF externo** (`Proyecto_IaC_Microservicios_Instrucciones.pdf`).
> Aquí están las especificaciones, la rúbrica y el estado del repo.

## Documentos del equipo (leer primero)

| Documento | Para qué |
| --------- | -------- |
| [`ESTADO_PROYECTO_RUBRICA.md`](ESTADO_PROYECTO_RUBRICA.md) | Avance vs calificación (100 pts) |
| [`SEPARACION_5_PERSONAS_MULTI_REPO.md`](SEPARACION_5_PERSONAS_MULTI_REPO.md) | Rol, rama Git y tareas por integrante |
| [`GUIA_IMPLEMENTACION.md`](GUIA_IMPLEMENTACION.md) | Pasos de acción desde la base actual |
| [`../ARQUITECTURA.md`](../ARQUITECTURA.md) | Diseño actual y objetivo AWS |

---

## Tabla de contenidos

- [Objetivos de aprendizaje](#objetivos-de-aprendizaje)
- [Descripción del proyecto](#descripcion-del-proyecto)
- [Caso Grupo 4: Mesa de Ayuda](#caso-grupo-4-mesa-de-ayuda)
- [Requisitos técnicos](#requisitos-tecnicos)
- [Rúbrica de evaluación](#rubrica-de-evaluacion)
- [Entregables y presentación](#entregables-y-presentacion)
- [Estado actual del repo](#estado-actual-del-repo)
- [Descripción General](#descripcion-general)
- [Requisitos Previos](#requisitos-previos)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Frontend React + MUI](#frontend-react--mui)
- [Desarrollo Local (Docker Compose)](#desarrollo-local-docker-compose)
- [Despliegue en AWS (Terraform)](#despliegue-en-aws-terraform)
- [Flujo de Eventos](#flujo-de-eventos)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Objetivos de aprendizaje

Al terminar el proyecto, el grupo debe ser capaz de:

1. Desplegar infraestructura completa en AWS con Terraform, reproducible y versionada en Git.
2. Modelar microservicios con comunicación asíncrona vía NATS y descubrimiento vía Cloud Map.
3. Distinguir comunicación síncrona (HTTP/ALB) de asíncrona (eventos/NATS).
4. Aplicar mínimo privilegio con Security Groups encadenados.
5. Exponer un frontend en la nube que consuma el backend vía ALB.
6. Gestionar el ciclo de vida de la infra (`apply` / `destroy`) con disciplina de costos.

---

## Descripción del proyecto {#descripcion-del-proyecto}

Tres partes sobre AWS, definidas con Terraform:

| Parte | Qué es | Restricción |
| ----- | ------ | ----------- |
| 1. Frontend | App web que consume el backend | CRUD básico sobre tickets |
| 2. Backend | Microservicios + NATS | Mínimo 3 servicios conectados a NATS |
| 3. IaC | Terraform en AWS | Reproducible con apply/destroy |

**Decisión del Grupo 4:** monorepo único (`helpdesk/`) con 5 integrantes en ramas `feature/*`.

---

## Caso Grupo 4: Mesa de Ayuda {#caso-grupo-4-mesa-de-ayuda}

| Elemento | Especificación |
| -------- | -------------- |
| Entidad CRUD | Tickets de soporte |
| Servicio HTTP (ALB) | `api-gateway` → `tickets-service` (patrón gateway) |
| Worker routing | Valida agente por categoría y asigna |
| Worker notifications | Notifica asignación o rechazo |
| Flujo NATS | `ticket.created` → routing → `ticket.assigned` / `ticket.unassigned` → notifications |
| Validación clave | Marcar **sin asignar** si no hay agente para la categoría |

Diagrama y detalle: [`../ARQUITECTURA.md`](../ARQUITECTURA.md), [`FLUJO_EVENTOS_COMPLETO.md`](FLUJO_EVENTOS_COMPLETO.md).

---

## Requisitos técnicos {#requisitos-tecnicos}

### Backend

- Mínimo 3 microservicios de negocio conectados a NATS.
- Al menos 1 servicio HTTP detrás del ALB (`api-gateway`).
- Al menos 2 workers event-driven (`routing`, `notifications`).
- NATS en ECS (producción) / contenedor local (desarrollo).
- Persistencia en motor administrado AWS — **RDS PostgreSQL** (elegido por el grupo).
- Service discovery: Cloud Map `*.app.internal` (sin IPs hardcodeadas).

### Frontend

- CRUD sobre tickets (Create, Read, Update, Delete).
- React + MUI (tecnología libre, sin auth obligatoria).
- Desplegado en AWS vía Terraform (S3 ± CloudFront recomendado).
- Consume backend por DNS público del ALB.
- CORS documentado.

### Infraestructura (Terraform)

Servicios AWS obligatorios: VPC, ECS Fargate, ECR, ALB, RDS, Cloud Map, IAM, CloudWatch,
Security Groups, frontend en S3.

Calidad IaC: reproducible, sin secretos en Git, variables/outputs, mínimo privilegio,
`destroy` limpio.

---

## Rúbrica de evaluación {#rubrica-de-evaluacion}

| Criterio | Puntos | Qué se evalúa |
| -------- | ------ | ------------- |
| IaC / Terraform | 40 | apply reproducible; servicios AWS cableados; SGs; outputs; destroy limpio |
| Backend microservicios | 25 | ≥3 servicios NATS; flujo eventos; Cloud Map; persistencia |
| Frontend en la nube | 15 | AWS vía Terraform; CRUD; ALB; CORS |
| Funcionamiento E2E | 10 | Demo: crear → evento → resultado visible |
| Presentación | 10 | Claridad; diagrama; trade-offs |

**Extras (+10):** HTTPS ALB, Secrets Manager, state S3, CI/CD, autoscaling, Multi-AZ.

Detalle por integrante: [`ESTADO_PROYECTO_RUBRICA.md`](ESTADO_PROYECTO_RUBRICA.md).

---

## Entregables y presentación {#entregables-y-presentacion}

### Entregables Git

1. Backend (3+ microservicios) + frontend + Terraform + README + docker-compose
2. Diagrama de arquitectura
3. Presentación 15–20 min
4. Demo funcional en AWS

### Presentación debe cubrir

**Punto 1 — Frontend en la nube:** CRUD desplegado, Terraform, conexión ALB, CORS.

**Punto 2 — Backend NATS:** 3+ servicios, flujo eventos, Cloud Map, Security Groups.

**Demo sugerida:** crear ticket → logs routing/notifications → estado visible en UI.

---

## Estado actual del repo {#estado-actual-del-repo}

| Componente | Base local | AWS producción |
| ---------- | ---------- | -------------- |
| api-gateway + 3 workers | ✅ | ❌ |
| NATS + Postgres Docker | ✅ | ❌ |
| Frontend React CRUD | ✅ | ❌ |
| Flujo eventos NATS | ⚠️ Parcial (ticket BD sin actualizar al asignar) | — |
| Terraform módulos | ❌ Solo `main.tf` | ❌ |

**Puntuación estimada hoy:** ~45–55 / 100. Ver checklist en [`ESTADO_PROYECTO_RUBRICA.md`](ESTADO_PROYECTO_RUBRICA.md).

---

## Descripción General {#descripcion-general}

Sistema de mesa de ayuda que permite gestionar solicitudes de soporte de TI mediante:

- **Frontend**: SPA React + Material UI desplegada en S3/CloudFront (build Vite → `dist/`)
- **Backend**: 4 servicios NestJS comunicados vía NATS
  - `api-gateway`: **único con HTTP** — borde REST → NATS
  - `tickets-service`: Worker CRUD + Postgres
  - `routing-service`: Worker que asigna tickets a agentes
  - `notifications-service`: Worker que notifica asignaciones
- **Infraestructura**: Terraform + AWS (ECS, RDS, ALB, CloudMap)
- **Base de datos**: PostgreSQL en RDS

### Características

| Característica | Local | AWS |
| -------------- | ----- | --- |
| CRUD de tickets | ✅ | ⏳ |
| Asignación automática por categoría | ⚠️ Eventos OK, BD pendiente | ⏳ |
| Flujo NATS | ✅ | ⏳ |
| Cloud Map | — | ⏳ |
| CloudWatch Logs | — | ⏳ |
| Security Groups | — | ⏳ |
| terraform apply reproducible | — | ❌ |

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
│   ├── api-gateway/              # Borde HTTP (:3000) → NATS
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── tickets-service/          # Worker NATS (CRUD + Postgres)
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── routing-service/          # Worker NATS
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── notifications-service/    # Worker NATS
│       ├── src/
│       ├── Dockerfile
│       └── package.json
├── frontend/                       # React 18 + TypeScript + Vite + MUI
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile                # build multi-stage → Nginx
│   ├── index.html
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/dashboard/
│       └── types/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── terraform.tfvars.example
│   └── modules/                  # ⏳ POR IMPLEMENTAR (Persona 5)
├── docker-compose.yml
├── init-db.sql
├── nginx.conf
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docs/
│   ├── README_COMPLETO.md        # Este archivo (especificaciones PDF)
│   ├── ESTADO_PROYECTO_RUBRICA.md
│   ├── SEPARACION_5_PERSONAS_MULTI_REPO.md
│   ├── GUIA_IMPLEMENTACION.md
│   └── FRONTEND.md
├── .gitignore
├── README.md
└── package.json
```

---

## Frontend React + MUI

El frontend es una SPA construida con **React 18**, **TypeScript**, **Vite** y **Material UI**.

Guía detallada: [`docs/FRONTEND.md`](FRONTEND.md)

```bash
# Desarrollo con hot reload
cd frontend && npm install && npm run dev

# Build de producción
npm run build   # → frontend/dist/
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
docker compose up --build -d

# Esperar logs como:
# ✅ api-gateway corriendo en puerto 3000
# ✅ Routing Service escuchando en NATS
# ✅ Notifications Service escuchando en NATS
# ✅ Frontend disponible en http://localhost:3001
```

### Desarrollo del frontend (hot reload)

```bash
# Backend en Docker
docker compose up -d postgres nats api-gateway tickets-service routing-service notifications-service

# Frontend con Vite
cd frontend
npm install
npm run dev
# http://localhost:3001
```

Ver [`docs/FRONTEND.md`](FRONTEND.md) para la guía completa del frontend.

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
# Backend: hot reload en src/ (volúmenes montados en docker-compose)
docker compose logs -f api-gateway tickets-service

# Frontend: usar Vite en local (recomendado)
cd frontend && npm run dev

# O reconstruir imagen frontend tras cambios
docker compose build frontend && docker compose up -d frontend

# Detener y reiniciar servicios específicos
docker compose restart routing-service

# Limpiar stack (destructivo)
docker compose down -v
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
