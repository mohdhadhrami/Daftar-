import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CompanyId } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('categorize-expense')
  @RequirePermissions('ai.use')
  @ApiOperation({ summary: 'AI-powered expense categorization' })
  async categorizeExpense(
    @CompanyId() companyId: string,
    @Body() body: { description: string; amount: number },
  ) {
    return this.aiService.categorizeExpense(
      companyId,
      body.description,
      body.amount,
    );
  }

  @Get('anomalies')
  @RequirePermissions('ai.use')
  @ApiOperation({ summary: 'Detect journal entry anomalies' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async detectAnomalies(
    @CompanyId() companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.aiService.detectAnomalies(companyId, startDate, endDate);
  }

  @Get('forecast')
  @RequirePermissions('ai.use')
  @ApiOperation({ summary: 'Cash flow forecasting' })
  @ApiQuery({ name: 'months', required: false })
  async forecastCashFlow(
    @CompanyId() companyId: string,
    @Query('months') months?: number,
  ) {
    return this.aiService.forecastCashFlow(companyId, months || 3);
  }

  @Post('query')
  @RequirePermissions('ai.use')
  @ApiOperation({ summary: 'Natural language financial query' })
  async queryFinancials(
    @CompanyId() companyId: string,
    @Body() body: { question: string },
  ) {
    return this.aiService.queryFinancials(companyId, body.question);
  }
}
