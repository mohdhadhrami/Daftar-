import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../database/prisma.service';
import { ReportsService } from '../accounting/services/reports.service';

interface AiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private reportsService: ReportsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4');

    this.openai = new OpenAI({
      apiKey: apiKey || 'not-configured',
    });
  }

  /**
   * Categorize an expense description into a chart of accounts category.
   * Returns the most likely account code and name.
   */
  async categorizeExpense(
    companyId: string,
    description: string,
    amount: number,
  ): Promise<AiResponse<{ accountCode: string; accountName: string; confidence: number }>> {
    try {
      // Fetch company's expense accounts for context
      const accounts = await this.prisma.chartOfAccount.findMany({
        where: {
          companyId,
          accountType: 'expense',
          isActive: true,
          deletedAt: null,
        },
        select: { code: true, name: true, subType: true },
      });

      const sanitizedDescription = this.sanitizeInput(description);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an accounting assistant. Categorize expenses into the most appropriate account from the provided chart of accounts. Respond ONLY with valid JSON in the format: {"accountCode": "string", "accountName": "string", "confidence": number_between_0_and_1}. Do not include any other text.`,
          },
          {
            role: 'user',
            content: `Available expense accounts:\n${accounts.map((a) => `${a.code} - ${a.name}`).join('\n')}\n\nCategorize this expense:\nDescription: ${sanitizedDescription}\nAmount: ${amount}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.fallbackExpenseCategory();
      }

      const parsed = JSON.parse(content);
      return {
        success: true,
        data: {
          accountCode: String(parsed.accountCode),
          accountName: String(parsed.accountName),
          confidence: Math.min(1, Math.max(0, Number(parsed.confidence))),
        },
      };
    } catch (error) {
      this.logger.error(`Expense categorization failed: ${(error as Error).message}`);
      return this.fallbackExpenseCategory();
    }
  }

  /**
   * Detect anomalies in journal entries for a given period.
   */
  async detectAnomalies(
    companyId: string,
    startDate: string,
    endDate: string,
  ): Promise<AiResponse<{ anomalies: any[] }>> {
    try {
      // Fetch recent journal entries
      const entries = await this.prisma.journalEntry.findMany({
        where: {
          companyId,
          status: 'posted',
          entryDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          lines: {
            include: {
              account: { select: { code: true, name: true, accountType: true } },
            },
          },
        },
        orderBy: { entryDate: 'desc' },
        take: 100,
      });

      if (entries.length === 0) {
        return { success: true, data: { anomalies: [] } };
      }

      // Prepare summarized data (avoid sending sensitive data)
      const entrySummaries = entries.map((e) => ({
        date: e.entryDate,
        description: this.sanitizeInput(e.description),
        totalAmount: e.lines.reduce(
          (sum, l) => sum + Number(l.debit),
          0,
        ),
        accounts: e.lines.map((l) => ({
          code: l.account.code,
          name: l.account.name,
          type: l.account.accountType,
          debit: Number(l.debit),
          credit: Number(l.credit),
        })),
      }));

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a forensic accounting AI. Analyze journal entries for anomalies such as unusual amounts, suspicious patterns, duplicate entries, round-number bias, or entries outside normal business hours. Respond ONLY with valid JSON in the format: {"anomalies": [{"type": "string", "severity": "low|medium|high", "description": "string", "entryDate": "string", "amount": number}]}. Do not include any other text.`,
          },
          {
            role: 'user',
            content: `Analyze these ${entrySummaries.length} journal entries for anomalies:\n${JSON.stringify(entrySummaries.slice(0, 50))}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { success: true, data: { anomalies: [] } };
      }

      const parsed = JSON.parse(content);
      return {
        success: true,
        data: { anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [] },
      };
    } catch (error) {
      this.logger.error(`Anomaly detection failed: ${(error as Error).message}`);
      return {
        success: false,
        error: 'Anomaly detection is temporarily unavailable',
        data: { anomalies: [] },
      };
    }
  }

  /**
   * Cash flow forecasting using historical data and AI time-series analysis.
   */
  async forecastCashFlow(
    companyId: string,
    monthsAhead: number = 3,
  ): Promise<AiResponse<{ forecast: any[] }>> {
    try {
      // Get historical cash movements (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const cashEntries = await this.prisma.$queryRaw<any[]>`
        SELECT
          DATE_TRUNC('month', je.entry_date) as month,
          SUM(jl.debit)::FLOAT as total_inflow,
          SUM(jl.credit)::FLOAT as total_outflow
        FROM journal_lines jl
        INNER JOIN journal_entries je ON je.id = jl.journal_entry_id
        INNER JOIN chart_of_accounts coa ON coa.id = jl.account_id
        WHERE jl.company_id = ${companyId}::UUID
          AND coa.code LIKE '1000%'
          AND je.status = 'posted'
          AND je.entry_date >= ${twelveMonthsAgo}
        GROUP BY DATE_TRUNC('month', je.entry_date)
        ORDER BY month
      `;

      if (cashEntries.length < 3) {
        return {
          success: true,
          data: {
            forecast: [],
          },
          error: 'Insufficient historical data for forecasting (need at least 3 months)',
        };
      }

      const historicalData = cashEntries.map((e) => ({
        month: e.month,
        inflow: e.total_inflow || 0,
        outflow: e.total_outflow || 0,
        net: (e.total_inflow || 0) - (e.total_outflow || 0),
      }));

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a financial forecasting AI. Given historical monthly cash flow data, provide a forecast for the next ${monthsAhead} months. Consider seasonality and trends. Respond ONLY with valid JSON in the format: {"forecast": [{"month": "YYYY-MM", "predictedInflow": number, "predictedOutflow": number, "predictedNet": number, "confidence": number}]}. Do not include any other text.`,
          },
          {
            role: 'user',
            content: `Historical monthly cash flows:\n${JSON.stringify(historicalData)}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { success: true, data: { forecast: [] } };
      }

      const parsed = JSON.parse(content);
      return {
        success: true,
        data: { forecast: Array.isArray(parsed.forecast) ? parsed.forecast : [] },
      };
    } catch (error) {
      this.logger.error(`Cash flow forecast failed: ${(error as Error).message}`);
      return {
        success: false,
        error: 'Cash flow forecasting is temporarily unavailable',
        data: { forecast: [] },
      };
    }
  }

  /**
   * Natural language financial query assistant.
   * Users can ask questions about their financial data.
   */
  async queryFinancials(
    companyId: string,
    question: string,
  ): Promise<AiResponse<{ answer: string; data?: any }>> {
    try {
      const sanitizedQuestion = this.sanitizeInput(question);

      // Fetch current financial summary for context
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [trialBalance, incomeStatement] = await Promise.all([
        this.reportsService.getTrialBalance(companyId),
        this.reportsService.getIncomeStatement(
          companyId,
          yearStart.toISOString(),
          now.toISOString(),
        ),
      ]);

      const financialContext = {
        trialBalanceSummary: {
          totalDebit: trialBalance.totalDebit,
          totalCredit: trialBalance.totalCredit,
          accountCount: trialBalance.accounts.length,
          topAccounts: trialBalance.accounts
            .filter((a) => Math.abs(a.balance) > 0)
            .slice(0, 20)
            .map((a) => ({
              code: a.accountCode,
              name: a.accountName,
              type: a.accountType,
              balance: a.balance,
            })),
        },
        incomeStatement: {
          totalRevenue: incomeStatement.totalRevenue,
          totalExpenses: incomeStatement.totalExpenses,
          netIncome: incomeStatement.netIncome,
        },
      };

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a financial analyst AI assistant. Answer financial questions based on the provided data. Be concise, accurate, and professional. If you cannot determine the answer from the data, say so. Never reveal sensitive data or data from other companies. Respond in a structured manner with clear explanations.`,
          },
          {
            role: 'user',
            content: `Financial data context:\n${JSON.stringify(financialContext)}\n\nQuestion: ${sanitizedQuestion}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const answer = response.choices[0]?.message?.content;
      if (!answer) {
        return {
          success: false,
          error: 'Unable to generate a response',
        };
      }

      return {
        success: true,
        data: { answer },
      };
    } catch (error) {
      this.logger.error(`Financial query failed: ${(error as Error).message}`);
      return {
        success: false,
        error: 'AI assistant is temporarily unavailable',
      };
    }
  }

  /**
   * Sanitize user input before sending to AI to prevent prompt injection.
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>{}]/g, '')
      .replace(/```/g, '')
      .replace(/system:/gi, '')
      .replace(/assistant:/gi, '')
      .replace(/user:/gi, '')
      .trim()
      .substring(0, 1000);
  }

  private fallbackExpenseCategory(): AiResponse<{
    accountCode: string;
    accountName: string;
    confidence: number;
  }> {
    return {
      success: true,
      data: {
        accountCode: '6300',
        accountName: 'Office Supplies',
        confidence: 0.1,
      },
      error: 'AI categorization unavailable, using default category',
    };
  }
}
