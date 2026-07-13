import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // One global gate: bad input is rejected with a 400 BEFORE any sync fan-out.
  //  - whitelist: strip unknown properties
  //  - forbidNonWhitelisted: 400 if unknown properties are sent
  //  - transform: coerce payloads into the DTO classes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Runy Universal Sync running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
