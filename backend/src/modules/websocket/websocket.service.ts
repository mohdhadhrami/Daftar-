import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

export enum WebSocketEvent {
  JOURNAL_CREATED = 'journal:created',
  JOURNAL_POSTED = 'journal:posted',
  JOURNAL_VOIDED = 'journal:voided',
  INVOICE_CREATED = 'invoice:created',
  INVOICE_UPDATED = 'invoice:updated',
  INVOICE_POSTED = 'invoice:posted',
  PAYMENT_CREATED = 'payment:created',
  PERIOD_LOCKED = 'period:locked',
  PERIOD_UNLOCKED = 'period:unlocked',
  ACCOUNT_CREATED = 'account:created',
  ACCOUNT_UPDATED = 'account:updated',
}

@Injectable()
export class WebsocketService {
  constructor(private eventsGateway: EventsGateway) {}

  notifyCompany(companyId: string, event: WebSocketEvent, data: any) {
    this.eventsGateway.emitToCompany(companyId, event, data);
  }

  notifyJournalRoom(entryId: string, event: string, data: any) {
    this.eventsGateway.emitToRoom(`journal:${entryId}`, event, data);
  }

  notifyInvoiceRoom(invoiceId: string, event: string, data: any) {
    this.eventsGateway.emitToRoom(`invoice:${invoiceId}`, event, data);
  }
}
