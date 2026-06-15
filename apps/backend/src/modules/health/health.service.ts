import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: PrismaService) {}

  async check() {
    const dbCheck = await this.checkDatabase();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbCheck,
    };
  }

  async ready() {
    try {
      const dbCheck = await this.checkDatabase();
      return {
        status: dbCheck ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        error: error.message,
      };
    }
  }

  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}
