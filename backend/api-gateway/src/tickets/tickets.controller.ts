import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TICKET_PATTERNS } from '../messaging/patterns';

/**
 * Controlador HTTP del gateway.
 *
 * Mantiene EXACTAMENTE las mismas rutas que antes exponia el tickets-service
 * (el frontend no cambia), pero en vez de ejecutar logica reenvia cada request
 * al tickets-service por NATS (request/reply) y devuelve la respuesta.
 */
@Controller('tickets')
export class TicketsController {
  constructor(@Inject('NATS_SERVICE') private readonly nats: ClientProxy) {}

  /**
   * Helper request/reply: envia un patron por NATS, espera la respuesta y
   * traduce los errores del worker (RpcException) a errores HTTP.
   */
  private async send<T>(pattern: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.nats.send<T>(pattern, payload));
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      const message = err?.message || 'Error en el servicio de tickets';
      if (status === 404) throw new NotFoundException(message);
      if (status === 400) throw new BadRequestException(message);
      throw new InternalServerErrorException(message);
    }
  }

  /** POST /tickets -> tickets.create (el worker publica luego ticket.created) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTicketDto: CreateTicketDto) {
    return this.send(TICKET_PATTERNS.CREATE, createTicketDto);
  }

  /** GET /tickets -> tickets.findAll */
  @Get()
  async findAll() {
    return this.send(TICKET_PATTERNS.FIND_ALL, {});
  }

  /** GET /tickets/categoria/:categoria -> tickets.findByCategory */
  @Get('categoria/:categoria')
  async findByCategory(@Param('categoria') categoria: string) {
    return this.send(TICKET_PATTERNS.FIND_BY_CATEGORY, { categoria });
  }

  /** GET /tickets/health/check -> verifica gateway + worker (tickets.health) */
  @Get('health/check')
  async health() {
    const worker = await this.send(TICKET_PATTERNS.HEALTH, {}).catch(() => null);
    return {
      status: 'ok',
      service: 'api-gateway',
      tickets_service: worker ?? 'unreachable',
      timestamp: new Date(),
    };
  }

  /** GET /tickets/:id -> tickets.findOne (404 si no existe) */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const ticket = await this.send(TICKET_PATTERNS.FIND_ONE, { id });
    if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);
    return ticket;
  }

  /** PATCH /tickets/:id -> tickets.update */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.send(TICKET_PATTERNS.UPDATE, { id, dto: updateTicketDto });
  }

  /** DELETE /tickets/:id -> tickets.remove (soft delete) */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.send(TICKET_PATTERNS.REMOVE, { id });
  }
}
