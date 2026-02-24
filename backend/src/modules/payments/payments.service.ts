import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { JournalEntriesService } from '../accounting/services/journal-entries.service';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private journalEntriesService: JournalEntriesService,
    private auditService: AuditService,
  ) {}

  async create(companyId: string, userId: string, dto: CreatePaymentDto) {
    // Verify contact
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, companyId },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Verify invoice if provided
    let invoice: any = null;
    if (dto.invoiceId) {
      invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, companyId, deletedAt: null },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (Number(invoice.amountDue) < dto.amount) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds invoice balance (${invoice.amountDue})`,
        );
      }
    }

    const paymentNumber = await this.generatePaymentNumber(companyId, dto.type);

    // Find cash and AR/AP accounts
    const cashAccount = await this.prisma.chartOfAccount.findFirst({
      where: { companyId, code: '1000' },
    });
    const arAccount = await this.prisma.chartOfAccount.findFirst({
      where: { companyId, code: '1100' },
    });
    const apAccount = await this.prisma.chartOfAccount.findFirst({
      where: { companyId, code: '2000' },
    });

    if (!cashAccount || !arAccount || !apAccount) {
      throw new BadRequestException('Required accounts (Cash, AR, AP) must exist');
    }

    // Create journal entry for payment
    const journalLines: any[] = [];

    if (dto.type === 'received') {
      // Payment received: Debit Cash, Credit AR
      journalLines.push(
        { accountId: cashAccount.id, description: `Payment ${paymentNumber}`, debit: dto.amount, credit: 0 },
        { accountId: arAccount.id, description: `Payment ${paymentNumber}`, debit: 0, credit: dto.amount },
      );
    } else {
      // Payment made: Debit AP, Credit Cash
      journalLines.push(
        { accountId: apAccount.id, description: `Payment ${paymentNumber}`, debit: dto.amount, credit: 0 },
        { accountId: cashAccount.id, description: `Payment ${paymentNumber}`, debit: 0, credit: dto.amount },
      );
    }

    const journalEntry = await this.journalEntriesService.create(
      companyId,
      userId,
      {
        entryDate: dto.paymentDate,
        description: `Payment ${paymentNumber} - ${contact.name}`,
        reference: dto.reference || paymentNumber,
        source: 'payment',
        lines: journalLines,
      },
    );

    // Auto-post the journal entry
    await this.journalEntriesService.post(companyId, journalEntry.id, userId);

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        paymentNumber,
        type: dto.type,
        invoiceId: dto.invoiceId,
        contactId: dto.contactId,
        amount: new Decimal(dto.amount),
        currency: dto.currency || 'USD',
        paymentDate: new Date(dto.paymentDate),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        notes: dto.notes,
        journalEntryId: journalEntry.id,
        createdById: userId,
      },
      include: {
        contact: true,
        invoice: true,
      },
    });

    // Update invoice amounts if linked
    if (invoice) {
      const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
      const newAmountDue = Number(invoice.totalAmount) - newAmountPaid;
      const newStatus =
        newAmountDue <= 0.001 ? 'paid' : newAmountPaid > 0 ? 'partial' : invoice.status;

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: new Decimal(newAmountPaid),
          amountDue: new Decimal(Math.max(0, newAmountDue)),
          status: newStatus,
          version: { increment: 1 },
        },
      });
    }

    await this.auditService.log({
      companyId,
      userId,
      action: 'create',
      entity: 'payment',
      entityId: payment.id,
      newValues: { paymentNumber, amount: dto.amount, type: dto.type },
    });

    return payment;
  }

  async findAll(
    companyId: string,
    options: { type?: string; page?: number; limit?: number } = {},
  ) {
    const { type, page = 1, limit = 20 } = options;

    const where: any = { companyId, deletedAt: null };
    if (type) where.type = type;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        contact: true,
        invoice: true,
        journalEntry: { include: { lines: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  private async generatePaymentNumber(companyId: string, type: string): Promise<string> {
    const prefix = type === 'received' ? 'PMT-R' : 'PMT-M';
    const lastPayment = await this.prisma.payment.findFirst({
      where: { companyId, type },
      orderBy: { createdAt: 'desc' },
      select: { paymentNumber: true },
    });

    const lastNum = lastPayment
      ? parseInt(lastPayment.paymentNumber.replace(/\D/g, ''), 10) || 0
      : 0;

    return `${prefix}-${String(lastNum + 1).padStart(5, '0')}`;
  }
}
