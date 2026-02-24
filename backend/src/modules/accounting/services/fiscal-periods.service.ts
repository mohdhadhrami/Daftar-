import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class FiscalPeriodsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    companyId: string,
    data: { name: string; startDate: string; endDate: string },
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (end <= start) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping periods
    const overlap = await this.prisma.fiscalPeriod.findFirst({
      where: {
        companyId,
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException(
        `Period overlaps with existing period: ${overlap.name}`,
      );
    }

    return this.prisma.fiscalPeriod.create({
      data: {
        companyId,
        name: data.name,
        startDate: start,
        endDate: end,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.fiscalPeriod.findMany({
      where: { companyId },
      orderBy: { startDate: 'desc' },
    });
  }

  async lock(companyId: string, periodId: string, userId: string) {
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }

    if (period.isLocked) {
      throw new BadRequestException('Period is already locked');
    }

    // Check for any draft entries in this period
    const draftCount = await this.prisma.journalEntry.count({
      where: {
        companyId,
        status: 'draft',
        entryDate: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    });

    if (draftCount > 0) {
      throw new BadRequestException(
        `Cannot lock period with ${draftCount} draft journal entries. Post or delete them first.`,
      );
    }

    const updated = await this.prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: userId,
      },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: 'lock',
      entity: 'fiscal_period',
      entityId: periodId,
      newValues: { name: period.name },
    });

    return updated;
  }

  async unlock(companyId: string, periodId: string, userId: string) {
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }

    if (!period.isLocked) {
      throw new BadRequestException('Period is not locked');
    }

    const updated = await this.prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
      },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: 'unlock',
      entity: 'fiscal_period',
      entityId: periodId,
      newValues: { name: period.name },
    });

    return updated;
  }
}
