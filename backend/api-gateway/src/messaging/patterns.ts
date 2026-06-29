/**
 * CONTRATO DE MENSAJES NATS (request/reply) entre api-gateway y tickets-service.
 *
 * El gateway invoca estos patrones con `client.send(PATTERN, payload)` y espera
 * una respuesta. El tickets-service los implementa con `@MessagePattern(PATTERN)`.
 *
 * IMPORTANTE: este archivo debe mantenerse en sync con su gemelo en
 * `backend/tickets-service/src/messaging/patterns.ts`. Si cambias un patron o
 * su payload, actualiza AMBOS lados y la doc en `docs/API_GATEWAY.md`.
 *
 * Convencion de nombres:
 *   - <recurso>.<accion>  -> request/reply (espera respuesta).  Ej: 'tickets.create'
 *   - ticket.<evento>     -> evento de dominio fire-and-forget (NO va aqui; lo
 *                            publica tickets-service con emit() y lo consumen
 *                            routing/notifications).  Ej: 'ticket.created'
 */
export const TICKET_PATTERNS = {
  CREATE: 'tickets.create',
  FIND_ALL: 'tickets.findAll',
  FIND_ONE: 'tickets.findOne',
  UPDATE: 'tickets.update',
  REMOVE: 'tickets.remove',
  FIND_BY_CATEGORY: 'tickets.findByCategory',
  HEALTH: 'tickets.health',
} as const;
