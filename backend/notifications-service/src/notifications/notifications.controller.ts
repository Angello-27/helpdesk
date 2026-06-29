import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Escuchar evento: ticket.assigned (publicado por routing-service)
   */
  @MessagePattern('ticket.assigned')
  async handleTicketAssigned(@Payload() payload: any) {
    console.log('📬 Evento recibido: ticket.assigned');
    return await this.notificationsService.handleTicketAssigned(payload);
  }

  /**
   * Escuchar evento: ticket.unassigned (publicado por routing-service)
   */
  @MessagePattern('ticket.unassigned')
  async handleTicketUnassigned(@Payload() payload: any) {
    console.log('📬 Evento recibido: ticket.unassigned');
    return await this.notificationsService.handleTicketUnassigned(payload);
  }
}
