import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../config/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/request.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // If company name is provided, create a company and assign owner role
    if (dto.companyName) {
      const slug = dto.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const ownerRole = await this.prisma.role.findUnique({
        where: { name: 'owner' },
      });

      const company = await this.prisma.company.create({
        data: {
          name: dto.companyName,
          slug: `${slug}-${uuidv4().slice(0, 8)}`,
          currency: dto.currency || 'USD',
        },
      });

      if (ownerRole) {
        await this.prisma.companyUser.create({
          data: {
            companyId: company.id,
            userId: user.id,
            roleId: ownerRole.id,
          },
        });
      }

      return { user, company };
    }

    return { user };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(
      { sub: user.id, email: user.email },
      userAgent,
      ipAddress,
    );

    // Get user's companies
    const companies = await this.prisma.companyUser.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
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

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      companies: companies.map((cu) => ({
        ...cu.company,
        role: cu.role.name,
      })),
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string, userAgent?: string, ipAddress?: string) {
    const tokenHash = await this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(
      { sub: storedToken.user.id, email: storedToken.user.email },
      userAgent,
      ipAddress,
    );

    // Link old token to new one
    const newTokenHash = await this.hashToken(tokens.refreshToken);
    const newStoredToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: newTokenHash },
    });

    if (newStoredToken) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { replacedBy: newStoredToken.id },
      });
    }

    return tokens;
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });

    // Invalidate cached sessions
    await this.redisService.del(`user:${userId}:session`);
  }

  private async generateTokens(
    payload: JwtPayload,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshTokenHash = await this.hashToken(refreshToken);

    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );
    const expiresAt = new Date();
    const days = parseInt(refreshExpiresIn) || 7;
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: refreshTokenHash,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    };
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }
}
