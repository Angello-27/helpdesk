/**
 * CONTRATO DE MENSAJES NATS (request/reply) entre api-gateway y tickets-service.
 *
 * El tickets-service implementa estos patrones con `@MessagePattern(PATTERN)`.
 * El gateway los invoca con `client.send(PATTERN, payload)`.
 *
 * IMPORTANTE: gemelo de `backend/api-gateway/src/messaging/patterns.ts`.
 * Si cambias un patron o su payload, actualiza AMBOS lados y `docs/API_GATEWAY.md`.
 *
 * Los eventos de dominio (`ticket.created`, `ticket.<estado>`) NO van aqui:
 * se publican con emit() desde TicketsService y los consumen routing/notifications.
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
