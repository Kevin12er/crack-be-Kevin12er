import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(process.env.PORT ?? 3001);

  // Railway/ingress berada di reverse proxy; penting untuk skenario production.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(cookieParser());

  const allowedOrigins = [
    process.env.GOOGLE_FRONTEND_URL,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_WWW,
    'http://localhost:3000',
    'https://learnbridge.fun',
    'https://www.learnbridge.fun',
  ].filter((origin): origin is string => Boolean(origin));

  // enable CORS untuk FE, termasuk cookie lintas origin
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} tidak diizinkan oleh CORS`),
        false,
      );
    },
    credentials: true,
  });

  // Pengaktifan global validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //Konfigurasi document builder dari swagger
  const config = new DocumentBuilder()
    .setTitle('LMS Backend API')
    .setDescription('Dokumentasi REST API untuk learning management system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Masukkan access token JWT disini',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  // Dokumen swagger
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available on http://localhost:${PORT}/api/docs`);
}
bootstrap();
