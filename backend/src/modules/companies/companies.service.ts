import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto, userId: string) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const ownerRole = await this.prisma.role.findUnique({
      where: { name: 'owner' },
    });

    if (!ownerRole) {
      throw new Error('Owner role not found. Database may not be seeded.');
    }

    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        slug: `${slug}-${Date.now().toString(36)}`,
        taxId: dto.taxId,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        currency: dto.currency || 'USD',
        fiscalYearStart: dto.fiscalYearStart || 1,
        companyUsers: {
          create: {
            userId,
            roleId: ownerRole.id,
          },
        },
      },
      include: {
        companyUsers: {
          include: { role: true },
        },
      },
    });

    return company;
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company || company.deletedAt) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findById(id);

    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  async getMembers(companyId: string) {
    return this.prisma.companyUser.findMany({
      where: { companyId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async inviteUser(companyId: string, dto: InviteUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    const existing = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: { companyId, userId: user.id },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this company');
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.companyUser.create({
      data: {
        companyId,
        userId: user.id,
        roleId: role.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        role: true,
      },
    });
  }

  async removeMember(companyId: string, userId: string, requestingUserId: string) {
    const membership = await this.prisma.companyUser.findUnique({
      where: {
        companyId_userId: { companyId, userId },
      },
      include: { role: true },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    if (membership.role.name === 'owner' && userId !== requestingUserId) {
      throw new ForbiddenException('Cannot remove the company owner');
    }

    return this.prisma.companyUser.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }

  async getUserCompanies(userId: string) {
    return this.prisma.companyUser.findMany({
      where: { userId, isActive: true },
      include: {
        company: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
