# 🏛️ Arquitectura — Helpdesk

## 1. Visión general

Sistema de mesa de ayuda basado en **microservicios desacoplados** que se comunican
por **NATS**. Los tickets son la fuente de verdad; el enrutamiento y las notificaciones
reaccionan a eventos, no se llaman directamente entre sí.

**Patrón API Gateway:** la única superficie HTTP es el `api-gateway` (borde delgado,
sin lógica ni BD). Los servicios de dominio son workers NATS sin HTTP. Ver
[`docs/API_GATEWAY.md`](docs/API_GATEWAY.md).

```text
                         ┌──────────────────────────┐
                         │        Frontend          │
                         │   (Nginx :3001 / S3)      │
                         └────────────┬─────────────┘
                                      │ HTTP  (POST/GET/PATCH/DELETE /tickets)
                                      ▼
                         ┌──────────────────────────┐
                         │       api-gateway        │  HTTP :3000 (UNICO con HTTP)
                         │  CORS + validacion DTO    │  sin logica de negocio ni BD
                         └────────────┬─────────────┘
                                      │ NATS request/reply  (tickets.*)
                                      ▼
                         ┌──────────────────────────┐
                         │     tickets-service      │  worker NATS (sin HTTP)
                         │  CRUD + persistencia     │
                         └──────┬───────────┬───────┘
                       publica  │           │  lee/escribe
                  ticket.created│           ▼
                                │     ┌───────────┐
                                │     │ PostgreSQL│  tickets / agents / notifications
                                │     └─────┬─────┘
                                ▼           │
                         ┌──────────────┐   │ (consulta agentes)
                         │  NATS broker │   │
                         └──────┬───────┘   │
                  ┌─────────────┴───────────┴────────────┐
                  ▼                                       ▼
        ┌───────────────────┐                 ┌──────────────────────┐
        │  routing-service  │  publica         │ notifications-service│
        │  (worker NATS)    │  ticket.assigned │   (worker NATS)      │
        │  busca agente     │  ticket.unassigned ──────► registra +   │
        └───────────────────┘ ───────────────►│        "envía" email │
                                               └──────────────────────┘
```

## 2. Componentes

| Componente                | Tipo                  | Responsabilidad                                                                                                                                       |
| ------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **api-gateway**           | NestJS HTTP (`:3000`) | **Único con HTTP.** Borde REST (`/tickets/...`), CORS y validación de DTOs. Sin lógica ni BD: traduce HTTP → NATS (`tickets.*`) hacia tickets-service |
| **tickets-service**       | NestJS worker NATS    | CRUD de tickets, persiste en Postgres. Responde patrones `tickets.*` y publica eventos `ticket.created` / `ticket.<estado>`                           |
| **routing-service**       | NestJS worker NATS    | Escucha `ticket.created`, busca agente disponible por categoría, publica `ticket.assigned` / `ticket.unassigned`                                      |
| **notifications-service** | NestJS worker NATS    | Escucha `ticket.assigned` / `ticket.unassigned`, registra notificación y simula email                                                                 |
| **PostgreSQL**            | Base de datos         | Tablas `tickets`, `agents`, `notifications`, `agents_tickets`                                                                                         |
| **NATS**                  | Message broker        | Transporte de eventos entre servicios                                                                                                                 |
| **Frontend**              | HTML/JS + Nginx       | UI CRUD; Nginx hace proxy de `/tickets` al backend (mismo origen)                                                                                     |

## 3. Flujo de eventos

1. El usuario crea un ticket → `POST /tickets` en **api-gateway**, que lo reenvía por
   NATS (`tickets.create`) a **tickets-service**.
2. tickets-service guarda en BD (estado `abierto`) y **publica `ticket.created`**.
3. **routing-service** recibe el evento y busca un agente `disponible` de esa categoría:
   - Si encuentra → marca agente `ocupado` y **publica `ticket.assigned`**.
   - Si no hay → **publica `ticket.unassigned`**.
4. **notifications-service** recibe `ticket.assigned`/`ticket.unassigned`:
   - Inserta un registro en `notifications`.
   - Simula el envío de email al agente y/o alerta al admin.

> Nota: en el código actual routing/notifications registran y notifican; la
> actualización del estado del ticket en la tabla `tickets` puede hacerse vía
> `PATCH /tickets/:id` (que a su vez emite `ticket.<estado>`). Ver
> [`docs/FLUJO_EVENTOS_COMPLETO.md`](docs/FLUJO_EVENTOS_COMPLETO.md).

### Mensajes NATS

Hay **dos tipos** (detalle en [`docs/API_GATEWAY.md`](docs/API_GATEWAY.md)):

**Comandos/consultas — `send()` request/reply** (gateway → tickets-service):

| Patrón                                                                                       | Para                                         |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `tickets.create` / `findAll` / `findOne` / `update` / `remove` / `findByCategory` / `health` | atender el request HTTP y devolver respuesta |

**Eventos de dominio — `emit()` fire-and-forget:**

| Evento              | Publicado por                   | Consumido por         |
| ------------------- | ------------------------------- | --------------------- |
| `ticket.created`    | tickets-service                 | routing-service       |
| `ticket.assigned`   | routing-service                 | notifications-service |
| `ticket.unassigned` | routing-service                 | notifications-service |
| `ticket.<estado>`   | tickets-service (al actualizar) | notifications-service |

## 4. Modelo de datos

- **tickets**: `id`, `asunto`, `descripcion`, `categoria`, `prioridad`, `estado`,
  `solicitante_*`, `agente_*`, timestamps.
- **agents**: `id`, `nombre`, `email`, `categoria`, `status` (`disponible|ocupado|inactivo`).
- **notifications**: `id`, `ticket_id`, `tipo`, datos del agente, `razon`, `estado`.
- **agents_tickets**: relación N:M agente↔ticket.

El schema y los agentes de prueba se crean en [`init-db.sql`](init-db.sql).

## 5. Decisiones de diseño

- **API Gateway como único borde HTTP**: el servicio con la lógica y la BD
  (`tickets-service`) **no se expone por HTTP**; lo hace el `api-gateway`, un borde
  delgado sin lógica ni BD. Superficie de exposición mínima (en AWS solo el gateway
  va detrás del ALB) y un único sitio para auth/CORS/rate-limit. Detalle y guía de
  cambios en [`docs/API_GATEWAY.md`](docs/API_GATEWAY.md).
- **Eventos en vez de llamadas directas**: routing y notifications no conocen
  endpoints de nadie; solo el contrato de eventos NATS → bajo acoplamiento.
- **Comandos (request/reply) vs eventos (fire-and-forget)**: el gateway usa
  `send()` y espera respuesta; los eventos de dominio se publican con `emit()`.
- **`synchronize: false` en TypeORM**: el schema lo gobierna `init-db.sql`,
  evitando que TypeORM altere la BD de forma no determinista.
- **Nginx como proxy del frontend**: el frontend llama a `/tickets` en su propio
  origen y Nginx reenvía al backend → se evita configurar CORS en local.
- **Workers sin puerto HTTP**: routing y notifications usan
  `NestFactory.createMicroservice` (solo NATS), no escuchan HTTP.

## 6. Arquitectura en AWS (objetivo)

| Recurso           | Servicio AWS                                                              |
| ----------------- | ------------------------------------------------------------------------- |
| Cómputo           | ECS Fargate (1 task por microservicio + NATS)                             |
| Base de datos     | RDS PostgreSQL                                                            |
| Entrada           | ALB → api-gateway (único servicio público; el resto en subredes privadas) |
| Service discovery | AWS CloudMap (`*.app.internal`)                                           |
| Frontend          | S3 + CloudFront                                                           |
| Imágenes          | ECR                                                                       |
| Logs              | CloudWatch Logs (uno por servicio)                                        |
| Red               | VPC con subredes públicas/privadas, Security Groups de mínimo privilegio  |

Definido en [`terraform/`](terraform/). Despliegue en
[`docs/GUIA_IMPLEMENTACION.md`](docs/GUIA_IMPLEMENTACION.md).
