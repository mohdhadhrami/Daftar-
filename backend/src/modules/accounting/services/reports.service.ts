import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Trial Balance: Lists all accounts with their debit/credit totals.
   * SUM(debit) must equal SUM(credit).
   */
  async getTrialBalance(
    companyId: string,
    asOfDate?: string,
  ): Promise<{ accounts: AccountBalance[]; totalDebit: number; totalCredit: number }> {
    const dateFilter = asOfDate ? new Date(asOfDate) : new Date();

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT
        coa.id as "accountId",
        coa.code as "accountCode",
        coa.name as "accountName",
        coa.account_type as "accountType",
        coa.normal_balance as "normalBalance",
        COALESCE(SUM(jl.debit), 0)::FLOAT as "totalDebit",
        COALESCE(SUM(jl.credit), 0)::FLOAT as "totalCredit"
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON jl.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
        AND je.status = 'posted'
        AND je.entry_date <= ${dateFilter}
      WHERE coa.company_id = ${companyId}::UUID
        AND coa.deleted_at IS NULL
        AND coa.is_active = true
      GROUP BY coa.id, coa.code, coa.name, coa.account_type, coa.normal_balance
      ORDER BY coa.code
    `;

    const accounts: AccountBalance[] = results.map((r) => {
      const balance =
        r.normalBalance === 'debit'
          ? r.totalDebit - r.totalCredit
          : r.totalCredit - r.totalDebit;

      return {
        accountId: r.accountId,
        accountCode: r.accountCode,
        accountName: r.accountName,
        accountType: r.accountType,
        debit: r.totalDebit,
        credit: r.totalCredit,
        balance,
      };
    });

    const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);

    return { accounts, totalDebit, totalCredit };
  }

  /**
   * Income Statement (Profit & Loss)
   * Revenue - Expenses = Net Income
   */
  async getIncomeStatement(
    companyId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT
        coa.account_type as "accountType",
        coa.sub_type as "subType",
        coa.code as "accountCode",
        coa.name as "accountName",
        coa.normal_balance as "normalBalance",
        COALESCE(SUM(jl.debit), 0)::FLOAT as "totalDebit",
        COALESCE(SUM(jl.credit), 0)::FLOAT as "totalCredit"
      FROM chart_of_accounts coa
      INNER JOIN journal_lines jl ON jl.account_id = coa.id
      INNER JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE coa.company_id = ${companyId}::UUID
        AND je.status = 'posted'
        AND je.entry_date >= ${start}
        AND je.entry_date <= ${end}
        AND coa.account_type IN ('revenue', 'expense')
        AND coa.deleted_at IS NULL
      GROUP BY coa.account_type, coa.sub_type, coa.code, coa.name, coa.normal_balance
      ORDER BY coa.code
    `;

    const revenue: any[] = [];
    const expenses: any[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const r of results) {
      const amount =
        r.normalBalance === 'credit'
          ? r.totalCredit - r.totalDebit
          : r.totalDebit - r.totalCredit;

      const item = {
        accountCode: r.accountCode,
        accountName: r.accountName,
        subType: r.subType,
        amount,
      };

      if (r.accountType === 'revenue') {
        revenue.push(item);
        totalRevenue += amount;
      } else {
        expenses.push(item);
        totalExpenses += amount;
      }
    }

    return {
      period: { startDate, endDate },
      revenue,
      totalRevenue,
      expenses,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    };
  }

  /**
   * Balance Sheet: Assets = Liabilities + Equity
   */
  async getBalanceSheet(companyId: string, asOfDate?: string) {
    const dateFilter = asOfDate ? new Date(asOfDate) : new Date();

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT
        coa.account_type as "accountType",
        coa.sub_type as "subType",
        coa.code as "accountCode",
        coa.name as "accountName",
        coa.normal_balance as "normalBalance",
        COALESCE(SUM(jl.debit), 0)::FLOAT as "totalDebit",
        COALESCE(SUM(jl.credit), 0)::FLOAT as "totalCredit"
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON jl.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
        AND je.status = 'posted'
        AND je.entry_date <= ${dateFilter}
      WHERE coa.company_id = ${companyId}::UUID
        AND coa.account_type IN ('asset', 'liability', 'equity')
        AND coa.deleted_at IS NULL
        AND coa.is_active = true
      GROUP BY coa.account_type, coa.sub_type, coa.code, coa.name, coa.normal_balance
      HAVING COALESCE(SUM(jl.debit), 0) != 0 OR COALESCE(SUM(jl.credit), 0) != 0
      ORDER BY coa.code
    `;

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const r of results) {
      const balance =
        r.normalBalance === 'debit'
          ? r.totalDebit - r.totalCredit
          : r.totalCredit - r.totalDebit;

      const item = {
        accountCode: r.accountCode,
        accountName: r.accountName,
        subType: r.subType,
        balance,
      };

      switch (r.accountType) {
        case 'asset':
          assets.push(item);
          totalAssets += balance;
          break;
        case 'liability':
          liabilities.push(item);
          totalLiabilities += balance;
          break;
        case 'equity':
          equity.push(item);
          totalEquity += balance;
          break;
      }
    }

    // Add net income to retained earnings
    const currentYearStart = new Date(dateFilter.getFullYear(), 0, 1);
    const incomeStatement = await this.getIncomeStatement(
      companyId,
      currentYearStart.toISOString(),
      dateFilter.toISOString(),
    );

    totalEquity += incomeStatement.netIncome;
    equity.push({
      accountCode: 'NET',
      accountName: 'Net Income (Current Year)',
      subType: 'net_income',
      balance: incomeStatement.netIncome,
    });

    return {
      asOfDate: dateFilter.toISOString().split('T')[0],
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  /**
   * Cash Flow Statement (Indirect Method)
   */
  async getCashFlowStatement(
    companyId: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get cash account movements
    const cashAccounts = await this.prisma.chartOfAccount.findMany({
      where: {
        companyId,
        code: { startsWith: '1000' },
        deletedAt: null,
      },
    });

    const cashAccountIds = cashAccounts.map((a) => a.id);

    const cashMovements = await this.prisma.$queryRaw<any[]>`
      SELECT
        coa2.account_type as "counterAccountType",
        coa2.sub_type as "counterSubType",
        coa2.name as "counterAccountName",
        SUM(
          CASE WHEN jl_cash.debit > 0 THEN jl_cash.debit ELSE -jl_cash.credit END
        )::FLOAT as "netCashEffect"
      FROM journal_lines jl_cash
      INNER JOIN journal_entries je ON je.id = jl_cash.journal_entry_id
      INNER JOIN journal_lines jl_counter ON jl_counter.journal_entry_id = je.id
        AND jl_counter.id != jl_cash.id
      INNER JOIN chart_of_accounts coa2 ON coa2.id = jl_counter.account_id
      WHERE jl_cash.company_id = ${companyId}::UUID
        AND jl_cash.account_id = ANY(${cashAccountIds}::UUID[])
        AND je.status = 'posted'
        AND je.entry_date >= ${start}
        AND je.entry_date <= ${end}
      GROUP BY coa2.account_type, coa2.sub_type, coa2.name
      ORDER BY coa2.account_type
    `;

    const operating: any[] = [];
    const investing: any[] = [];
    const financing: any[] = [];
    let totalOperating = 0;
    let totalInvesting = 0;
    let totalFinancing = 0;

    for (const m of cashMovements) {
      const item = {
        description: m.counterAccountName,
        amount: m.netCashEffect,
      };

      if (['revenue', 'expense'].includes(m.counterAccountType) ||
          ['current_asset', 'current_liability'].includes(m.counterSubType)) {
        operating.push(item);
        totalOperating += m.netCashEffect;
      } else if (['fixed_asset', 'contra_asset'].includes(m.counterSubType)) {
        investing.push(item);
        totalInvesting += m.netCashEffect;
      } else {
        financing.push(item);
        totalFinancing += m.netCashEffect;
      }
    }

    return {
      period: { startDate, endDate },
      operating: { items: operating, total: totalOperating },
      investing: { items: investing, total: totalInvesting },
      financing: { items: financing, total: totalFinancing },
      netCashChange: totalOperating + totalInvesting + totalFinancing,
    };
  }
}
