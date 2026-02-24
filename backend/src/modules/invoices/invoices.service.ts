import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { JournalEntriesService } from '../accounting/services/journal-entries.service';
import { AuditService } from '../audit/audit.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private journalEntriesService: JournalEntriesService,
    private auditService: AuditService,
  ) {}

  async create(companyId: string, userId: string, dto: CreateInvoiceDto) {
    // Verify contact exists and belongs to company
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, companyId },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const invoiceNumber = await this.generateInvoiceNumber(companyId, dto.type);

    // Calculate line totals
    const lines = dto.lines.map((line) => {
      const lineTotal = line.quantity * line.unitPrice;
      const taxAmount = lineTotal * (line.taxRate / 100);
      return {
        ...line,
        lineTotal,
        taxAmount,
        companyId,
      };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const taxAmount = lines.reduce((sum, l) => sum + l.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;

    const invoice = await this.prisma.invoice.create({
      data: {
        companyId,
        invoiceNumber,
        type: dto.type,
        contactId: dto.contactId,
        issueDate: new Date(dto.issueDate),
        dueDate: new Date(dto.dueDate),
        subtotal: new Decimal(subtotal),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        amountDue: new Decimal(totalAmount),
        currency: dto.currency || 'USD',
        notes: dto.notes,
        createdById: userId,
        lines: {
          create: lines.map((line, index) => ({
            companyId,
            description: line.description,
            quantity: new Decimal(line.quantity),
            unitPrice: new Decimal(line.unitPrice),
            taxRate: new Decimal(line.taxRate || 0),
            taxAmount: new Decimal(line.taxAmount),
            lineTotal: new Decimal(line.lineTotal),
            accountId: line.accountId,
            lineOrder: index,
          })),
        },
      },
      include: {
        lines: true,
        contact: true,
      },
    });

    await this.auditService.log({
      companyId,
      userId,
      action: 'create',
      entity: 'invoice',
      entityId: invoice.id,
      newValues: { invoiceNumber, type: dto.type, totalAmount },
    });

    return invoice;
  }

  async findAll(
    companyId: string,
    options: {
      type?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { type, status, page = 1, limit = 20 } = options;

    const where: any = { companyId, deletedAt: null };
    if (type) where.type = type;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true, email: true },
          },
          lines: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        contact: true,
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true } },
          },
          orderBy: { lineOrder: 'asc' },
        },
        payments: true,
        journalEntry: {
          include: { lines: true },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Post an invoice - creates corresponding journal entries.
   * For sales invoices: Debit AR, Credit Revenue
   * For purchase invoices: Debit Expense, Credit AP
   */
  async postInvoice(companyId: string, invoiceId: string, userId: string) {
    const invoice = await this.findById(companyId, invoiceId);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be posted');
    }

    // Find AR and AP accounts
    const arAccount = await this.prisma.chartOfAccount.findFirst({
      where: { companyId, code: '1100' },
    });
    const apAccount = await this.prisma.chartOfAccount.findFirst({
      where: { companyId, code: '2000' },
    });

    if (!arAccount || !apAccount) {
      throw new BadRequestException(
        'Accounts Receivable (1100) and Accounts Payable (2000) must exist',
      );
    }

    const journalLines: any[] = [];

    if (invoice.type === 'sales') {
      // Debit: Accounts Receivable
      journalLines.push({
        accountId: arAccount.id,
        description: `Invoice ${invoice.invoiceNumber}`,
        debit: Number(invoice.totalAmount),
        credit: 0,
      });
      // Credit: Revenue accounts from invoice lines
      for (const line of invoice.lines) {
        journalLines.push({
          accountId: line.accountId,
          description: line.description,
          debit: 0,
          credit: Number(line.lineTotal) + Number(line.taxAmount),
        });
      }
    } else {
      // Purchase invoice
      // Debit: Expense accounts from invoice lines
      for (const line of invoice.lines) {
        journalLines.push({
          accountId: line.accountId,
          description: line.description,
          debit: Number(line.lineTotal) + Number(line.taxAmount),
          credit: 0,
        });
      }
      // Credit: Accounts Payable
      journalLines.push({
        accountId: apAccount.id,
        description: `Invoice ${invoice.invoiceNumber}`,
        debit: 0,
        credit: Number(invoice.totalAmount),
      });
    }

    const journalEntry = await this.journalEntriesService.create(
      companyId,
      userId,
      {
        entryDate: new Date(invoice.issueDate).toISOString().split('T')[0],
        description: `${invoice.type === 'sales' ? 'Sales' : 'Purchase'} Invoice ${invoice.invoiceNumber}`,
        reference: invoice.invoiceNumber,
        source: 'invoice',
        sourceId: invoice.id,
        lines: journalLines,
      },
    );

    // Auto-post the journal entry
    await this.journalEntriesService.post(companyId, journalEntry.id, userId);

    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'sent',
        journalEntryId: journalEntry.id,
        version: { increment: 1 },
      },
    });

    return this.findById(companyId, invoiceId);
  }

  private async generateInvoiceNumber(
    companyId: string,
    type: string,
  ): Promise<string> {
    const prefix = type === 'sales' ? 'INV' : 'BILL';
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { companyId, type },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    const lastNum = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.replace(/\D/g, ''), 10) || 0
      : 0;

    return `${prefix}-${String(lastNum + 1).padStart(5, '0')}`;
  }
}
