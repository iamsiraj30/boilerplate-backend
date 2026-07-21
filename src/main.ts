import {
  Logger as NestLogger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { EnvConfig } from './config/env.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);

  // Use Pino as the application logger (flushes buffered bootstrap logs)
  app.useLogger(logger);

  // Resolve config early so it can drive middleware options
  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get<number>('PORT');
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS');
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  // Enable security headers via Helmet
  app.use(helmet());

  // Configure CORS
  app.enableCors({
    origin: allowedOrigins
      ? allowedOrigins.split(',').map((o) => o.trim())
      : !isProduction, // open in dev, blocked in prod if ALLOWED_ORIGINS is not set
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set Global prefix for all API routes (except docs)
  app.setGlobalPrefix('api', {
    exclude: ['api/docs'],
  });

  // Enable API Versioning (URI based: /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Register Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure Swagger Documentation
  const enableSwagger = configService.get('ENABLE_SWAGGER', { infer: true });
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('tprice API')
      .setDescription('The transaction price service API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Enable graceful shutdown hooks for container lifecycle support
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  if (enableSwagger) {
    logger.log(
      `📖 API Documentation available at: http://localhost:${port}/api/docs`,
    );
  }
}

bootstrap().catch((err) => {
  NestLogger.error('Error during bootstrap:', err);
  process.exit(1);
});
