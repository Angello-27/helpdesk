// backend/routing-service/src/routing/routing.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoutingService } from './routing.service';

@Controller()
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  /**
   * Escuchar evento: ticket.created
   * Publicado por: tickets-service
   * Acción: Buscar agente disponible
   * Publica: ticket.assigned o ticket.unassigned
   */
  @MessagePattern('ticket.created')
  async handleTicketCreated(@Payload() payload: any) {
    console.log('📬 Evento recibido: ticket.created');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    await this.routingService.handleTicketCreated(payload);

    return {
      status: 'procesado',
      timestamp: new Date(),
    };
  }
}
