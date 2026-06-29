# 📋 Proyecto Helpdesk - Estructura Completa

## 📁 Árbol de directorios

```text
helpdesk-project/
├── backend/
│   ├── tickets-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   └── controllers/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── routing-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── notifications-service/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── shared/
│       └── nats-config.ts
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── components/
│   │   ├── ticket-form.js
│   │   └── ticket-list.js
│   └── Dockerfile
│
├── terraform/
│   ├── main.tf
│   ├── vpc.tf
│   ├── ecs.tf
│   ├── rds.tf
│   ├── alb.tf
│   ├── cloudmap.tf
│   ├── iam.tf
│   ├── security-groups.tf
│   ├── outputs.tf
│   ├── variables.tf
│   └── terraform.tfvars
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── deploy.yml (opcional - CI/CD)
├── docs/
│   ├── ARQUITECTURA.md
│   ├── FLUJO_EVENTOS.md
│   └── DEPLOYMENT.md
├── README.md
└── .gitignore
```

---

## 🎯 Resumen de cada componente

### 1️⃣ **Tickets Service** (HTTP/ALB)

- **Puerto**: 3000
- **Responsabilidad**: CRUD de tickets
- **Eventos que publica**: `ticket.created`, `ticket.updated`
- **Base de datos**: PostgreSQL (RDS)

### 2️⃣ **Routing Service** (Worker NATS)

- **Escucha**: `ticket.created`
- **Lógica**:
  - Busca agentes disponibles en DB
  - Si existe → publica `ticket.assigned`
  - Si no → publica `ticket.unassigned`
- **Base de datos**: Consulta tabla de agentes en RDS

### 3️⃣ **Notifications Service** (Worker NATS)

- **Escucha**: `ticket.assigned`, `ticket.unassigned`
- **Lógica**:
  - Registra notificaciones en DB
  - Simula envío de email/SMS (logs)
  - Actualiza estado en tabla de notificaciones

### 4️⃣ **Frontend** (S3/CloudFront)

- HTML/JS puro
- Consume API por ALB
- CRUD visual de tickets
- CORS habilitado

### 5️⃣ **Infraestructura** (Terraform)

- **VPC**: CIDR 10.0.0.0/16, 2 subnets en AZs distintas
- **ECS Fargate**: cluster para 3 servicios + NATS
- **RDS PostgreSQL**: para tickets, agentes, notificaciones
- **ALB**: expone tickets-service en puerto 80/443
- **CloudMap**: service discovery interno (`*.app.internal`)
- **Security Groups**: mínimo privilegio encadenado

---

## 📊 Flujo de eventos NATS

```text
┌─────────────────────────────────────────────────────────┐
│                    Frontend (S3)                        │
│                                                         │
│      POST /tickets                                      │
│            ↓                                            │
│        ┌─────────────────────┐                          │
│        │  Tickets Service    │                          │
│        │  (HTTP/ALB:3000)    │                          │
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
│         │                │                              │
│    ┌────▼─────────┐  ┌──▼────────────┐                 │
│    │   Routing    │  │ Notifications │                 │
│    │   Service    │  │   Service     │                 │
│    │ (Worker)     │  │   (Worker)    │                 │
│    │              │  │               │                 │
│    │ 1. Buscar    │  │ Escucha:      │                 │
│    │    agentes   │  │  - assigned   │                 │
│    │ 2. Si existe │  │  - unassigned │                 │
│    │    → assigned│  │               │                 │
│    │ 3. Si no     │  │ Publica notif │                 │
│    │    → unassigned                 │                 │
│    └────┬──────────┘  └───────────────┘                 │
│         │                                               │
│    Publica:                                             │
│    - ticket.assigned  ─────────────┐                    │
│    - ticket.unassigned────────────┼──→ Notifica        │
│                                   │                     │
│         RDS PostgreSQL DB          │                    │
│         ├─ tickets table           │                    │
│         ├─ agents table            │                    │
│         └─ notifications table ←───┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Desarrollo local (docker-compose)

```bash
cd helpdesk-project
docker-compose up
# Frontend: http://localhost:3001
# Tickets API: http://localhost:3000
```

### Desplegar en AWS (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
# Outputs: ALB DNS, Frontend URL
```

### Monitoreo

```bash
# Logs de tickets-service
aws logs tail /ecs/tickets-service --follow

# Logs de routing-service
aws logs tail /ecs/routing-service --follow

# Logs de notifications-service
aws logs tail /ecs/notifications-service --follow
```

---

## ✅ Checklist de entrega

- [ ] 3 microservicios funcionando (tickets, routing, notifications)
- [ ] Todos conectados a NATS
- [ ] Frontend CRUD desplegado en S3
- [ ] RDS PostgreSQL con tablas de tickets, agentes, notificaciones
- [ ] Terraform reproducible (apply/destroy)
- [ ] Security Groups con mínimo privilegio
- [ ] CloudMap para service discovery
- [ ] CORS configurado
- [ ] README con instrucciones
- [ ] docker-compose para dev local
- [ ] Diagrama de arquitectura
- [ ] Demo end-to-end
