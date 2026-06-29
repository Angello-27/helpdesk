// backend/tickets-service/src/tickets/tickets.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Ticket, TicketStatus } from '../entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketCreatedEvent, TicketUpdatedEvent } from '../dto/ticket-event.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    @Inject('NATS_SERVICE') private natsClient: ClientProxy,
  ) {}

  /**
   * Crear nuevo ticket
   * 1. Guardar en BD
   * 2. Publicar evento "ticket.created"
   * El routing-service escucha este evento
   */
  async create(createTicketDto: CreateTicketDto) {
    // Crear entidad
    const ticket = this.ticketsRepository.create({
      ...createTicketDto,
      estado: TicketStatus.ABIERTO, // Estado inicial
    });

    // Guardar en BD
    const savedTicket = await this.ticketsRepository.save(ticket);
    console.log(`✅ Ticket ${savedTicket.id} creado en BD`);

    // Publicar evento para que routing-service lo procese
    const event: TicketCreatedEvent = {
      ticketId: savedTicket.id,
      asunto: savedTicket.asunto,
      categoria: savedTicket.categoria,
      prioridad: savedTicket.prioridad,
      solicitante_nombre: savedTicket.solicitante_nombre,
      solicitante_email: savedTicket.solicitante_email,
      creado_en: savedTicket.creado_en,
    };

    console.log('📤 Publicando evento: ticket.created', event);
    this.natsClient.emit('ticket.created', event);

    return {
      ...savedTicket,
      message: 'Ticket creado. En revisión para asignación...',
    };
  }

  /**
   * Obtener todos los tickets
   */
  async findAll() {
    const tickets = await this.ticketsRepository.find({
      order: {
        creado_en: 'DESC',
      },
    });
    return {
      total: tickets.length,
      tickets,
    };
  }

  /**
   * Obtener ticket por ID
   */
  async findOne(id: string) {
    return this.ticketsRepository.findOne({
      where: { id },
    });
  }

  /**
   * Actualizar ticket
   * El routing-service actualiza el estado a "asignado" o "sin_asignar"
   */
  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
    });

    if (!ticket) {
      throw new Error(`Ticket ${id} no encontrado`);
    }

    // Actualizar campos
    Object.assign(ticket, updateTicketDto);
    const updatedTicket = await this.ticketsRepository.save(ticket);

    // Si el estado cambió, publicar evento para notifications-service
    if (updateTicketDto.estado) {
      const event: TicketUpdatedEvent = {
        ticketId: updatedTicket.id,
        estado: updatedTicket.estado,
        agente_id: updatedTicket.agente_id,
      };

      console.log(
        `📤 Publicando evento: ticket.${updatedTicket.estado}`,
        event,
      );
      this.natsClient.emit(`ticket.${updatedTicket.estado}`, event);
    }

    return updatedTicket;
  }

  /**
   * Eliminar ticket (soft delete - marcar como cerrado)
   */
  async remove(id: string) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
    });

    if (!ticket) {
      throw new Error(`Ticket ${id} no encontrado`);
    }

    ticket.estado = TicketStatus.CERRADO;
    return this.ticketsRepository.save(ticket);
  }

  /**
   * Buscar tickets por categoría
   */
  async findByCategory(categoria: string) {
    const tickets = await this.ticketsRepository.find({
      where: { categoria: categoria as any },
      order: { creado_en: 'DESC' },
    });

    return {
      categoria,
      total: tickets.length,
      tickets,
    };
  }

  /**
   * Obtener tickets sin asignar (para dashboard de agentes)
   */
  async findUnassigned(categoria?: string) {
    const query = this.ticketsRepository
      .createQueryBuilder('ticket')
      .where('ticket.estado = :estado', {
        estado: TicketStatus.SIN_ASIGNAR,
      });

    if (categoria) {
      query.andWhere('ticket.categoria = :categoria', { categoria });
    }

    return query.orderBy('ticket.prioridad', 'DESC').addOrderBy('ticket.creado_en', 'ASC').getMany();
  }

  /**
   * Asignar ticket a agente (llamado por routing-service vía evento)
   */
  async assignToAgent(ticketId: string, agentId: string, agentName: string) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} no encontrado`);
    }

    ticket.agente_id = agentId;
    ticket.agente_nombre = agentName;
    ticket.estado = TicketStatus.ASIGNADO;

    return this.ticketsRepository.save(ticket);
  }

  /**
   * Marcar ticket como sin asignar (cuando no hay agentes disponibles)
   */
  async markAsUnassigned(ticketId: string) {
    const ticket = await this.ticketsRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} no encontrado`);
    }

    ticket.estado = TicketStatus.SIN_ASIGNAR;
    ticket.agente_id = null;
    ticket.agente_nombre = null;

    return this.ticketsRepository.save(ticket);
  }
}
