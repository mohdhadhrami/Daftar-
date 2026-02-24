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
import { JournalEntriesService } from '../services/journal-entries.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { CurrentUser, CompanyId } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../../common/interfaces/request.interface';

@ApiTags('Journal Entries')
@ApiBearerAuth()
@Controller('journals')
export class JournalEntriesController {
  constructor(private journalEntriesService: JournalEntriesService) {}

  @Post()
  @RequirePermissions('journals.write')
  @ApiOperation({ summary: 'Create a journal entry' })
  async create(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.create(companyId, user.sub, dto);
  }

  @Get()
  @RequirePermissions('journals.read')
  @ApiOperation({ summary: 'List journal entries' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CompanyId() companyId: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.journalEntriesService.findAll(companyId, {
      status,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequirePermissions('journals.read')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  async findOne(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.journalEntriesService.findById(companyId, id);
  }

  @Post(':id/post')
  @RequirePermissions('journals.post')
  @ApiOperation({ summary: 'Post a journal entry' })
  async post(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.journalEntriesService.post(companyId, id, user.sub);
  }

  @Post(':id/void')
  @RequirePermissions('journals.void')
  @ApiOperation({ summary: 'Void a posted journal entry' })
  async void(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body('reason') reason: string,
  ) {
    return this.journalEntriesService.void(companyId, id, user.sub, reason);
  }
}
