import { Module } from '@nestjs/common';
import { ChartOfAccountsService } from './services/chart-of-accounts.service';
import { JournalEntriesService } from './services/journal-entries.service';
import { FiscalPeriodsService } from './services/fiscal-periods.service';
import { ReportsService } from './services/reports.service';
import { ChartOfAccountsController } from './controllers/chart-of-accounts.controller';
import { JournalEntriesController } from './controllers/journal-entries.controller';
import { FiscalPeriodsController } from './controllers/fiscal-periods.controller';
import { ReportsController } from './controllers/reports.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [
    ChartOfAccountsController,
    JournalEntriesController,
    FiscalPeriodsController,
    ReportsController,
  ],
  providers: [
    ChartOfAccountsService,
    JournalEntriesService,
    FiscalPeriodsService,
    ReportsService,
  ],
  exports: [
    ChartOfAccountsService,
    JournalEntriesService,
    FiscalPeriodsService,
    ReportsService,
  ],
})
export class AccountingModule {}
