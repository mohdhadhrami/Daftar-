import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';

/**
 * Tenant middleware injects company context from X-Company-Id header.
 * Validates that the authenticated user belongs to the requested company.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const companyId = req.headers['x-company-id'] as string;

    if (!companyId) {
      throw new BadRequestException('X-Company-Id header is required');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      throw new BadRequestException('Invalid company ID format');
    }

    const user = (req as any).user;

    if (user) {
      // Verify user belongs to this company
      const membership = await this.prisma.companyUser.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: user.sub,
          },
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!membership || !membership.isActive) {
        throw new ForbiddenException('You do not have access to this company');
      }

      // Attach tenant context and role to request
      (req as any).companyId = companyId;
      (req as any).membership = membership;
      (req as any).permissions = membership.role.rolePermissions.map(
        (rp) => rp.permission.name,
      );
    } else {
      (req as any).companyId = companyId;
    }

    next();
  }
}
