# 🎟️ Helpdesk — Sistema de Mesa de Ayuda (Microservicios + NATS)

Plataforma de gestión de tickets de soporte construida con **NestJS**, comunicación por
**NATS**, base de datos **PostgreSQL** y un **frontend** CRUD. Sigue el patrón
**API Gateway**: un borde HTTP delgado (`api-gateway`) y servicios de dominio que son
workers NATS sin HTTP. Pensada para correr en local con `docker-compose` y desplegarse
en **AWS** con Terraform.

> Este repositorio migra por fases desde [`diplomado`](../diplomado). La documentación
> de diseño se conserva en [`docs/`](docs/) (fase 2 de la migración).

---

## 📁 Estructura del proyecto

```text
helpdesk/
├── docker-compose.yml          # Orquestación local (Postgres, NATS, gateway, 3 servicios, frontend)
├── init-db.sql                 # Schema + seed (se ejecuta al crear el contenedor Postgres)
├── nginx.conf                  # Sirve el frontend y hace proxy /tickets -> api-gateway
├── .gitignore
├── README.md                   # (este archivo)
├── ARQUITECTURA.md             # Diseño, flujo de eventos y decisiones
│
├── backend/
│   ├── api-gateway/            # UNICO con HTTP (:3000). Borde REST, traduce HTTP -> NATS
│   │   ├── src/
│   │   │   ├── main.ts          # HTTP + CORS + ValidationPipe
│   │   │   ├── app.module.ts    # cliente NATS (sin BD)
│   │   │   ├── messaging/patterns.ts   # contrato de patrones 'tickets.*'
│   │   │   ├── dto/{create,update}-ticket.dto.ts + ticket.enums.ts
│   │   │   └── tickets/tickets.controller.ts   # reenvia por NATS
│   │   ├── Dockerfile · package.json · tsconfig.json
│   ├── tickets-service/        # Worker NATS (CRUD + Postgres) — responde 'tickets.*', publica eventos
│   │   ├── src/
│   │   │   ├── main.ts          # createMicroservice (sin HTTP)
│   │   │   ├── app.module.ts
│   │   │   ├── entities/ticket.entity.ts
│   │   │   ├── messaging/patterns.ts   # gemelo del contrato
│   │   │   ├── dto/{create,update,ticket-event}.dto.ts
│   │   │   └── tickets/{tickets.controller,tickets.service}.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── routing-service/        # Worker NATS: asigna tickets a agentes
│   │   └── src/{main,app.module}.ts + routing/{routing.controller,routing.service}.ts
│   └── notifications-service/  # Worker NATS: registra y "envía" notificaciones
│       └── src/{main,app.module}.ts + notifications/{...}.ts
│
├── frontend/                   # HTML/CSS/JS puro (servido por Nginx)
│   ├── index.html
│   ├── styles.css
│   └── app.js
│
├── terraform/                  # IaC para AWS (ECS Fargate, RDS, ALB, ...)
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars.example
│
└── docs/                       # Documentación de diseño (guías, flujos, análisis)
```

---

## 🚀 Quick Start (local)

**Requisito:** Docker + Docker Compose.

```bash
# 1. Levantar todo el stack
docker-compose up --build

# 2. Abrir el frontend
#    http://localhost:3001

# 3. Probar la API directamente
curl http://localhost:3000/tickets/health/check
curl http://localhost:3000/tickets
```

Servicios y puertos:

| Servicio              | URL / Puerto            | Rol                                       |
| --------------------- | ----------------------- | ----------------------------------------- |
| Frontend (Nginx)      | <http://localhost:3001> | UI CRUD de tickets                        |
| api-gateway           | <http://localhost:3000> | **Único con HTTP.** Borde REST → NATS     |
| tickets-service       | (worker, sin HTTP)      | CRUD + Postgres, publica `ticket.created` |
| routing-service       | (worker, sin HTTP)      | Asigna agente, publica `ticket.*`         |
| notifications-service | (worker, sin HTTP)      | Registra/"envía" notificaciones           |
| NATS monitoring       | <http://localhost:8222> | Estado del broker                         |
| PostgreSQL            | localhost:5432          | `helpdesk_db` / `helpdesk_user`           |
| PgAdmin (opcional)    | <http://localhost:5050> | `docker-compose --profile debug up`       |

### Probar el flujo completo

```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{"asunto":"Internet lento","categoria":"redes","prioridad":"alta",
       "solicitante_nombre":"Miguel","solicitante_email":"miguel@empresa.com"}'

# Observar el flujo en los logs:
docker-compose logs -f routing-service notifications-service
```

El request pasa por: `api-gateway` (HTTP) → NATS `tickets.create` → `tickets-service`
guarda en BD y publica `ticket.created` → `routing-service` busca agente →
`ticket.assigned`/`ticket.unassigned` → `notifications-service`.

---

## 🛠️ Comandos útiles

```bash
docker-compose up --build        # levantar (reconstruyendo imágenes)
docker-compose up -d             # levantar en segundo plano
docker-compose logs -f <svc>     # ver logs de un servicio
docker-compose down              # parar y eliminar contenedores
docker-compose down -v           # parar y BORRAR la base de datos (reset total)
```

> 💡 Hay skills de Claude Code para este proyecto en `.claude/skills/`
> (`helpdesk-local`, `helpdesk-test-flujo`). Ejecútalos con `/helpdesk-local`, etc.

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
| [`docs/API_GATEWAY.md`](docs/API_GATEWAY.md)                                       | Patrón API Gateway y **receta para añadir endpoints** |
| [`docs/FLUJO_EVENTOS_COMPLETO.md`](docs/FLUJO_EVENTOS_COMPLETO.md)                 | Flujo de eventos detallado                            |
| [`docs/GUIA_IMPLEMENTACION.md`](docs/GUIA_IMPLEMENTACION.md)                       | Implementación y despliegue paso a paso               |
| [`docs/MONOREPO_VS_MULTIREPO_ANALISIS.md`](docs/MONOREPO_VS_MULTIREPO_ANALISIS.md) | Análisis de organización del repo                     |
