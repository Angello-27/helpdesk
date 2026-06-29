import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * API Gateway: UNICO servicio que escucha HTTP.
 *
 * - Expone la API REST (`/tickets/...`) que consume el frontend via Nginx.
 * - Valida los DTOs aqui (frontera): si la entrada es invalida se rechaza
 *   antes de tocar NATS. El tickets-service confia en lo que recibe.
 * - No accede a la BD ni contiene reglas de negocio; solo traduce HTTP -> NATS.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para el frontend (en local va via proxy Nginx mismo-origen).
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Validacion automatica de DTOs en la frontera HTTP.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  await app.listen(3000);
  console.log('✅ API Gateway corriendo en puerto 3000 (HTTP)');
  console.log(`📍 NATS: ${process.env.NATS_URL || 'nats://nats:4222'}`);
}

bootstrap();
