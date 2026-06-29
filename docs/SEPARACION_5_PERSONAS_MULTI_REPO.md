# 👥 Organización para 5 Personas - Repositorios y Equipos

## ❓ ¿Monorepo vs Multi-Repo? - La Verdad

### La Realidad en la Industria

**MONOREPO** (un repo para todo)

- ✅ Google, Facebook, Twitter, Uber
- ✅ Startups pequeñas
- ✅ Equipos que trabajan muy acoplados
- ❌ Puede ser caótico sin buena disciplina

**MULTI-REPO** (un repo por microservicio)

- ✅ Netflix, Amazon, Airbnb
- ✅ Equipos distribuidos/grandes
- ✅ Ciclos de vida independientes
- ❌ Más complejo de orchestrar

---

## 🎯 Para ESTE PROYECTO (5 personas, educativo)

### Mi Recomendación: **MULTI-REPO** (5 repositorios)

```text
github.com/grupo-4-helpdesk/
├── helpdesk-frontend/           (Repo 1)
├── helpdesk-tickets-service/    (Repo 2)
├── helpdesk-routing-service/    (Repo 3)
├── helpdesk-notifications-service/ (Repo 4)
├── helpdesk-infrastructure/     (Repo 5)
└── helpdesk-docs/               (Repo compartido)
```

### ¿POR QUÉ Multi-Repo para ustedes?

✅ **Ownership claro**: Cada persona es dueña de su repo  
✅ **Evita merge conflicts**: No 5 personas editando el mismo archivo  
✅ **CI/CD independiente**: Cada servicio se deploya solo  
✅ **Versionado independiente**: tickets-service v1.2, routing-service v1.0  
✅ **Realista**: Simula equipos reales de empresas grandes  
✅ **Escalable**: Si agregamos más servicios, es sencillo  
✅ **Desarrollo paralelo**: 5 personas sin pisarse

### Alternativa: Monorepo (menos recomendado pero válido)

```text
helpdesk-proyecto/
├── backend/
│   ├── tickets-service/
│   ├── routing-service/
│   └── notifications-service/
├── frontend/
├── terraform/
└── docs/
```

**VENTAJAS Monorepo**:

- Cambios transversales = 1 commit
- Shared code más fácil
- Una sola CI/CD pipeline

**DESVENTAJAS Monorepo**:

- Persona 1 edita tickets-service
- Persona 2 edita routing-service
- ¡CONFLICTO DE MERGE!
- Difícil separar ownership

---

## 👨‍💼 DISTRIBUCIÓN PARA 5 PERSONAS

### Opción A: Por Microservicio (RECOMENDADO)

```text
PERSONA 1: Frontend Developer
├─ Repo: helpdesk-frontend (o carpeta frontend/ en monorepo)
├─ Stack: React 18 + TypeScript + Vite + Material UI
├─ Archivos clave:
│  ├─ frontend/src/pages/dashboard/
│  ├─ frontend/src/components/
│  ├─ frontend/src/api/tickets.ts
│  ├─ frontend/Dockerfile
│  └─ docs/FRONTEND.md
├─ Tests: Frontend E2E (Cypress/Playwright)
├─ Responsabilidades:
│  ├─ CRUD UI (crear, listar, editar, eliminar)
│  ├─ Integración con API vía proxy Nginx
│  ├─ Tema MUI y responsive
│  └─ Build → S3/CloudFront
└─ Entregables:
   ├─ SPA React funcional
   ├─ Tests
   └─ Documentación (docs/FRONTEND.md)

PERSONA 2: Backend - Tickets Service
├─ Repo: helpdesk-tickets-service
├─ Archivos:
│  ├─ src/main.ts
│  ├─ src/tickets/
│  ├─ src/entities/
│  ├─ src/dto/
│  ├─ src/app.module.ts
│  ├─ Dockerfile
│  └─ package.json
├─ Tests: Unit + Integration
├─ Responsabilidades:
│  ├─ CRUD de tickets (API HTTP)
│  ├─ Conexión a BD
│  ├─ Publicar eventos ticket.created
│  ├─ Validaciones de negocio
│  └─ Despliegue a ECR
└─ Entregables:
   ├─ Tickets Service funcional
   ├─ Tests unitarios
   └─ API documentation (Swagger)

PERSONA 3: Backend - Routing Service
├─ Repo: helpdesk-routing-service
├─ Archivos:
│  ├─ src/main.ts
│  ├─ src/routing/
│  ├─ src/app.module.ts
│  ├─ Dockerfile
│  └─ package.json
├─ Tests: Unit (queries SQL)
├─ Responsabilidades:
│  ├─ Escuchar ticket.created
│  ├─ Query a tabla agents en BD
│  ├─ Validar disponibilidad
│  ├─ Publicar ticket.assigned/unassigned
│  └─ Despliegue a ECR
└─ Entregables:
   ├─ Routing Service funcional
   ├─ Tests
   └─ Documentación de algoritmo

PERSONA 4: Backend - Notifications Service
├─ Repo: helpdesk-notifications-service
├─ Archivos:
│  ├─ src/main.ts
│  ├─ src/notifications/
│  ├─ src/app.module.ts
│  ├─ Dockerfile
│  └─ package.json
├─ Tests: Unit
├─ Responsabilidades:
│  ├─ Escuchar ticket.assigned/unassigned
│  ├─ Guardar en tabla notifications
│  ├─ Simular envío de emails
│  ├─ Logging
│  └─ Despliegue a ECR
└─ Entregables:
   ├─ Notifications Service funcional
   ├─ Tests
   └─ Documentación

PERSONA 5: DevOps/Infrastructure
├─ Repos:
│  ├─ helpdesk-infrastructure (Terraform)
│  └─ helpdesk-docs (Común)
├─ Archivos principales:
│  ├─ terraform/main.tf
│  ├─ terraform/vpc.tf
│  ├─ terraform/ecs.tf
│  ├─ terraform/rds.tf
│  ├─ terraform/alb.tf
│  ├─ terraform/cloudmap.tf
│  ├─ terraform/security-groups.tf
│  ├─ docker-compose.yml
│  └─ init-db.sql
├─ Responsabilidades:
│  ├─ Toda infraestructura AWS
│  ├─ Docker image orchestration
│  ├─ Base de datos (schema, migrations)
│  ├─ Security Groups & IAM
│  ├─ CI/CD setup
│  ├─ Monitoreo CloudWatch
│  └─ Documentación (shared)
└─ Entregables:
   ├─ Terraform reproducible
   ├─ docker-compose.yml funcional
   ├─ init-db.sql
   ├─ README deployment
   └─ Troubleshooting guide
```

---

## 📊 Timeline Coordinado

```text
SEMANA 1 (Setup)
├─ Día 1: Kick-off + Setup local
│  ├─ Persona 5: Crea repos en GitHub
│  ├─ Todos: Clone y docker-compose up
│  ├─ Persona 5: Setup database local
│  └─ Todos: Verificar stack funciona
│
├─ Día 2-3: Desarrollo independiente
│  ├─ Persona 1: Estructura HTML base
│  ├─ Persona 2: Scaffolding Tickets Service
│  ├─ Persona 3: Scaffolding Routing Service
│  ├─ Persona 4: Scaffolding Notifications Service
│  └─ Persona 5: Terraform modules
│
└─ Día 4-5: Integración temprana
   ├─ Daily standups (15 min)
   ├─ Compartir avances
   ├─ Identificar bloqueos

SEMANA 2 (Desarrollo)
├─ Personas 2,3,4: Escriben servicios backend
├─ Persona 1: Frontend completo
├─ Persona 5: Infraestructura + CI/CD
├─ Testing en paralelo
└─ Integración: docker-compose up con todos los repos

SEMANA 3 (Testing + Despliegue)
├─ E2E testing
├─ AWS deployment (Persona 5 + Persona 2)
├─ Troubleshooting
├─ Performance testing
└─ Documentación final

SEMANA 4 (Presentación)
├─ Preparar slides
├─ Ensayar demo
├─ Videos de screencast
└─ Presentación
```

---

## 🔗 Flujo de Integración

### Docker Compose Local (PERSONA 5)

```yaml
# helpdesk-infrastructure/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    ...

  nats:
    image: nats:2.10-alpine
    ...

  tickets-service:
    build:
      context: ../helpdesk-tickets-service  # ← Referencia repo Persona 2
    ...

  routing-service:
    build:
      context: ../helpdesk-routing-service  # ← Referencia repo Persona 3
    ...

  notifications-service:
    build:
      context: ../helpdesk-notifications-service  # ← Referencia repo Persona 4
    ...

  frontend:
    build:
      context: ../helpdesk-frontend  # ← Referencia repo Persona 1
    ...
```

**Instrucciones para todos:**

```bash
# Clone todos los repos hermanos
git clone https://github.com/grupo-4-helpdesk/helpdesk-frontend.git
git clone https://github.com/grupo-4-helpdesk/helpdesk-tickets-service.git
git clone https://github.com/grupo-4-helpdesk/helpdesk-routing-service.git
git clone https://github.com/grupo-4-helpdesk/helpdesk-notifications-service.git
git clone https://github.com/grupo-4-helpdesk/helpdesk-infrastructure.git

# Estructura local
helpdesk/
├── helpdesk-frontend/
├── helpdesk-tickets-service/
├── helpdesk-routing-service/
├── helpdesk-notifications-service/
└── helpdesk-infrastructure/

# Levantar todo
cd helpdesk-infrastructure
docker-compose up --build
```

---

## 📋 Estructura de Cada Repo

### Repo 1: Frontend (Persona 1)

```text
helpdesk-frontend/
├── package.json
├── vite.config.ts
├── index.html
├── Dockerfile
├── src/
│   ├── api/tickets.ts
│   ├── components/
│   ├── hooks/
│   ├── pages/dashboard/
│   └── ...
├── tests/
│   └── e2e.spec.ts
├── README.md
└── .github/workflows/
    └── deploy.yml
```

### Repo 2: Tickets Service (Persona 2)

```text
helpdesk-tickets-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── tickets/
│   │   ├── tickets.controller.ts
│   │   └── tickets.service.ts
│   ├── entities/
│   │   └── ticket.entity.ts
│   └── dto/
│       └── create-ticket.dto.ts
├── test/
│   ├── tickets.controller.spec.ts
│   └── tickets.service.spec.ts
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
├── .gitignore
└── .github/
    └── workflows/
        └── build-and-push.yml
```

### Repo 3: Routing Service (Persona 3)

```text
helpdesk-routing-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── routing/
│   │   ├── routing.controller.ts
│   │   └── routing.service.ts
│   └── database/
│       └── queries.sql
├── test/
│   └── routing.service.spec.ts
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
├── .gitignore
└── .github/
    └── workflows/
        └── build-and-push.yml
```

### Repo 4: Notifications Service (Persona 4)

```text
helpdesk-notifications-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── notifications/
│   │   ├── notifications.controller.ts
│   │   └── notifications.service.ts
│   └── templates/
│       ├── email-assigned.html
│       └── email-unassigned.html
├── test/
│   └── notifications.service.spec.ts
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
├── .gitignore
└── .github/
    └── workflows/
        └── build-and-push.yml
```

### Repo 5: Infrastructure (Persona 5)

```text
helpdesk-infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfvars.example
│   ├── vpc.tf
│   ├── ecs.tf
│   ├── rds.tf
│   ├── alb.tf
│   ├── cloudmap.tf
│   ├── security-groups.tf
│   ├── iam.tf
│   ├── cloudwatch.tf
│   └── modules/
│       ├── vpc/
│       ├── ecs/
│       ├── rds/
│       ├── alb/
│       └── ...
├── docker-compose.yml
├── init-db.sql
├── scripts/
│   ├── deploy.sh
│   ├── build-images.sh
│   └── cleanup.sh
├── README.md
├── .gitignore
└── .github/
    └── workflows/
        ├── terraform-plan.yml
        └── terraform-apply.yml
```

### Repo 6: Docs (Compartido - puede ser Persona 5)

```text
helpdesk-docs/
├── README.md
├── ARQUITECTURA.md
├── FLUJO_EVENTOS.md
├── API.md
├── DEPLOYMENT.md
├── TROUBLESHOOTING.md
├── GUIA_IMPLEMENTACION.md
├── diagrams/
│   ├── arquitectura.png
│   ├── flujo-eventos.png
│   └── ...
└── presentations/
    ├── diapositivas.ppt
    └── demo-video.mp4
```

---

## 🔀 Comunicación Entre Personas

### Interfaces (Contratos entre servicios)

**DEFINIR PRIMERO** - Antes de escribir código:

```text
Persona 2 ↔ Persona 5 (Tickets Service)
├─ REST API:
│  ├─ POST /tickets
│  ├─ GET /tickets
│  ├─ PATCH /tickets/:id
│  └─ DELETE /tickets/:id
└─ Request/Response format (JSON schema)

Persona 2 ↔ Persona 3 (NATS Events)
├─ Event: ticket.created
│  ├─ Format: {ticketId, asunto, categoria, ...}
│  └─ Topic: "ticket.created"

Persona 3 ↔ Persona 4 (NATS Events)
├─ Event: ticket.assigned
│  ├─ Format: {ticketId, agentId, agentName, ...}
│  └─ Topic: "ticket.assigned"
└─ Event: ticket.unassigned
   ├─ Format: {ticketId, razon, ...}
   └─ Topic: "ticket.unassigned"

Persona 1 ↔ Persona 2 (Frontend-API)
├─ HTTP Headers: "Content-Type: application/json"
├─ CORS: Access-Control-Allow-Origin
└─ Error handling: Standard HTTP status codes
```

### Definition of Done (DoD)

Cada persona debe asegurar:

#### Persona 1 (Frontend)

- [ ] HTML válido y accesible
- [ ] CSS responsive
- [ ] JavaScript sin errores (console.log limpio)
- [ ] Tests E2E pasando
- [ ] Documentado en README

#### Personas 2, 3, 4 (Backend)

- [ ] Código TypeScript tipado
- [ ] Tests unitarios al 80%+
- [ ] Logs claros y descriptivos
- [ ] Dockerfile construye sin errores
- [ ] Documentado: API / Events / Queries

#### Persona 5 (Infrastructure)

- [ ] Terraform plan sin errores
- [ ] docker-compose.yml funcional
- [ ] BD schema correcto
- [ ] Scripts de deploy funcionales
- [ ] Documentación de setup

---

## 🎪 Reuniones Recomendadas

### Daily Standup (15 min)

```text
Cada persona reporta:
├─ Qué hice ayer
├─ Qué haré hoy
└─ Bloqueadores

Ejemplo Persona 2:
├─ Ayer: Implementé crear y listar tickets
├─ Hoy: PATCH para actualizar estado
└─ Bloqueador: Necesito confirmar formato del evento con Persona 3
```

### Sync de Integración (1 hora, 3x semana)

```text
├─ Demo de lo que cada uno hizo
├─ Testing conjunto
├─ Identificar problemas de integración
├─ Ajustar interfaces si es necesario
└─ Planificar próxima semana
```

### Planning (1 hora, semanal)

```text
├─ Revisar sprint goals
├─ Assign tasks
├─ Resolver dependencias
└─ Actualizar timeline
```

---

## 📦 Ejemplo: Cómo Trabajan Juntos

### ESCENARIO: Crear un ticket

```text
PASO 1: Personas definen contrato
├─ Persona 1: "Necesito un endpoint POST /tickets"
├─ Persona 2: "OK, aceptaré JSON con {asunto, categoria, ...}"
├─ Persona 3: "Voy a escuchar ticket.created"
├─ Persona 4: "Voy a escuchar ticket.assigned y ticket.unassigned"
└─ Persona 5: "BD lista con tabla tickets y agents"

PASO 2: Cada persona desarrolla en paralelo
├─ Persona 1: Crea formulario HTML + JS para POST
├─ Persona 2: Implementa POST /tickets en Express/NestJS
├─ Persona 3: Implementa listener de ticket.created
├─ Persona 4: Implementa listener de ticket.assigned
└─ Persona 5: Sube dockers, configura NATS

PASO 3: Integración local
├─ docker-compose up (tira todos los repos)
├─ Persona 1 llena formulario
├─ POST /tickets va a Persona 2
├─ ticket.created publicado a NATS
├─ Persona 3 procesa y publica ticket.assigned
├─ Persona 4 envía notificación
└─ Persona 1 ve ticket actualizado en tabla (polling)

PASO 4: Si hay error
├─ Revisar logs de cada servicio
├─ docker logs tickets-service
├─ docker logs routing-service
├─ Identificar dónde se rompió
├─ Persona correspondiente lo arregla
└─ Re-testear

PASO 5: Deployment
├─ Persona 2: Push a ECR
├─ Persona 3: Push a ECR
├─ Persona 4: Push a ECR
├─ Persona 1: Push a S3
└─ Persona 5: terraform apply
```

---

## 🚨 Problemas Comunes en Multi-Repo

### PROBLEMA 1: "Mi cambio rompe otro servicio"

**SOLUCIÓN:**

```bash
# Persona 3 cambió el formato de ticket.assigned
# Persona 4 no se enteró y se rompe

# COMUNICAR primero en Slack/Discord
# ACTUALIZAR en sincronía
# VERSION los eventos si cambian

Event ticket.assigned v1:
{ticketId, agentId, agentName}

Event ticket.assigned v2:
{ticketId, agentId, agentName, assignedAt, metadata}
```

### PROBLEMA 2: "El docker-compose no funciona"

**SOLUCIÓN:**

```bash
# Persona 5 actualiza docker-compose
# Personas 1-4 no ven los cambios

# Solución: CI/CD automático
.github/workflows/docker-compose-test.yml
├─ Cada commit a infrastructure/
├─ Tira docker-compose up
├─ Corre tests
├─ Si falla: notifica a todos
```

### PROBLEMA 3: "Alguien pushea código roto"

**SOLUCIÓN:**

```text
Requerimientos para cada repo:
├─ Tests deben pasar
├─ Build Docker debe funcionar
├─ Linting sin errores
└─ Code review de otra persona

.github/workflows/ci.yml
├─ npm test
├─ npm run build
├─ docker build
├─ Merge solo si todo OK
```

---

## ✅ Checklist de Separación

- [ ] 5 Repos creados en GitHub
- [ ] Cada persona tiene access a su repo + infrastructure
- [ ] .gitignore en cada repo
- [ ] README en cada repo
- [ ] CI/CD workflows en cada repo
- [ ] Docker image por cada repo
- [ ] docker-compose.yml coordinado en infrastructure
- [ ] Interfaces definidas entre servicios
- [ ] Slack/Discord channel de comunicación
- [ ] Primera reunión: presentar arquitectura
- [ ] Daily standups programados

---

## 📊 Matriz de Responsabilidades (RACI)

```text
| Persona 1 | Persona 2 | Persona 3 | Persona 4 | Persona 5 |
| --------- | --------- | --------- | --------- | --------- |
| (Front)   | (Tickets) | (Routing) | (Notif)   | (DevOps)  |
--------------------+-----------+-----------+-----------+-----------+-----------|
Frontend Code       |  **R**    |     C     |           |           |     I     |
Tickets Service     |     C     |  **R**    |     C     |     C     |     I     |
Routing Service     |           |     C     |  **R**    |     C     |     I     |
Notifications Svc   |           |     C     |     C     |  **R**    |     I     |
Infrastructure      |     I     |     C     |     C     |     C     |  **R**    |
Docker Images       |     C     |     C     |     C     |     C     |  **R**    |
NATS Config         |           |     C     |  **R**    |  **R**    |     I     |
PostgreSQL          |           |     C     |     C     |     C     |  **R**    |
Terraform           |           |           |           |           |  **R**    |
Testing (Unit)      |  **R**    |  **R**    |  **R**    |  **R**    |     S     |
Testing (E2E)       |  **R**    |     C     |     C     |     C     |     S     |
Documentation       |     R     |     R     |     R     |     R     |  **R**    |

R = Responsible (hace el trabajo)
A = Accountable (responde finalmente)
C = Consulted (opina/revisa)
I = Informed (se entera después)
S = Support (ayuda si es necesario)
```

---

## 🎯 Conclusión

### Recomendación Final: **MULTI-REPO**

**POR QUÉ:**

- Cada persona es dueña de su código
- Despliegues independientes
- Evita merge conflicts masivos
- Realista para industria real
- Escalable si crecen

**CÓMO HACERLO BIEN:**

1. Define interfaces claras PRIMERO
2. Usa CI/CD en cada repo
3. docker-compose.yml centralizado
4. Daily standups + sync semanales
5. Pull requests + code reviews

**EQUIVALENTE EN REALIDAD:**

- Netflix: ~170 equipos, cada uno con su repo(s)
- AWS: Cada equipo de Personas dueño de servicios
- Stripe: Similar estructura

Esto te prepara mejor para un job real que un monorepo. 💼
