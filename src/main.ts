import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('WitchTrade')
    .setDescription('A Witch It trading website.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const swaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: 'WitchTrade API'
  };

  SwaggerModule.setup('api', app, document, swaggerOptions);

  await app.listen(3001);
}
bootstrap();
