# 🎟️ Helpdesk — Sistema de Mesa de Ayuda (Microservicios + NATS)

Plataforma de gestión de tickets de soporte construida con **NestJS**, comunicación por
**NATS**, base de datos **PostgreSQL** y un **frontend React + Material UI**. Sigue el patrón
**API Gateway**: un borde HTTP delgado (`api-gateway`) y servicios de dominio que son
workers NATS sin HTTP. Pensada para correr en local con `docker compose` y desplegarse
en **AWS** con Terraform.

---

## 📁 Estructura del proyecto

```text
helpdesk/
├── docker-compose.yml          # Orquestación local (Postgres, NATS, gateway, 3 servicios, frontend)
├── init-db.sql                 # Schema + seed (se ejecuta al crear el contenedor Postgres)
├── nginx.conf                  # Sirve el build React y hace proxy /tickets -> api-gateway
├── .gitignore
├── README.md                   # (este archivo)
├── ARQUITECTURA.md             # Diseño, flujo de eventos y decisiones
│
├── backend/
│   ├── api-gateway/            # UNICO con HTTP (:3000). Borde REST, traduce HTTP -> NATS
│   ├── tickets-service/        # Worker NATS (CRUD + Postgres) — responde 'tickets.*', publica eventos
│   ├── routing-service/        # Worker NATS: asigna tickets a agentes
│   └── notifications-service/  # Worker NATS: registra y "envía" notificaciones
│
├── frontend/                   # React 18 + TypeScript + Vite + MUI (ver docs/FRONTEND.md)
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile              # build multi-stage → Nginx
│   ├── index.html
│   └── src/
│       ├── api/                # cliente REST (/tickets)
│       ├── components/         # UI reutilizable
│       ├── context/            # TicketsContext
│       ├── hooks/              # useTickets, useSnackbar
│       ├── layouts/            # AppShell
│       └── pages/dashboard/    # DashboardPage + paneles
│
├── terraform/                  # IaC para AWS (ECS Fargate, RDS, ALB, ...)
│
└── docs/                       # Documentación de diseño (guías, flujos, análisis)
    └── FRONTEND.md             # Guía detallada del frontend React
```

---

## 🚀 Quick Start (local)

**Requisito:** Docker + Docker Compose (Docker Desktop en ejecución).

```bash
# 1. Levantar todo el stack
docker compose up --build -d

# 2. Abrir el frontend
#    http://localhost:3001

# 3. Probar la API directamente
curl http://localhost:3000/tickets/health/check
curl http://localhost:3000/tickets
```

Servicios y puertos:

| Servicio               | URL / Puerto            | Rol                                       |
| ---------------------- | ----------------------- | ----------------------------------------- |
| Frontend (React/Nginx) | <http://localhost:3001> | UI CRUD de tickets (Material UI)          |
| api-gateway            | <http://localhost:3000> | **Único con HTTP.** Borde REST → NATS     |
| tickets-service        | (worker, sin HTTP)      | CRUD + Postgres, publica `ticket.created` |
| routing-service        | (worker, sin HTTP)      | Asigna agente, publica `ticket.*`         |
| notifications-service  | (worker, sin HTTP)      | Registra/"envía" notificaciones           |
| NATS monitoring        | <http://localhost:8222> | Estado del broker                         |
| PostgreSQL             | localhost:5432          | `helpdesk_db` / `helpdesk_user`           |
| PgAdmin (opcional)     | <http://localhost:5050> | `docker compose --profile debug up`       |

### Desarrollo del frontend con hot reload

```bash
# Backend en Docker
docker compose up -d postgres nats api-gateway tickets-service routing-service notifications-service

# Frontend con Vite (otra terminal)
cd frontend && npm install && npm run dev
# http://localhost:3001
```

Ver [`docs/FRONTEND.md`](docs/FRONTEND.md) para más detalle.

### Probar el flujo completo

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"asunto":"Internet lento","categoria":"redes","prioridad":"alta",
       "solicitante_nombre":"Miguel","solicitante_email":"miguel@empresa.com"}'

# Observar el flujo en los logs:
docker compose logs -f routing-service notifications-service
```

El request pasa por: `api-gateway` (HTTP) → NATS `tickets.create` → `tickets-service`
guarda en BD y publica `ticket.created` → `routing-service` busca agente →
`ticket.assigned`/`ticket.unassigned` → `notifications-service`.

---

## 🛠️ Comandos útiles

```bash
docker compose up --build        # levantar (reconstruyendo imágenes)
docker compose up -d             # levantar en segundo plano
docker compose logs -f <svc>     # ver logs de un servicio
docker compose build frontend    # reconstruir solo el frontend React
docker compose down              # parar y eliminar contenedores
docker compose down -v           # parar y BORRAR la base de datos (reset total)
```

---

## ☁️ Despliegue en AWS

Ver el paso a paso en [`docs/GUIA_IMPLEMENTACION.md`](docs/GUIA_IMPLEMENTACION.md)
(build + push a ECR, `terraform apply`). La arquitectura cloud está descrita en
[`ARQUITECTURA.md`](ARQUITECTURA.md).

---

## 📚 Documentación

| Documento                                                                          | Contenido                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`ARQUITECTURA.md`](ARQUITECTURA.md)                                               | Arquitectura, flujo de eventos, decisiones            |
| [`docs/FRONTEND.md`](docs/FRONTEND.md)                                             | **Frontend React + MUI** — estructura, dev, build     |
| [`docs/API_GATEWAY.md`](docs/API_GATEWAY.md)                                       | Patrón API Gateway y **receta para añadir endpoints** |
| [`docs/FLUJO_EVENTOS_COMPLETO.md`](docs/FLUJO_EVENTOS_COMPLETO.md)                 | Flujo de eventos detallado                            |
| [`docs/GUIA_IMPLEMENTACION.md`](docs/GUIA_IMPLEMENTACION.md)                       | Implementación y despliegue paso a paso               |

---

## Organización del repositorio

Este proyecto usa un **monorepo único** (`helpdesk/`): frontend, backend e infraestructura
viven en el mismo repositorio. Es la opción adecuada para un equipo pequeño y un stack
que se levanta junto con `docker compose`.
