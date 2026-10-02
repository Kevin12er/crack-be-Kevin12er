import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(process.env.PORT ?? 3001);

  app.use(cookieParser());
  
  //enable cors untuk front end
  app.enableCors({
    origin: process.env.GOOGLE_FRONTEND_URL || 'http://localhost:3000',
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
