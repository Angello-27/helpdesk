import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('NATS_SERVICE') private natsClient: ClientProxy,
    private dataSource: DataSource,
  ) {}

  /**
   * Procesar ticket.assigned
   * El ticket fue asignado a un agente.
   * Guardar notificación en BD y simular envío de email/SMS.
   */
  async handleTicketAssigned(payload: any) {
    console.log(`📩 Procesando ticket.assigned:`, payload);

    const { ticketId, agentId, agentName, agentEmail, asunto, categoria } = payload;

    try {
      const notification = await this.createNotification({
        ticketId,
        tipo: 'assigned',
        agentId,
        agentName,
        agentEmail,
        asunto,
        categoria,
      });

      console.log(`✅ Notificación guardada:`, notification);

      await this.sendNotificationEmail({
        to: agentEmail,
        subject: `Nuevo ticket asignado: ${asunto}`,
        body: `Se te ha asignado un nuevo ticket de ${categoria}. ID: ${ticketId}`,
      });

      const solicitanteEmail = await this.getTicketSolicitante(ticketId);
      if (solicitanteEmail) {
        await this.sendNotificationEmail({
          to: solicitanteEmail,
          subject: `Tu ticket ${ticketId} ha sido asignado`,
          body: `Tu ticket "${asunto}" ha sido asignado a ${agentName}. Pronto será atendido.`,
        });
      }

      return { status: 'notificado', ticketId, agentId };
    } catch (error) {
      console.error('Error notificando asignación:', error);
      throw error;
    }
  }

  /**
   * Procesar ticket.unassigned
   * No hay agentes disponibles: guardar notificación y alertar al admin.
   */
  async handleTicketUnassigned(payload: any) {
    console.log(`⚠️ Procesando ticket.unassigned:`, payload);

    const { ticketId, asunto, categoria, razon } = payload;

    try {
      const notification = await this.createNotification({
        ticketId,
        tipo: 'unassigned',
        asunto,
        categoria,
        razon,
      });

      console.log(`✅ Notificación guardada:`, notification);

      await this.sendNotificationEmail({
        to: process.env.ADMIN_EMAIL || 'admin@helpdesk.local',
        subject: `⚠️ ALERTA: Ticket sin asignar - ${asunto}`,
        body: `El ticket ${ticketId} de categoría ${categoria} no pudo ser asignado. Motivo: ${razon}. Requiere atención manual.`,
      });

      return { status: 'alertado', ticketId, accion: 'Pendiente asignación manual' };
    } catch (error) {
      console.error('Error notificando rechazo:', error);
      throw error;
    }
  }

  /**
   * Guardar notificación en BD
   */
  private async createNotification(data: any) {
    const query = `
      INSERT INTO notifications (ticket_id, tipo, agent_id, agent_name, agent_email, asunto, categoria, razon, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, ticket_id, tipo, created_at
    `;

    const values = [
      data.ticketId,
      data.tipo,
      data.agentId || null,
      data.agentName || null,
      data.agentEmail || null,
      data.asunto,
      data.categoria,
      data.razon || null,
    ];

    try {
      const result = await this.dataSource.query(query, values);
      return result[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Obtener email del solicitante del ticket
   */
  private async getTicketSolicitante(ticketId: string) {
    const query = `SELECT solicitante_email FROM tickets WHERE id = $1`;

    try {
      const result = await this.dataSource.query(query, [ticketId]);
      return result.length > 0 ? result[0].solicitante_email : null;
    } catch (error) {
      console.error('Error fetching ticket solicitante:', error);
      return null;
    }
  }

  /**
   * Simular envío de email (en producción: SendGrid / AWS SES)
   */
  private async sendNotificationEmail(data: { to: string; subject: string; body: string }) {
    console.log(`📧 [EMAIL SIMULADO] To: ${data.to} | Subject: ${data.subject}`);
    console.log(`   Body: ${data.body}`);
  }
}
