import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Tickets Service: worker NATS PURO (sin HTTP).
 *
 * Antes este servicio exponia HTTP :3000. Ahora la superficie HTTP la tiene el
 * api-gateway; este servicio solo es alcanzable por NATS:
 *   - responde a los patrones request/reply 'tickets.*' (ver messaging/patterns.ts)
 *   - sigue publicando eventos de dominio ('ticket.created', 'ticket.<estado>')
 *     que consumen routing-service y notifications-service.
 *
 * Sigue dueño de Postgres y de toda la logica de negocio.
 */
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL || 'nats://nats:4222'],
      },
    },
  );

  await app.listen();
  console.log('✅ Tickets Service escuchando en NATS (worker, sin HTTP)');
  console.log(`📍 NATS: ${process.env.NATS_URL || 'nats://nats:4222'}`);
}

bootstrap();
