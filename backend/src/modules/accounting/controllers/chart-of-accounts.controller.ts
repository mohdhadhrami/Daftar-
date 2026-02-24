import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChartOfAccountsService } from '../services/chart-of-accounts.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { CompanyId } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Chart of Accounts')
@ApiBearerAuth()
@Controller('accounts')
export class ChartOfAccountsController {
  constructor(private chartOfAccountsService: ChartOfAccountsService) {}

  @Post()
  @RequirePermissions('accounts.write')
  @ApiOperation({ summary: 'Create a new account' })
  async create(@CompanyId() companyId: string, @Body() dto: CreateAccountDto) {
    return this.chartOfAccountsService.create(companyId, dto);
  }

  @Get()
  @RequirePermissions('accounts.read')
  @ApiOperation({ summary: 'List all accounts' })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @CompanyId() companyId: string,
    @Query('type') accountType?: string,
  ) {
    return this.chartOfAccountsService.findAll(companyId, accountType);
  }

  @Get(':id')
  @RequirePermissions('accounts.read')
  @ApiOperation({ summary: 'Get account by ID' })
  async findOne(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chartOfAccountsService.findById(companyId, id);
  }

  @Put(':id')
  @RequirePermissions('accounts.write')
  @ApiOperation({ summary: 'Update an account' })
  async update(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.chartOfAccountsService.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('accounts.delete')
  @ApiOperation({ summary: 'Delete an account' })
  async delete(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chartOfAccountsService.softDelete(companyId, id);
  }

  @Post('seed')
  @RequirePermissions('accounts.write')
  @ApiOperation({ summary: 'Seed default chart of accounts' })
  async seedDefaults(@CompanyId() companyId: string) {
    return this.chartOfAccountsService.seedDefaultAccounts(companyId);
  }
}
