import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TicketsController } from './tickets/tickets.controller';

/**
 * API Gateway.
 *
 * No tiene TypeOrmModule ni providers de negocio: es solo el borde HTTP.
 * Registra un cliente NATS ('NATS_SERVICE') que el controller usa para
 * reenviar cada request al tickets-service mediante request/reply.
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://nats:4222'],
        },
      },
    ]),
  ],
  controllers: [TicketsController],
  providers: [],
})
export class AppModule {}
