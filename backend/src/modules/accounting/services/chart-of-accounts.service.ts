import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateAccountDto) {
    // Validate parent account if provided
    if (dto.parentId) {
      const parent = await this.prisma.chartOfAccount.findFirst({
        where: { id: dto.parentId, companyId },
      });
      if (!parent) {
        throw new NotFoundException('Parent account not found');
      }
      if (parent.accountType !== dto.accountType) {
        throw new BadRequestException(
          'Child account must have the same account type as parent',
        );
      }
    }

    // Check for duplicate code
    const existing = await this.prisma.chartOfAccount.findUnique({
      where: { companyId_code: { companyId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException(`Account code ${dto.code} already exists`);
    }

    // Determine normal balance based on account type
    const normalBalance = ['asset', 'expense'].includes(dto.accountType)
      ? 'debit'
      : 'credit';

    return this.prisma.chartOfAccount.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        accountType: dto.accountType,
        subType: dto.subType,
        parentId: dto.parentId,
        description: dto.description,
        normalBalance,
      },
    });
  }

  async findAll(companyId: string, accountType?: string) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (accountType) {
      where.accountType = accountType;
    }

    return this.prisma.chartOfAccount.findMany({
      where,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true },
          where: { deletedAt: null },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findById(companyId: string, id: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null } },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(companyId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.findById(companyId, id);

    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be modified');
    }

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: {
        ...dto,
        version: { increment: 1 },
      },
    });
  }

  async softDelete(companyId: string, id: string) {
    const account = await this.findById(companyId, id);

    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be deleted');
    }

    // Check if account has journal lines
    const lineCount = await this.prisma.journalLine.count({
      where: { accountId: id },
    });

    if (lineCount > 0) {
      throw new BadRequestException(
        'Cannot delete account with existing journal entries. Deactivate it instead.',
      );
    }

    return this.prisma.chartOfAccount.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async seedDefaultAccounts(companyId: string) {
    const defaults = [
      // Assets
      { code: '1000', name: 'Cash', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit' },
      { code: '1100', name: 'Accounts Receivable', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit' },
      { code: '1200', name: 'Inventory', accountType: 'asset', subType: 'current_asset', normalBalance: 'debit' },
      { code: '1500', name: 'Fixed Assets', accountType: 'asset', subType: 'fixed_asset', normalBalance: 'debit' },
      { code: '1510', name: 'Accumulated Depreciation', accountType: 'asset', subType: 'contra_asset', normalBalance: 'credit' },
      // Liabilities
      { code: '2000', name: 'Accounts Payable', accountType: 'liability', subType: 'current_liability', normalBalance: 'credit' },
      { code: '2100', name: 'Accrued Liabilities', accountType: 'liability', subType: 'current_liability', normalBalance: 'credit' },
      { code: '2500', name: 'Long-term Debt', accountType: 'liability', subType: 'long_term_liability', normalBalance: 'credit' },
      // Equity
      { code: '3000', name: 'Owner\'s Equity', accountType: 'equity', subType: 'equity', normalBalance: 'credit' },
      { code: '3100', name: 'Retained Earnings', accountType: 'equity', subType: 'retained_earnings', normalBalance: 'credit' },
      // Revenue
      { code: '4000', name: 'Sales Revenue', accountType: 'revenue', subType: 'operating_revenue', normalBalance: 'credit' },
      { code: '4100', name: 'Service Revenue', accountType: 'revenue', subType: 'operating_revenue', normalBalance: 'credit' },
      { code: '4500', name: 'Other Income', accountType: 'revenue', subType: 'other_income', normalBalance: 'credit' },
      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', accountType: 'expense', subType: 'cost_of_goods', normalBalance: 'debit' },
      { code: '6000', name: 'Salaries & Wages', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit' },
      { code: '6100', name: 'Rent Expense', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit' },
      { code: '6200', name: 'Utilities Expense', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit' },
      { code: '6300', name: 'Office Supplies', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit' },
      { code: '6400', name: 'Depreciation Expense', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit' },
      { code: '6500', name: 'Insurance Expense', accountType: 'expense', subType: 'operating_expense', normalBalance: 'debit' },
      { code: '7000', name: 'Interest Expense', accountType: 'expense', subType: 'finance_expense', normalBalance: 'debit' },
      { code: '8000', name: 'Tax Expense', accountType: 'expense', subType: 'tax_expense', normalBalance: 'debit' },
    ];

    return this.prisma.chartOfAccount.createMany({
      data: defaults.map((a) => ({
        ...a,
        companyId,
        isSystem: true,
      })),
    });
  }
}
