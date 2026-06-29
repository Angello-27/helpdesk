# 🎨 Frontend — React + Material UI

Interfaz web del helpdesk. Migrada de HTML/CSS/JS vanilla a **React 18**, **TypeScript**,
**Vite** y **Material UI (MUI)**.

---

## Stack

| Tecnología | Uso                                                           |
| ---------- | ------------------------------------------------------------- |
| React 18   | UI declarativa con componentes                                |
| TypeScript | Tipado de tickets, API y props                                |
| Vite 6     | Dev server + build de producción                              |
| MUI 6      | Componentes Material Design                                   |
| Nginx      | Sirve `dist/` en Docker y hace proxy `/tickets` → api-gateway |

---

## Estructura de carpetas

```text
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── Dockerfile              # build multi-stage (Node → Nginx)
├── index.html              # entrada Vite
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── theme.ts            # tema MUI personalizado
    ├── api/
    │   ├── config.ts       # API_URL, POLL_INTERVAL
    │   └── tickets.ts      # fetch, health, CRUD + PATCH
    ├── types/
    │   └── ticket.ts
    ├── context/
    │   └── TicketsContext.tsx   # estado global de tickets
    ├── hooks/
    │   ├── useTickets.ts        # datos, filtros, polling 5s
    │   └── useSnackbar.ts       # notificaciones
    ├── layouts/
    │   └── AppShell.tsx         # sidebar + app bar
    ├── pages/dashboard/
    │   ├── DashboardPage.tsx    # composición de secciones
    │   ├── useDashboardPage.ts  # handlers de la página
    │   ├── CreateTicketPanel.tsx
    │   └── TicketListPanel.tsx
    ├── components/
    │   ├── StatsCards.tsx
    │   ├── TicketForm.tsx
    │   ├── TicketTable.tsx
    │   ├── TicketFilters.tsx
    │   ├── TicketDetailDialog.tsx  # ver + editar ticket
    │   ├── StatusChip.tsx
    │   ├── feedback/
    │   │   └── AppSnackbar.tsx
    │   └── tickets/
    │       └── DeleteTicketDialog.tsx
    └── utils/
        └── labels.ts
```

---

## Funcionalidades

| Acción          | Implementación                                           |
| --------------- | -------------------------------------------------------- |
| Listar tickets  | `GET /tickets` + polling cada 5 s                        |
| Crear ticket    | `POST /tickets` + formulario colapsable                  |
| Ver detalle     | `TicketDetailDialog` (modo lectura)                      |
| Editar ticket   | `PATCH /tickets/:id` desde el dialog                     |
| Eliminar ticket | `DELETE /tickets/:id` + dialog de confirmación           |
| Filtros         | Búsqueda por asunto/ID, categoría y estado (client-side) |
| Estado API      | Chip en AppBar (health check)                            |

---

## Desarrollo local

### Opción A — Todo con Docker

```bash
docker compose up --build -d
# Frontend: http://localhost:3001
```

El servicio `frontend` compila React en el Dockerfile y Nginx sirve `dist/`.
Tras cambios en el código React:

```bash
docker compose build frontend && docker compose up -d frontend
```

### Opción B — Hot reload (recomendado al editar UI)

**Terminal 1** — backend:

```bash
docker compose up -d postgres nats api-gateway tickets-service routing-service notifications-service
```

**Terminal 2** — frontend:

```bash
cd frontend
npm install
npm run dev
# http://localhost:3001 — Vite hace proxy de /tickets → localhost:3000
```

---

## Build de producción

```bash
cd frontend
npm run build    # genera frontend/dist/
npm run preview  # previsualizar el build localmente
```

---

## Comunicación con la API

- En **Docker/Nginx**: el frontend llama a `window.location.origin` (mismo origen).
  Nginx enruta `/tickets/*` al `api-gateway:3000` (sin CORS).
- En **Vite dev**: `vite.config.ts` define proxy `/tickets` → `http://localhost:3000`.
- Override manual: `localStorage.setItem('apiUrl', 'http://...')`.

---

## Arquitectura de la UI

```text
App
├── TicketsProvider          ← useTickets (API + polling)
└── AppShell                 ← navegación + estado API
    └── DashboardPage        ← solo layout
        ├── StatsCards
        ├── CreateTicketPanel
        ├── TicketListPanel  ← filtros, tabla, dialogs
        └── AppSnackbar
```

La lógica de handlers (crear, editar, eliminar) vive en `useDashboardPage.ts`,
no en el JSX de la página.

---

## Despliegue en AWS

El build (`npm run build`) produce archivos estáticos en `dist/` listos para
**S3 + CloudFront**. La URL del API en producción debe apuntar al ALB del
`api-gateway` (variable de entorno o `localStorage.apiUrl` según estrategia).
