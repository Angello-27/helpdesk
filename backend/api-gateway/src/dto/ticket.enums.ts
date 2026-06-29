/**
 * Enums del dominio de tickets, en version "plana" (sin TypeORM).
 *
 * El gateway NO accede a la BD, asi que no puede importar la entidad TypeORM
 * (`Ticket`) del tickets-service. Estos enums son la copia que usan los DTOs
 * para validar la entrada HTTP. Deben coincidir con los de
 * `backend/tickets-service/src/entities/ticket.entity.ts`.
 */
export enum TicketCategory {
  REDES = 'redes',
  HARDWARE = 'hardware',
  SOFTWARE = 'software',
}

export enum TicketPriority {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export enum TicketStatus {
  ABIERTO = 'abierto',
  ASIGNADO = 'asignado',
  EN_PROGRESO = 'en_progreso',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
  SIN_ASIGNAR = 'sin_asignar',
}
