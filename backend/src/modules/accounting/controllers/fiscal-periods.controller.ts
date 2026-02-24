import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FiscalPeriodsService } from '../services/fiscal-periods.service';
import { CurrentUser, CompanyId } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/request.interface';

@ApiTags('Fiscal Periods')
@ApiBearerAuth()
@Controller('fiscal-periods')
export class FiscalPeriodsController {
  constructor(private fiscalPeriodsService: FiscalPeriodsService) {}

  @Post()
  @RequirePermissions('periods.manage')
  @ApiOperation({ summary: 'Create a fiscal period' })
  async create(
    @CompanyId() companyId: string,
    @Body() data: { name: string; startDate: string; endDate: string },
  ) {
    return this.fiscalPeriodsService.create(companyId, data);
  }

  @Get()
  @RequirePermissions('accounts.read')
  @ApiOperation({ summary: 'List fiscal periods' })
  async findAll(@CompanyId() companyId: string) {
    return this.fiscalPeriodsService.findAll(companyId);
  }

  @Post(':id/lock')
  @RequirePermissions('periods.manage')
  @ApiOperation({ summary: 'Lock a fiscal period' })
  async lock(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fiscalPeriodsService.lock(companyId, id, user.sub);
  }

  @Post(':id/unlock')
  @RequirePermissions('periods.manage')
  @ApiOperation({ summary: 'Unlock a fiscal period' })
  async unlock(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fiscalPeriodsService.unlock(companyId, id, user.sub);
  }
}
