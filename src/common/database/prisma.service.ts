import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const maxRetries = 5;
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Successfully connected to the database.');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${(error as Error).message}`,
        );
        if (attempt === maxRetries) {
          this.logger.error('Exhausted database connection retries.');
          throw error;
        }
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
