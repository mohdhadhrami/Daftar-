import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';

@Injectable()
export class JournalEntriesService {
  private readonly logger = new Logger(JournalEntriesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(companyId: string, userId: string, dto: CreateJournalEntryDto) {
    // Validate debit/credit balance
    this.validateBalance(dto.lines);

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(companyId);

    // Verify all accounts exist and belong to this company
    const accountIds = dto.lines.map((l) => l.accountId);
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        id: { in: accountIds },
        companyId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('One or more accounts are invalid');
    }

    // Check fiscal period is not locked
    if (dto.entryDate) {
      const lockedPeriod = await this.prisma.fiscalPeriod.findFirst({
        where: {
          companyId,
          isLocked: true,
          startDate: { lte: new Date(dto.entryDate) },
          endDate: { gte: new Date(dto.entryDate) },
        },
      });

      if (lockedPeriod) {
        throw new BadRequestException(
          `Cannot create entries in locked period: ${lockedPeriod.name}`,
        );
      }
    }

    const entry = await this.prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber,
        entryDate: new Date(dto.entryDate),
        description: dto.description,
        reference: dto.reference,
        source: dto.source || 'manual',
        sourceId: dto.sourceId,
        createdById: userId,
        lines: {
          create: dto.lines.map((line, index) => ({
            companyId,
            accountId: line.accountId,
            description: line.description,
            debit: new Decimal(line.debit || 0),
            credit: new Decimal(line.credit || 0),
            currency: line.currency || 'USD',
            exchangeRate: new Decimal(line.exchangeRate || 1),
            lineOrder: index,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true, accountType: true },
            },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: 'create',
      entity: 'journal_entry',
      entityId: entry.id,
      newValues: { entryNumber, description: dto.description },
    });

    return entry;
  }

  async findAll(
    companyId: string,
    options: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { status, startDate, endDate, page = 1, limit = 20 } = options;

    const where: any = { companyId };

    if (status) where.status = status;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: {
                select: { id: true, code: true, name: true },
              },
            },
            orderBy: { lineOrder: 'asc' },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { entryDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return {
      entries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(companyId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true, accountType: true },
            },
          },
          orderBy: { lineOrder: 'asc' },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        postedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        fiscalPeriod: true,
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  async post(companyId: string, id: string, userId: string) {
    const entry = await this.findById(companyId, id);

    if (entry.status !== 'draft') {
      throw new BadRequestException(
        `Cannot post entry with status: ${entry.status}`,
      );
    }

    // Final balance check
    const totalDebit = entry.lines.reduce(
      (sum, l) => sum + Number(l.debit),
      0,
    );
    const totalCredit = entry.lines.reduce(
      (sum, l) => sum + Number(l.credit),
      0,
    );

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      );
    }

    if (totalDebit === 0) {
      throw new BadRequestException('Journal entry must have at least one line');
    }

    // Check period lock
    const lockedPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        companyId,
        isLocked: true,
        startDate: { lte: entry.entryDate },
        endDate: { gte: entry.entryDate },
      },
    });

    if (lockedPeriod) {
      throw new BadRequestException(
        `Cannot post to locked period: ${lockedPeriod.name}`,
      );
    }

    // Find applicable fiscal period
    const fiscalPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        companyId,
        startDate: { lte: entry.entryDate },
        endDate: { gte: entry.entryDate },
      },
    });

    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'posted',
        postedAt: new Date(),
        postedById: userId,
        fiscalPeriodId: fiscalPeriod?.id,
        version: { increment: 1 },
      },
      include: {
        lines: {
          include: {
            account: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: 'post',
      entity: 'journal_entry',
      entityId: id,
      oldValues: { status: 'draft' },
      newValues: { status: 'posted' },
    });

    return updated;
  }

  async void(companyId: string, id: string, userId: string, reason: string) {
    const entry = await this.findById(companyId, id);

    if (entry.status !== 'posted') {
      throw new BadRequestException('Only posted entries can be voided');
    }

    // Create reversing entry
    const reversingNumber = await this.generateEntryNumber(companyId);

    const reversingEntry = await this.prisma.journalEntry.create({
      data: {
        companyId,
        entryNumber: reversingNumber,
        entryDate: new Date(),
        description: `Reversal of ${entry.entryNumber}: ${reason}`,
        reference: entry.entryNumber,
        status: 'posted',
        source: 'system',
        sourceId: entry.id,
        createdById: userId,
        postedAt: new Date(),
        postedById: userId,
        fiscalPeriodId: entry.fiscalPeriodId,
        lines: {
          create: entry.lines.map((line, index) => ({
            companyId,
            accountId: line.accountId,
            description: `Reversal: ${line.description || ''}`,
            debit: line.credit, // Swap debit and credit
            credit: line.debit,
            currency: line.currency,
            exchangeRate: line.exchangeRate,
            lineOrder: index,
          })),
        },
      },
    });

    // Mark original as voided
    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data: {
        status: 'voided',
        voidedAt: new Date(),
        voidedById: userId,
        voidReason: reason,
        version: { increment: 1 },
      },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: 'void',
      entity: 'journal_entry',
      entityId: id,
      oldValues: { status: 'posted' },
      newValues: { status: 'voided', voidReason: reason, reversingEntryId: reversingEntry.id },
    });

    return { voidedEntry: updated, reversingEntry };
  }

  private validateBalance(
    lines: { debit?: number; credit?: number }[],
  ) {
    if (!lines || lines.length < 2) {
      throw new BadRequestException(
        'Journal entry must have at least 2 lines',
      );
    }

    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `Total debits (${totalDebit}) must equal total credits (${totalCredit})`,
      );
    }

    if (totalDebit === 0) {
      throw new BadRequestException(
        'Journal entry must have non-zero amounts',
      );
    }

    // Each line must have either debit or credit, not both
    for (const line of lines) {
      const debit = line.debit || 0;
      const credit = line.credit || 0;

      if (debit > 0 && credit > 0) {
        throw new BadRequestException(
          'Each line must have either a debit or credit amount, not both',
        );
      }

      if (debit === 0 && credit === 0) {
        throw new BadRequestException(
          'Each line must have a non-zero debit or credit amount',
        );
      }

      if (debit < 0 || credit < 0) {
        throw new BadRequestException(
          'Debit and credit amounts must be positive',
        );
      }
    }
  }

  private async generateEntryNumber(companyId: string): Promise<string> {
    const lastEntry = await this.prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { entryNumber: true },
    });

    if (!lastEntry) {
      return 'JE-0001';
    }

    const lastNum = parseInt(lastEntry.entryNumber.replace(/\D/g, ''), 10) || 0;
    return `JE-${String(lastNum + 1).padStart(4, '0')}`;
  }
}
