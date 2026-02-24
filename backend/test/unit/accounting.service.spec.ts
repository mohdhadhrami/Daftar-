import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JournalEntriesService } from '../../src/modules/accounting/services/journal-entries.service';
import { PrismaService } from '../../src/database/prisma.service';
import { AuditService } from '../../src/modules/audit/audit.service';

describe('JournalEntriesService', () => {
  let service: JournalEntriesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    journalEntry: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    journalLine: {
      findMany: jest.fn(),
    },
    chartOfAccount: {
      findMany: jest.fn(),
    },
    fiscalPeriod: {
      findFirst: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JournalEntriesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<JournalEntriesService>(JournalEntriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should reject entries with fewer than 2 lines', async () => {
      await expect(
        service.create('company-1', 'user-1', {
          entryDate: '2024-01-15',
          description: 'Test',
          lines: [{ accountId: 'acc-1', debit: 100, credit: 0 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unbalanced entries', async () => {
      await expect(
        service.create('company-1', 'user-1', {
          entryDate: '2024-01-15',
          description: 'Test',
          lines: [
            { accountId: 'acc-1', debit: 100, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject lines with both debit and credit', async () => {
      await expect(
        service.create('company-1', 'user-1', {
          entryDate: '2024-01-15',
          description: 'Test',
          lines: [
            { accountId: 'acc-1', debit: 100, credit: 50 },
            { accountId: 'acc-2', debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject zero-amount entries', async () => {
      await expect(
        service.create('company-1', 'user-1', {
          entryDate: '2024-01-15',
          description: 'Test',
          lines: [
            { accountId: 'acc-1', debit: 0, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: 0 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative amounts', async () => {
      await expect(
        service.create('company-1', 'user-1', {
          entryDate: '2024-01-15',
          description: 'Test',
          lines: [
            { accountId: 'acc-1', debit: -100, credit: 0 },
            { accountId: 'acc-2', debit: 0, credit: -100 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept balanced entries', async () => {
      mockPrismaService.chartOfAccount.findMany.mockResolvedValue([
        { id: 'acc-1', companyId: 'company-1', isActive: true },
        { id: 'acc-2', companyId: 'company-1', isActive: true },
      ]);
      mockPrismaService.fiscalPeriod.findFirst.mockResolvedValue(null);
      mockPrismaService.journalEntry.findFirst.mockResolvedValue(null);
      mockPrismaService.journalEntry.create.mockResolvedValue({
        id: 'entry-1',
        entryNumber: 'JE-0001',
        lines: [],
      });

      const result = await service.create('company-1', 'user-1', {
        entryDate: '2024-01-15',
        description: 'Balanced entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 1000 },
        ],
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.journalEntry.create).toHaveBeenCalled();
    });
  });

  describe('post', () => {
    it('should reject posting non-draft entries', async () => {
      mockPrismaService.journalEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        companyId: 'company-1',
        status: 'posted',
        lines: [],
      });

      await expect(
        service.post('company-1', 'entry-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('void', () => {
    it('should reject voiding non-posted entries', async () => {
      mockPrismaService.journalEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        companyId: 'company-1',
        status: 'draft',
        lines: [],
      });

      await expect(
        service.void('company-1', 'entry-1', 'user-1', 'test reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
