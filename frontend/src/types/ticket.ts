export type TicketCategory = 'redes' | 'hardware' | 'software';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';

export type TicketStatus =
  | 'abierto'
  | 'asignado'
  | 'en_progreso'
  | 'resuelto'
  | 'cerrado'
  | 'sin_asignar';

export interface Ticket {
  id: string;
  asunto: string;
  descripcion?: string;
  categoria: TicketCategory;
  prioridad: TicketPriority;
  estado: TicketStatus;
  solicitante_nombre: string;
  solicitante_email: string;
  agente_nombre?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CreateTicketPayload {
  asunto: string;
  descripcion: string;
  categoria: TicketCategory;
  prioridad: TicketPriority;
  solicitante_nombre: string;
  solicitante_email: string;
}

export interface UpdateTicketPayload {
  asunto?: string;
  descripcion?: string;
  categoria?: TicketCategory;
  prioridad?: TicketPriority;
  estado?: TicketStatus;
  agente_nombre?: string;
}

export interface TicketStats {
  total: number;
  abiertos: number;
  asignados: number;
  sinAsignar: number;
}
