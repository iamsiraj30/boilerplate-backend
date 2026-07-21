import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv, EnvConfig } from './config/env.config';
import { PrismaModule } from './common/database/prisma.module';
import { HealthModule } from './common/health/health.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import {
  RequestIdMiddleware,
  REQUEST_ID_HEADER,
} from './common/middleware/request-id.middleware';
import { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const isDev =
          configService.get('NODE_ENV', { infer: true }) !== 'production';
        return {
          pinoHttp: {
            level: isDev ? 'debug' : 'info',
            genReqId: (req: IncomingMessage) =>
              (req.headers[REQUEST_ID_HEADER] as string) ||
              (req as unknown as { id?: string }).id ||
              randomUUID(),

            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'body.password',
                'body.passwordConfirm',
              ],
              censor: '***',
            },
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
