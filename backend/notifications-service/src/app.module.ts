import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'helpdesk_user',
      password: process.env.DB_PASSWORD || 'helpdesk_password',
      database: process.env.DB_NAME || 'helpdesk_db',
      entities: [],
      synchronize: false,
    }),
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
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class AppModule {}
