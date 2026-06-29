# 🔄 Flujo Completo de Eventos - Helpdesk

## Vista de Conjunto

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / FRONTEND                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Browser (S3 / CloudFront / Nginx local)                                     │
│  ├─ http://helpdesk.com  o  http://localhost:3001                            │
│  └─ React 18 + TypeScript + Material UI (SPA)                                │
│                          │                                                    │
│                          ▼ POST /tickets                                      │
│      ┌──────────────────────────────────────┐                                │
│      │   Application Load Balancer (ALB)    │ ← Puerto 80/443               │
│      │   DNS: helpdesk-lb.amazonaws.com     │                               │
│      └──────────────┬───────────────────────┘                               │
│                     │                                                        │
│   ┌─────────────────┴───────────────────────────────────────┐               │
│   │                                                           │               │
│   │         AWS ECS CLUSTER (Fargate)                         │               │
│   │         ├─ VPC: 10.0.0.0/16                              │               │
│   │         ├─ Subnets: 10.0.10.0/24, 10.0.11.0/24           │               │
│   │         │                                                │               │
│   │    ┌────▼─────────────────────────────────────────────┐  │               │
│   │    │  TICKETS-SERVICE (HTTP, Puerto 3000)            │  │               │
│   │    │  ├─ NestJS + Express                            │  │               │
│   │    │  ├─ CRUD: POST/GET/PATCH/DELETE /tickets        │  │               │
│   │    │  ├─ Publica: ticket.created                     │  │               │
│   │    │  └─ DB: Tabla tickets, agents, notifications    │  │               │
│   │    └────┬─────────────────────────────────────────────┘  │               │
│   │         │                                                │               │
│   │         │ Evento: ticket.created                        │               │
│   │         ▼                                               │               │
│   │    ┌─────────────────────────────────────┐            │               │
│   │    │  NATS Message Broker                │            │               │
│   │    │  ├─ DNS: nats.app.internal:4222    │            │               │
│   │    │  ├─ Cloud Map Service Discovery    │            │               │
│   │    │  └─ Topics: ticket.*                │            │               │
│   │    └─────┬──────────────────┬────────────┘            │               │
│   │          │                  │                         │               │
│   │    ┌─────▼──────┐      ┌────▼──────────┐            │               │
│   │    │  ROUTING    │      │ NOTIFICATIONS │            │               │
│   │    │  SERVICE    │      │   SERVICE     │            │               │
│   │    │             │      │               │            │               │
│   │    │ Workers     │      │ Workers       │            │               │
│   │    │ NATS-only   │      │ NATS-only     │            │               │
│   │    └─────────────┘      └───────────────┘            │               │
│   │                                                        │               │
│   │    ┌──────────────────────────────────────────────┐   │               │
│   │    │  RDS PostgreSQL                             │   │               │
│   │    │  ├─ tickets                                 │   │               │
│   │    │  ├─ agents                                  │   │               │
│   │    │  ├─ notifications                           │   │               │
│   │    │  └─ agents_tickets                          │   │               │
│   │    └──────────────────────────────────────────────┘   │               │
│   │                                                        │               │
│   │    ┌──────────────────────────────────────────────┐   │               │
│   │    │  CloudWatch Logs                            │   │               │
│   │    │  ├─ /ecs/tickets-service                    │   │               │
│   │    │  ├─ /ecs/routing-service                    │   │               │
│   │    │  └─ /ecs/notifications-service              │   │               │
│   │    └──────────────────────────────────────────────┘   │               │
│   │                                                        │               │
│   │    Security Groups (Mínimo Privilegio):                │               │
│   │    ├─ ALB → Tickets (puerto 3000)                     │               │
│   │    ├─ Tickets → RDS (puerto 5432)                     │               │
│   │    ├─ Tickets → NATS (puerto 4222)                    │               │
│   │    ├─ Routing → RDS (puerto 5432)                     │               │
│   │    ├─ Routing → NATS (puerto 4222)                    │               │
│   │    ├─ Notifications → RDS (puerto 5432)               │               │
│   │    └─ Notifications → NATS (puerto 4222)              │               │
│   └───────────────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Flujo Paso a Paso

### FASE 1: Crear Ticket

```text
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Browser) - Usuario crea ticket                         │
│                                                                   │
│ 1. Rellena formulario:                                            │
│    - Asunto: "Monitor no funciona"                               │
│    - Categoría: "hardware"                                        │
│    - Prioridad: "alta"                                            │
│    - Solicitante: "Juan García"                                   │
│                                                                   │
│ 2. Click "Enviar" → TicketForm → api/tickets.ts createTicket()               │
│                                                                   │
│ 3. fetch() → POST http://localhost:3001/tickets (proxy Nginx → api-gateway)  │
│              Payload:                                             │
│              {                                                    │
│                "asunto": "Monitor no funciona",                  │
│                "categoria": "hardware",                          │
│                "prioridad": "alta",                              │
│                "solicitante_nombre": "Juan García",             │
│                "solicitante_email": "juan@empresa.com"          │
│              }                                                    │
│                                                                   │
│ 4. Response: {id: "uuid", status: "abierto", ...}               │
│    Snackbar: "Ticket creado con ID: abc12345"                   │
│                                                                   │
│ 5. Frontend actualiza lista (useTickets — polling cada 5 s)   │
│    GET /tickets → Muestra nuevos tickets                        │
└─────────────────────────────────────────────────────────────────┘
```

### FASE 2: Tickets Service - Recibe y Publica

```text
┌─────────────────────────────────────────────────────────────────┐
│ TICKETS SERVICE (main.ts + controller + service)                 │
│                                                                   │
│ 1. POST /tickets recibido en TicketsController                   │
│    - Valida datos con DTO (asunto, categoría, email, etc.)      │
│    - Ejecuta: ticketsService.create(dto)                        │
│                                                                   │
│ 2. Service logic:                                                │
│    a. Crear entidad Ticket con estado = "abierto"               │
│    b. Guardar en BD: INSERT INTO tickets (...)                  │
│       ├─ id: uuid generado                                       │
│       ├─ asunto: "Monitor no funciona"                           │
│       ├─ categoria: "hardware"                                   │
│       ├─ estado: "abierto"                                       │
│       └─ creado_en: NOW()                                        │
│                                                                   │
│    c. Publicar evento NATS:                                      │
│       emit('ticket.created', {                                   │
│         ticketId: "550e8400-e29b-41d4-a716-446655440000",      │
│         asunto: "Monitor no funciona",                           │
│         categoria: "hardware",                                   │
│         prioridad: "alta",                                       │
│         solicitante_nombre: "Juan García",                       │
│         solicitante_email: "juan@empresa.com",                   │
│         creado_en: "2024-01-15T10:30:00Z"                       │
│       })                                                         │
│                                                                   │
│ 3. Responder a frontend:                                         │
│    HTTP 201 {id, asunto, estado, creado_en, message}           │
│    message: "Ticket creado. En revisión para asignación..."     │
│                                                                   │
│ 4. Log:                                                          │
│    "✅ Ticket 550e840 creado en BD"                             │
│    "📤 Publicando evento: ticket.created"                       │
└─────────────────────────────────────────────────────────────────┘
```

### FASE 3: Routing Service - Busca Agente

```text
┌─────────────────────────────────────────────────────────────────┐
│ ROUTING SERVICE (Worker NATS - routing.controller.ts)            │
│                                                                   │
│ 1. @MessagePattern('ticket.created') escucha evento              │
│    Payload recibido:                                             │
│    {                                                             │
│      ticketId: "550e8400-e29b-41d4-a716-446655440000",         │
│      categoria: "hardware",                                      │
│      ...                                                         │
│    }                                                             │
│                                                                   │
│ 2. RoutingController.handleTicketCreated(@Payload())            │
│    → Ejecuta: routingService.handleTicketCreated(payload)       │
│                                                                   │
│ 3. Service logic:                                                │
│    a. Buscar agente disponible:                                  │
│       SQL: SELECT * FROM agents                                  │
│           WHERE categoria = 'hardware'                           │
│           AND status = 'disponible'                              │
│           LIMIT 1                                                │
│                                                                   │
│    b. Resultado: ENCONTRADO                                      │
│       Agent: {                                                   │
│         id: "agent-001",                                         │
│         nombre: "Carlos López",                                  │
│         email: "carlos@helpdesk.local",                         │
│         categoria: "hardware",                                   │
│         status: "disponible"                                     │
│       }                                                          │
│                                                                   │
│    c. Actualizar estado del agente:                              │
│       UPDATE agents                                              │
│       SET status = 'ocupado'                                     │
│       WHERE id = 'agent-001'                                     │
│                                                                   │
│    d. Publicar evento ASIGNACIÓN:                                │
│       emit('ticket.assigned', {                                  │
│         ticketId: "550e8400-e29b-41d4-a716-446655440000",      │
│         agentId: "agent-001",                                    │
│         agentName: "Carlos López",                               │
│         agentEmail: "carlos@helpdesk.local",                    │
│         asunto: "Monitor no funciona",                           │
│         categoria: "hardware",                                   │
│         assignedAt: "2024-01-15T10:30:15Z"                      │
│       })                                                         │
│                                                                   │
│ 4. Log:                                                          │
│    "🎯 Procesando ticket.created"                              │
│    "✅ Agente disponible encontrado: Carlos López"             │
│    "📤 Publicando: ticket.assigned"                            │
│                                                                   │
│ ALTERNATIVA (Sin agentes disponibles):                           │
│    a. No hay agentes → Resultado: NULL                           │
│    b. Publicar evento RECHAZO:                                   │
│       emit('ticket.unassigned', {                                │
│         ticketId: "550e8400-e29b-41d4-a716-446655440000",      │
│         asunto: "Monitor no funciona",                           │
│         categoria: "hardware",                                   │
│         razon: "Sin agentes disponibles",                        │
│         notificadoEn: "2024-01-15T10:30:20Z"                    │
│       })                                                         │
│    c. Log: "❌ No hay agentes para hardware"                    │
│            "📤 Publicando: ticket.unassigned"                   │
└─────────────────────────────────────────────────────────────────┘
```

### FASE 4a: Notifications - Ticket Asignado

```text
┌─────────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS SERVICE (Escucha: ticket.assigned)                 │
│                                                                   │
│ 1. @MessagePattern('ticket.assigned') triggered                  │
│    Payload:                                                      │
│    {                                                             │
│      ticketId: "550e8400-e29b-41d4-a716-446655440000",         │
│      agentId: "agent-001",                                       │
│      agentName: "Carlos López",                                  │
│      agentEmail: "carlos@helpdesk.local",                       │
│      asunto: "Monitor no funciona"                               │
│    }                                                             │
│                                                                   │
│ 2. NotificationsController.handleTicketAssigned(@Payload())     │
│    → Ejecuta: notificationsService.handleTicketAssigned(payload)│
│                                                                   │
│ 3. Service logic:                                                │
│    a. Guardar notificación en BD:                                │
│       INSERT INTO notifications (                                │
│         ticket_id, tipo, agent_id, agent_name, agent_email,     │
│         asunto, categoria, created_at                           │
│       ) VALUES (                                                 │
│         '550e8400...', 'assigned', 'agent-001',                │
│         'Carlos López', 'carlos@helpdesk.local',                │
│         'Monitor no funciona', 'hardware', NOW()                │
│       )                                                          │
│                                                                   │
│    b. Enviar email a agente:                                     │
│       SIMULADO:                                                  │
│       To: carlos@helpdesk.local                                  │
│       Subject: Nuevo ticket asignado: Monitor no funciona       │
│       Body: Se te ha asignado hardware/Monitor no...            │
│                                                                   │
│       EN PRODUCCIÓN: SendGrid / AWS SES                         │
│                                                                   │
│    c. Obtener email solicitante y notificar:                    │
│       SQL: SELECT solicitante_email FROM tickets               │
│            WHERE id = '550e8400...'                             │
│       → juan@empresa.com                                        │
│                                                                   │
│       Email al solicitante:                                      │
│       To: juan@empresa.com                                      │
│       Subject: Tu ticket ha sido asignado                       │
│       Body: Tu ticket "Monitor no funciona" ha sido asignado    │
│              a Carlos López. Pronto será atendido.              │
│                                                                   │
│ 4. Response:                                                     │
│    {                                                             │
│      status: "notificado",                                       │
│      ticketId: "550e8400...",                                   │
│      agentId: "agent-001"                                        │
│    }                                                             │
│                                                                   │
│ 5. Log:                                                          │
│    "📬 Evento recibido: ticket.assigned"                        │
│    "✅ Notificación guardada"                                   │
│    "📧 [EMAIL SIMULADO] To: carlos@helpdesk.local"             │
│    "📧 [EMAIL SIMULADO] To: juan@empresa.com"                   │
└─────────────────────────────────────────────────────────────────┘
```

### FASE 4b: Notifications - Ticket Sin Asignar

```text
┌─────────────────────────────────────────────────────────────────┐
│ NOTIFICATIONS SERVICE (Escucha: ticket.unassigned)               │
│                                                                   │
│ 1. @MessagePattern('ticket.unassigned') triggered                │
│    Payload:                                                      │
│    {                                                             │
│      ticketId: "550e8400-e29b-41d4-a716-446655440000",         │
│      asunto: "Monitor no funciona",                              │
│      categoria: "hardware",                                      │
│      razon: "Sin agentes disponibles"                            │
│    }                                                             │
│                                                                   │
│ 2. NotificationsController.handleTicketUnassigned(@Payload())   │
│                                                                   │
│ 3. Service logic:                                                │
│    a. Guardar notificación en BD:                                │
│       INSERT INTO notifications (                                │
│         ticket_id, tipo, asunto, categoria, razon, created_at   │
│       ) VALUES (                                                 │
│         '550e8400...', 'unassigned',                            │
│         'Monitor no funciona', 'hardware',                       │
│         'Sin agentes disponibles', NOW()                        │
│       )                                                          │
│                                                                   │
│    b. Alertar a administrador:                                   │
│       To: admin@helpdesk.local (env: ADMIN_EMAIL)               │
│       Subject: ⚠️ ALERTA: Ticket sin asignar - Monitor no       │
│       Body: El ticket [550e8400...] de categoría hardware       │
│              no pudo ser asignado. Motivo: Sin agentes           │
│              disponibles. Requiere atención manual.             │
│                                                                   │
│    c. Actualizar estado ticket en BD:                            │
│       UPDATE tickets                                             │
│       SET estado = 'sin_asignar'                                 │
│       WHERE id = '550e8400...'                                   │
│                                                                   │
│ 4. Response:                                                     │
│    {                                                             │
│      status: "alertado",                                         │
│      ticketId: "550e8400...",                                   │
│      accion: "Pendiente asignación manual"                       │
│    }                                                             │
│                                                                   │
│ 5. Log:                                                          │
│    "📬 Evento recibido: ticket.unassigned"                      │
│    "⚠️ Procesando ticket sin asignar"                           │
│    "✅ Notificación guardada"                                   │
│    "📧 [EMAIL SIMULADO] To: admin@helpdesk.local"              │
└─────────────────────────────────────────────────────────────────┘
```

### FASE 5: Frontend - Actualiza Vista

```text
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND - Polling automático (cada 5 segundos)                  │
│                                                                   │
│ 1. setInterval(() => loadTickets(), 5000)                        │
│    Ejecuta cada 5 segundos: fetch('/tickets')                   │
│                                                                   │
│ 2. GET /tickets response:                                        │
│    {                                                             │
│      total: 1,                                                   │
│      tickets: [                                                  │
│        {                                                         │
│          id: "550e8400-e29b-41d4-a716-446655440000",           │
│          asunto: "Monitor no funciona",                          │
│          categoria: "hardware",                                  │
│          prioridad: "alta",                                      │
│          estado: "asignado",  ← CAMBIÓ de "abierto"            │
│          agente_nombre: "Carlos López",  ← ASIGNADO             │
│          solicitante_nombre: "Juan García",                      │
│          creado_en: "2024-01-15T10:30:00Z"                      │
│        }                                                         │
│      ]                                                           │
│    }                                                             │
│                                                                   │
│ 3. renderTickets() actualiza tabla HTML:                         │
│    ┌────────────────────────────────────────────────────────┐  │
│    │ ID       │ Asunto           │ Cat      │ Estado       │  │
│    ├────────────────────────────────────────────────────────┤  │
│    │ 550e8400 │ Monitor no...    │ Hardware │ 🟣 Asignado  │  │
│    │          │                  │          │ Agente:      │  │
│    │          │                  │          │ Carlos López │  │
│    └────────────────────────────────────────────────────────┘  │
│                                                                   │
│ 4. updateStats():                                                │
│    ├─ Total: 1                                                   │
│    ├─ Abiertos: 0                                                │
│    ├─ Asignados: 1                                               │
│    └─ Sin asignar: 0                                             │
│                                                                   │
│ 5. Usuario ve que su ticket fue asignado a Carlos López          │
│    (O vería "Sin asignar" si no hay agentes)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Base de Datos - Cambios de Estado

### Tabla: tickets

```sql
-- ESTADO INICIAL
SELECT * FROM tickets WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Resultado:
│ id          │ asunto               │ categoria │ estado  │ agente_id │ agente_nombre │
├─────────────┼──────────────────────┼───────────┼─────────┼───────────┼───────────────┤
│ 550e8400... │ Monitor no funciona  │ hardware  │ abierto │ NULL      │ NULL          │

-- DESPUÉS DE ROUTING
-- (si agente encontrado)
│ id          │ asunto               │ categoria │ estado    │ agente_id  │ agente_nombre    │
├─────────────┼──────────────────────┼───────────┼───────────┼────────────┼──────────────────┤
│ 550e8400... │ Monitor no funciona  │ hardware  │ asignado  │ agent-001  │ Carlos López     │

-- O SI NO HAY AGENTES
│ id          │ asunto               │ categoria │ estado      │ agente_id │ agente_nombre │
├─────────────┼──────────────────────┼───────────┼─────────────┼───────────┼───────────────┤
│ 550e8400... │ Monitor no funciona  │ hardware  │ sin_asignar │ NULL      │ NULL          │
```

### Tabla: agents

```sql
-- ANTES
│ id         │ nombre       │ categoria │ status      │
├────────────┼──────────────┼───────────┼─────────────┤
│ agent-001  │ Carlos López │ hardware  │ disponible  │

-- DESPUÉS (Si ticket asignado)
│ id         │ nombre       │ categoria │ status      │
├────────────┼──────────────┼───────────┼─────────────┤
│ agent-001  │ Carlos López │ hardware  │ ocupado     │
```

### Tabla: notifications

```sql
-- INSERCIÓN (Si asignado)
INSERT INTO notifications 
  (ticket_id, tipo, agent_id, agent_name, created_at)
VALUES 
  ('550e8400...', 'assigned', 'agent-001', 'Carlos López', NOW());

-- INSERCIÓN (Si no hay agentes)
INSERT INTO notifications 
  (ticket_id, tipo, razon, created_at)
VALUES 
  ('550e8400...', 'unassigned', 'Sin agentes disponibles', NOW());
```

---

## 🔐 Security Groups - Mínimo Privilegio

```text
┌──────────────────────────────────────────────────────────┐
│ INTERNET                                                  │
│ └─ Port 80/443 (HTTP/HTTPS)                              │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ ALB Security Group         │
    ├────────────────────────────┤
    │ Ingress:                   │
    │ ├─ 0.0.0.0/0:80 (HTTP)    │
    │ ├─ 0.0.0.0/0:443 (HTTPS)  │
    │                            │
    │ Egress:                    │
    │ └─ SG_TICKETS:3000 (All)   │
    └────────────┬───────────────┘
                 │
                 ▼
    ┌────────────────────────────┐
    │ Tickets SG                 │
    ├────────────────────────────┤
    │ Ingress:                   │
    │ ├─ ALB_SG:3000             │
    │                            │
    │ Egress:                    │
    │ ├─ RDS_SG:5432             │
    │ ├─ NATS_SG:4222            │
    │ └─ ROUTING_SG:3001         │
    └────────────┬──┬────────────┘
                 │  │
        ┌────────┘  └────────┐
        │                    │
        ▼                    ▼
    ┌─────────┐         ┌──────────┐
    │ RDS SG  │         │ NATS SG  │
    ├─────────┤         ├──────────┤
    │ Ingress:│         │ Ingress: │
    │ Port    │         │ Port     │
    │ 5432    │         │ 4222     │
    │ from:   │         │ from:    │
    │ Tickets │         │ Tickets, │
    │ Routing │         │ Routing, │
    │ Notif   │         │ Notif    │
    └─────────┘         └──────────┘

Routing Service
├─ Ingress: NATS_SG:4222
├─ Egress: RDS_SG:5432, NATS_SG:4222

Notifications Service
├─ Ingress: NATS_SG:4222
├─ Egress: RDS_SG:5432, NATS_SG:4222
```

---

## 📋 Resumen de Eventos NATS

| #  | Evento              | Publicador      | Suscriptores          | Condición         |
| -- | ------------------- | --------------- | --------------------- | ----------------- |
| 1  | `ticket.created`    | tickets-service | routing-service       | Siempre           |
| 2a | `ticket.assigned`   | routing-service | notifications-service | Agente disponible |
| 2b | `ticket.unassigned` | routing-service | notifications-service | Sin agentes       |

---

## ⏱️ Timeline Típico

```text
T+0s:    Usuario crea ticket en frontend
         POST /tickets

T+1s:    Tickets Service:
         - Guarda en BD
         - Publica: ticket.created

T+1.5s:  Routing Service:
         - Escucha: ticket.created
         - Busca agente
         - Publica: ticket.assigned O ticket.unassigned

T+2s:    Notifications Service:
         - Escucha: ticket.assigned O ticket.unassigned
         - Guarda en BD
         - Simula envío de email

T+5s:    Frontend (polling):
         - GET /tickets
         - Actualiza lista
         - Usuario ve: "Asignado a Carlos López"

T+60s:   Admin ve dashboard:
         - 1 ticket asignado
         - 0 tickets sin asignar
         - 1 agente ocupado
```

---

## 💾 Queries SQL Útiles

```sql
-- Ver todos los tickets creados hoy
SELECT * FROM tickets 
WHERE DATE(creado_en) = TODAY()
ORDER BY creado_en DESC;

-- Ver tickets sin asignar por categoría
SELECT categoria, COUNT(*) as total
FROM tickets
WHERE estado = 'sin_asignar'
GROUP BY categoria;

-- Ver agentes y cuántos tickets tienen asignados
SELECT 
  a.nombre, 
  a.categoria, 
  a.status,
  COUNT(t.id) as tickets_activos
FROM agents a
LEFT JOIN tickets t ON a.id = t.agente_id AND t.estado != 'cerrado'
GROUP BY a.id, a.nombre, a.categoria, a.status;

-- Ver historial de notificaciones para un ticket
SELECT * FROM notifications
WHERE ticket_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;

-- Ver estadísticas generales
SELECT 
  COUNT(*) as total_tickets,
  SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) as abiertos,
  SUM(CASE WHEN estado = 'asignado' THEN 1 ELSE 0 END) as asignados,
  SUM(CASE WHEN estado = 'sin_asignar' THEN 1 ELSE 0 END) as sin_asignar,
  SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos
FROM tickets;
```

---

## 🎓 Conceptos Clave

### Arquitectura de Microservicios

- **Loose Coupling**: Servicios comunicados vía eventos, no directamente
- **High Cohesion**: Cada servicio tiene una responsabilidad clara
- **Escalabilidad**: Cada servicio se escala independientemente

### Asincronía con NATS

- **Publishers**: Tickets Service, Routing Service
- **Subscribers**: Routing Service, Notifications Service
- **Garantías**: At-least-once delivery

### Base de Datos

- **Tabla tickets**: Estado central del dominio
- **Tabla agents**: Catálogo de agentes disponibles
- **Tabla notifications**: Audit trail de notificaciones

### Security by Design

- **VPC**: Red privada aislada
- **Security Groups**: Firewall de mínimo privilegio
- **Cloud Map**: DNS privado sin IPs hardcodeadas
