import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Set the current tenant context for RLS policies.
   * Must be called within a transaction to be effective.
   */
  async setTenantContext(companyId: string) {
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_company_id = '${companyId}'`,
    );
  }

  /**
   * Execute operations within a tenant-scoped transaction.
   */
  async withTenant<T>(companyId: string, fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_company_id = '${companyId}'`,
      );
      return fn(tx as PrismaClient);
    });
  }
}
