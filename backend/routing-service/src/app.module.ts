import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RoutingController } from './routing/routing.controller';
import { RoutingService } from './routing/routing.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'helpdesk_user',
      password: process.env.DB_PASSWORD || 'helpdesk_password',
      database: process.env.DB_NAME || 'helpdesk_db',
      // Usa consultas SQL crudas (DataSource); no necesita entidades mapeadas.
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
  controllers: [RoutingController],
  providers: [RoutingService],
})
export class AppModule {}
