import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Ticket } from './entities/ticket.entity';
import { TicketsController } from './tickets/tickets.controller';
import { TicketsService } from './tickets/tickets.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'helpdesk_user',
      password: process.env.DB_PASSWORD || 'helpdesk_password',
      database: process.env.DB_NAME || 'helpdesk_db',
      entities: [Ticket],
      // Las tablas las crea init-db.sql; no dejamos que TypeORM altere el schema.
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Ticket]),
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
  providers: [TicketsService],
})
export class AppModule {}
