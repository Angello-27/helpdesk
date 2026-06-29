// backend/tickets-service/src/tickets/tickets.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TICKET_PATTERNS } from '../messaging/patterns';

/**
 * Controlador del worker tickets-service.
 *
 * Ya NO expone HTTP. Responde a los patrones NATS request/reply que invoca el
 * api-gateway. La logica vive en TicketsService (igual que antes). Los errores
 * de "no encontrado" se devuelven como RpcException con `status: 404`; el
 * gateway los traduce a HTTP 404.
 */
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /** Crear ticket -> persiste y publica evento 'ticket.created' */
  @MessagePattern(TICKET_PATTERNS.CREATE)
  async create(@Payload() createTicketDto: CreateTicketDto) {
    console.log('📝 Creando nuevo ticket:', createTicketDto);
    return this.ticketsService.create(createTicketDto);
  }

  /** Listar todos los tickets */
  @MessagePattern(TICKET_PATTERNS.FIND_ALL)
  async findAll() {
    console.log('📋 Listando todos los tickets');
    return this.ticketsService.findAll();
  }

  /** Obtener ticket por ID (devuelve null si no existe; el gateway hace 404) */
  @MessagePattern(TICKET_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: { id: string }) {
    return this.ticketsService.findOne(data.id);
  }

  /** Actualizar ticket (404 si no existe) */
  @MessagePattern(TICKET_PATTERNS.UPDATE)
  async update(@Payload() data: { id: string; dto: UpdateTicketDto }) {
    console.log(`🔄 Actualizando ticket ${data.id}:`, data.dto);
    const ticket = await this.ticketsService.findOne(data.id);
    if (!ticket) {
      throw new RpcException({
        status: 404,
        message: `Ticket ${data.id} no encontrado`,
      });
    }
    return this.ticketsService.update(data.id, data.dto);
  }

  /** Eliminar ticket - soft delete (404 si no existe) */
  @MessagePattern(TICKET_PATTERNS.REMOVE)
  async remove(@Payload() data: { id: string }) {
    const ticket = await this.ticketsService.findOne(data.id);
    if (!ticket) {
      throw new RpcException({
        status: 404,
        message: `Ticket ${data.id} no encontrado`,
      });
    }
    return this.ticketsService.remove(data.id);
  }

  /** Filtrar por categoria */
  @MessagePattern(TICKET_PATTERNS.FIND_BY_CATEGORY)
  async findByCategory(@Payload() data: { categoria: string }) {
    return this.ticketsService.findByCategory(data.categoria);
  }

  /** Health check del worker (lo consulta el gateway) */
  @MessagePattern(TICKET_PATTERNS.HEALTH)
  health() {
    return {
      status: 'ok',
      service: 'tickets-service',
      timestamp: new Date(),
    };
  }
}
