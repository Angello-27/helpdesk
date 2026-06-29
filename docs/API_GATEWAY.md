# 🚪 API Gateway — patrón y guía de cambios

> **Regla de oro del sistema:** el servicio que tiene la lógica de negocio y la BD
> (`tickets-service`) **no se expone por HTTP**. La única superficie HTTP es el
> **`api-gateway`**, que no tiene lógica ni BD: traduce HTTP → NATS.

## 1. Por qué

Exponer por HTTP un microservicio que además contiene la lógica y la BD acopla el
borde (autenticación, CORS, rate-limit, contrato REST) con el dominio, y agranda la
superficie de ataque (en AWS habría que poner ese servicio tras el ALB). Separar el
borde en un gateway delgado nos da:

- **Superficie mínima:** en AWS solo el `api-gateway` va detrás del ALB; el resto vive
  en subredes privadas hablando solo NATS.
- **Borde reutilizable:** auth, rate-limit, versionado y agregación de varios servicios
  se hacen en un único sitio.
- **Dominio aislado:** `tickets-service` solo conoce el contrato de mensajes NATS, no
  HTTP. Se puede reescribir su transporte sin tocar el frontend.

Coste asumido: cada request HTTP añade **un salto NATS** (request/reply). Latencia
extra mínima en LAN; a cambio, desacoplamiento.

## 2. Topología

```text
Frontend ──HTTP──> Nginx ──HTTP──> api-gateway ──NATS (request/reply)──> tickets-service ──> Postgres
 (React)           (proxy /tickets)  (HTTP :3000,          (worker NATS,                       │
                   sirve dist/)       sin lógica/BD)        dueño del dominio)                  │
                                                                  │ emit() eventos de dominio   │
                                                                  ▼                             │
                                                       ticket.created / ticket.<estado>         │
                                                                  │                             │
                                                   routing-service / notifications-service ─────┘
```

Hay **dos tipos de mensajes NATS**, no confundirlos:

| Tipo                  | Mecanismo                | Nombre             | Quién                                   | Para qué                                     |
| --------------------- | ------------------------ | ------------------ | --------------------------------------- | -------------------------------------------- |
| **Comando/consulta**  | `send()` request/reply   | `tickets.<accion>` | gateway → tickets-service               | Atender el request HTTP y devolver respuesta |
| **Evento de dominio** | `emit()` fire-and-forget | `ticket.<evento>`  | tickets-service → routing/notifications | Reaccionar a algo que ya pasó                |

## 3. Contrato de mensajes (request/reply)

Definido como constantes en **dos archivos gemelos que deben mantenerse en sync**:

- `backend/api-gateway/src/messaging/patterns.ts`
- `backend/tickets-service/src/messaging/patterns.ts`

| Patrón                   | Payload                        | Respuesta                                  |
| ------------------------ | ------------------------------ | ------------------------------------------ |
| `tickets.create`         | `CreateTicketDto`              | ticket creado (+ publica `ticket.created`) |
| `tickets.findAll`        | `{}`                           | `{ total, tickets }`                       |
| `tickets.findOne`        | `{ id }`                       | ticket \| `null`                           |
| `tickets.update`         | `{ id, dto: UpdateTicketDto }` | ticket actualizado                         |
| `tickets.remove`         | `{ id }`                       | ticket (soft delete)                       |
| `tickets.findByCategory` | `{ categoria }`                | `{ categoria, total, tickets }`            |
| `tickets.health`         | `{}`                           | `{ status, service }`                      |

### Mapeo de errores

El worker lanza `RpcException({ status, message })`. El gateway lo traduce a HTTP en
`tickets.controller.ts` (helper `send()`):

| `status` del worker | HTTP que devuelve el gateway |
| ------------------- | ---------------------------- |
| `404`               | `404 Not Found`              |
| `400`               | `400 Bad Request`            |
| otro / desconocido  | `500 Internal Server Error`  |

## 4. Cómo añadir un endpoint nuevo (receta)

Antes bastaba con tocar el controller del `tickets-service`. **Ahora son 4 pasos** en
3 archivos. Ejemplo: añadir `GET /tickets/sin-asignar` (ya existe el método de servicio
`findUnassigned`).

1. **Declarar el patrón** en *ambos* `messaging/patterns.ts`:

   ```ts
   FIND_UNASSIGNED: 'tickets.findUnassigned',
   ```

2. **Implementarlo en el worker** (`tickets-service/.../tickets.controller.ts`):

   ```ts
   @MessagePattern(TICKET_PATTERNS.FIND_UNASSIGNED)
   async findUnassigned(@Payload() data: { categoria?: string }) {
     return this.ticketsService.findUnassigned(data.categoria);
   }
   ```

3. **Exponer la ruta HTTP en el gateway** (`api-gateway/.../tickets.controller.ts`):

   ```ts
   @Get('sin-asignar')
   async findUnassigned(@Query('categoria') categoria?: string) {
     return this.send(TICKET_PATTERNS.FIND_UNASSIGNED, { categoria });
   }
   ```

   > ⚠️ **Orden de rutas:** en NestJS las rutas se evalúan por orden. Las rutas con
   > segmento literal (`sin-asignar`, `categoria/:categoria`, `health/check`) deben ir
   > **antes** que la genérica `:id`, o `:id` las capturará. En este controller las
   > literales ya están declaradas antes que `@Get(':id')`.

4. **Validación**: si el endpoint recibe body, crea/ajusta el DTO en
   `api-gateway/src/dto/` (la validación se hace **en el gateway**, no en el worker).

No hace falta tocar Nginx mientras la ruta cuelgue de `/tickets` (el proxy ya cubre
ese prefijo). Para un recurso nuevo (p. ej. `/agents`) añade un `location /agents` en
`nginx.conf` apuntando a `api-gateway:3000`.

## 5. Reglas que NO se deben romper

- ❌ **No** añadir `NestFactory.create` ni `app.listen(<puerto>)` en `tickets-service`,
  `routing-service` ni `notifications-service`. Son workers NATS (`createMicroservice`).
- ❌ **No** poner acceso a Postgres, entidades TypeORM ni reglas de negocio en el
  `api-gateway`. Si te hace falta un dato, pídelo por NATS.
- ✅ Los enums/DTOs del gateway (`api-gateway/src/dto/`) son una copia "plana" (sin
  TypeORM) de los del dominio. Si cambias un enum en
  `tickets-service/.../entities/ticket.entity.ts`, **actualiza también** el del gateway.
- ✅ Cambiar un patrón o su payload obliga a tocar **los dos** `patterns.ts` y esta tabla.

## 6. Impacto en AWS

El ALB apunta **solo** a `api-gateway`. `tickets-service`, `routing-service` y
`notifications-service` quedan en subredes privadas, sin entrada HTTP, accesibles entre
sí solo por NATS (CloudMap). Ver [`ARQUITECTURA.md`](../ARQUITECTURA.md) §6.
