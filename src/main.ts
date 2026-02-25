import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); //it just create app like express
  app.enableCors();

   //Enable DTO validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // removes extra unwanted fields
      forbidNonWhitelisted: true, // throws error if extra fields are sent
      transform: true,          // auto transform payloads
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
