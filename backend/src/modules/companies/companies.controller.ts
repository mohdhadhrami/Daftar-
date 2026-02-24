import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { CurrentUser, CompanyId } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtPayload } from '../../common/interfaces/request.interface';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  async create(@Body() dto: CreateCompanyDto, @CurrentUser() user: JwtPayload) {
    return this.companiesService.create(dto, user.sub);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current company details' })
  async getCurrent(@CompanyId() companyId: string) {
    return this.companiesService.findById(companyId);
  }

  @Put('current')
  @RequirePermissions('settings.write')
  @ApiOperation({ summary: 'Update current company' })
  async update(@CompanyId() companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(companyId, dto);
  }

  @Get('current/members')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Get company members' })
  async getMembers(@CompanyId() companyId: string) {
    return this.companiesService.getMembers(companyId);
  }

  @Post('current/members')
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Invite user to company' })
  async inviteMember(@CompanyId() companyId: string, @Body() dto: InviteUserDto) {
    return this.companiesService.inviteUser(companyId, dto);
  }

  @Delete('current/members/:userId')
  @RequirePermissions('users.write')
  @ApiOperation({ summary: 'Remove member from company' })
  async removeMember(
    @CompanyId() companyId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companiesService.removeMember(companyId, userId, user.sub);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get companies for current user' })
  async getMyCompanies(@CurrentUser() user: JwtPayload) {
    return this.companiesService.getUserCompanies(user.sub);
  }
}
