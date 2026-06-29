export class TicketCreatedEvent {
  ticketId: string;
  asunto: string;
  categoria: string;
  prioridad: string;
  solicitante_nombre: string;
  solicitante_email: string;
  creado_en: Date;
}

export class TicketUpdatedEvent {
  ticketId: string;
  estado: string;
  agente_id?: string;
}
