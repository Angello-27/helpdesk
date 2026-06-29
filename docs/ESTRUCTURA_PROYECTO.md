# 📋 Proyecto Helpdesk - Estructura Completa

## 📁 Árbol de directorios

```text
helpdesk/
├── backend/
│   ├── api-gateway/              # UNICO con HTTP (:3000). Borde REST → NATS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── messaging/patterns.ts
│   │   │   ├── dto/
│   │   │   └── tickets/tickets.controller.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── tickets-service/            # Worker NATS (CRUD + Postgres)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── entities/
│   │   │   ├── dto/
│   │   │   └── tickets/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── routing-service/            # Worker NATS: asignación de agentes
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── notifications-service/      # Worker NATS: notificaciones
│       ├── src/
│       ├── Dockerfile
│       └── package.json
│
├── frontend/                       # React 18 + TypeScript + Vite + MUI
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile                  # build multi-stage → Nginx
│   ├── index.html
│   └── src/
│       ├── api/                    # cliente REST
│       ├── components/             # UI (tabla, form, dialogs, chips)
│       ├── context/                # TicketsContext
│       ├── hooks/                  # useTickets, useSnackbar
│       ├── layouts/                # AppShell
│       ├── pages/dashboard/        # DashboardPage + paneles
│       ├── types/
│       └── utils/
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars.example
│
├── docker-compose.yml
├── nginx.conf                      # Sirve dist/ + proxy /tickets
├── init-db.sql
├── docs/
│   ├── FRONTEND.md                 # Guía del frontend React
│   └── ...
├── README.md
└── ARQUITECTURA.md
```

---

## 🎯 Resumen de cada componente

### 1️⃣ **API Gateway** (HTTP :3000)

- **Puerto**: 3000
- **Responsabilidad**: Único borde HTTP. Traduce REST → NATS (`tickets.*`)
- **Sin lógica de negocio ni BD**

### 2️⃣ **Tickets Service** (Worker NATS)

- **Responsabilidad**: CRUD de tickets en PostgreSQL
- **Eventos que publica**: `ticket.created`, `ticket.<estado>`
- **Sin HTTP** — responde patrones NATS

### 3️⃣ **Routing Service** (Worker NATS)

- **Escucha**: `ticket.created`
- **Lógica**:
  - Busca agentes disponibles en DB
  - Si existe → publica `ticket.assigned`
  - Si no → publica `ticket.unassigned`

### 4️⃣ **Notifications Service** (Worker NATS)

- **Escucha**: `ticket.assigned`, `ticket.unassigned`
- **Lógica**:
  - Registra notificaciones en DB
  - Simula envío de email/SMS (logs)

### 5️⃣ **Frontend** (React + MUI + Nginx)

- **Stack**: React 18, TypeScript, Vite, Material UI
- **Puerto local**: 3001 (Nginx sirve el build de `dist/`)
- **Funciones**: CRUD visual — crear, listar, ver, **editar** (PATCH), eliminar
- **Comunicación**: mismo origen vía Nginx (`/tickets` → api-gateway)
- **Detalle**: ver [`FRONTEND.md`](FRONTEND.md)

### 6️⃣ **Infraestructura** (Terraform)

- **VPC**, **ECS Fargate**, **RDS PostgreSQL**, **ALB**, **CloudMap**
- Frontend estático en **S3 + CloudFront** (build de `npm run build`)

---

## 📊 Flujo de eventos NATS

```text
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + Nginx :3001)             │
│                                                         │
│      POST /tickets (vía proxy Nginx)                    │
│            ↓                                            │
│        ┌─────────────────────┐                          │
│        │    api-gateway      │                          │
│        │  (HTTP :3000)       │                          │
│        │  HTTP → NATS        │                          │
│        └────────┬────────────┘                          │
│                 │ NATS tickets.create                   │
│        ┌────────▼────────────┐                          │
│        │  tickets-service    │                          │
│        │  (worker NATS)      │                          │
│        │  ├─ Create Ticket   │                          │
│        │  └─ Save DB         │                          │
│        └────────┬────────────┘                          │
│                 │                                       │
│         Publica: ticket.created                         │
│                 │                                       │
│        ┌────────▼──────────────┐                        │
│        │   NATS Broker         │                        │
│        └────────┬──────────────┘                        │
│                 │                                       │
│         ┌───────┴────────┐                              │
│    ┌────▼─────────┐  ┌──▼────────────┐                 │
│    │   Routing    │  │ Notifications │                 │
│    │   Service    │  │   Service     │                 │
│    └──────────────┘  └───────────────┘                 │
│                                                         │
│         RDS PostgreSQL DB                               │
│         ├─ tickets table                                │
│         ├─ agents table                                 │
│         └─ notifications table                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Desarrollo local (docker compose)

```bash
cd helpdesk
docker compose up --build -d
# Frontend: http://localhost:3001
# API Gateway: http://localhost:3000
```

### Desarrollo frontend con hot reload

```bash
docker compose up -d postgres nats api-gateway tickets-service routing-service notifications-service
cd frontend && npm install && npm run dev
```

### Desplegar en AWS (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## ✅ Checklist de entrega

- [ ] api-gateway + 3 microservicios workers funcionando
- [ ] Todos conectados a NATS
- [ ] Frontend React CRUD desplegado (S3/CloudFront o Nginx)
- [ ] RDS PostgreSQL con tablas de tickets, agentes, notificaciones
- [ ] Terraform reproducible (apply/destroy)
- [ ] Security Groups con mínimo privilegio
- [ ] README y docs actualizados
- [ ] docker compose para dev local
- [ ] Demo end-to-end
