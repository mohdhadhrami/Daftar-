import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CurrentUser, CompanyId } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/request.interface';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @RequirePermissions('invoices.write')
  @ApiOperation({ summary: 'Create an invoice' })
  async create(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(companyId, user.sub, dto);
  }

  @Get()
  @RequirePermissions('invoices.read')
  @ApiOperation({ summary: 'List invoices' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CompanyId() companyId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoicesService.findAll(companyId, { type, status, page, limit });
  }

  @Get(':id')
  @RequirePermissions('invoices.read')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async findOne(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoicesService.findById(companyId, id);
  }

  @Post(':id/post')
  @RequirePermissions('invoices.write')
  @ApiOperation({ summary: 'Post an invoice (creates journal entries)' })
  async postInvoice(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoicesService.postInvoice(companyId, id, user.sub);
  }
}
