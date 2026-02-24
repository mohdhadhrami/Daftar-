import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { CompanyId } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Financial Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('trial-balance')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get trial balance' })
  @ApiQuery({ name: 'asOfDate', required: false })
  async getTrialBalance(
    @CompanyId() companyId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportsService.getTrialBalance(companyId, asOfDate);
  }

  @Get('income-statement')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get income statement (P&L)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getIncomeStatement(
    @CompanyId() companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getIncomeStatement(companyId, startDate, endDate);
  }

  @Get('balance-sheet')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get balance sheet' })
  @ApiQuery({ name: 'asOfDate', required: false })
  async getBalanceSheet(
    @CompanyId() companyId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportsService.getBalanceSheet(companyId, asOfDate);
  }

  @Get('cash-flow')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get cash flow statement' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCashFlow(
    @CompanyId() companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCashFlowStatement(companyId, startDate, endDate);
  }
}
