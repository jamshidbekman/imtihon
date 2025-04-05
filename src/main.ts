import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api');
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.use(cookieParser());

  const configService = app.get(ConfigService);

  const PORT = configService.get('PORT') || 3000;
  await app.listen(PORT, () => {
    console.log('Server run', PORT);
  });
}
bootstrap();
