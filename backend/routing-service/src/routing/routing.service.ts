// backend/routing-service/src/routing/routing.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

interface TicketCreatedPayload {
  ticketId: string;
  asunto: string;
  categoria: string;
  prioridad: string;
  solicitante_nombre: string;
  solicitante_email: string;
  creado_en: Date;
}

@Injectable()
export class RoutingService {
  constructor(
    @Inject('NATS_SERVICE') private natsClient: ClientProxy,
    private dataSource: DataSource,
  ) {}

  /**
   * Procesar ticket.created
   * 1. Buscar agentes disponibles para esa categoría
   * 2. Si existe → asignar y publicar ticket.assigned
   * 3. Si no existe → publicar ticket.unassigned
   */
  async handleTicketCreated(payload: TicketCreatedPayload) {
    console.log(`🎯 Procesando ticket.created:`, payload);

    const { ticketId, asunto, categoria } = payload;

    try {
      // Buscar agente disponible en BD para esa categoría
      const agent = await this.findAvailableAgent(categoria);

      if (agent) {
        console.log(`✅ Agente disponible encontrado:`, agent);

        // Actualizar estado del agente a "ocupado"
        await this.updateAgentStatus(agent.id, 'ocupado');

        // Publicar ticket.assigned
        const assignedEvent = {
          ticketId,
          agentId: agent.id,
          agentName: agent.nombre,
          agentEmail: agent.email,
          asunto,
          categoria,
          assignedAt: new Date(),
        };

        console.log('📤 Publicando: ticket.assigned', assignedEvent);
        this.natsClient.emit('ticket.assigned', assignedEvent);
      } else {
        console.warn(
          `❌ No hay agentes disponibles para categoría: ${categoria}`,
        );

        // Publicar ticket.unassigned
        const unassignedEvent = {
          ticketId,
          asunto,
          categoria,
          razon: 'Sin agentes disponibles',
          notificadoEn: new Date(),
        };

        console.log('📤 Publicando: ticket.unassigned', unassignedEvent);
        this.natsClient.emit('ticket.unassigned', unassignedEvent);
      }
    } catch (error) {
      console.error('❌ Error en routing:', error);
      // Publicar evento de error
      this.natsClient.emit('ticket.routing_error', {
        ticketId,
        error: error.message,
      });
    }
  }

  /**
   * Buscar agente disponible para una categoría
   * Query: SELECT * FROM agents WHERE categoria = ? AND status = 'disponible'
   * LIMIT 1
   */
  private async findAvailableAgent(categoria: string) {
    const query = `
      SELECT id, nombre, email, categoria, status
      FROM agents
      WHERE categoria = $1 AND status = 'disponible'
      LIMIT 1
    `;

    try {
      const result = await this.dataSource.query(query, [categoria]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error querying agents:', error);
      return null;
    }
  }

  /**
   * Actualizar estado del agente
   */
  private async updateAgentStatus(agentId: string, status: string) {
    const query = `
      UPDATE agents
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `;

    try {
      await this.dataSource.query(query, [status, agentId]);
      console.log(`✅ Agente ${agentId} actualizado a: ${status}`);
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  }
}
