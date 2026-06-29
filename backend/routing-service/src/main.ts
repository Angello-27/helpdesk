// backend/routing-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crear microservicio NATS puro (sin HTTP)
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
  console.log('✅ Routing Service escuchando en NATS');
  console.log(`📍 NATS: ${process.env.NATS_URL || 'nats://nats:4222'}`);
}

bootstrap();
