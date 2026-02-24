import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
  companyId: string;
  permissions: string[];
  membership: {
    id: string;
    companyId: string;
    userId: string;
    roleId: string;
    isActive: boolean;
    role: {
      id: string;
      name: string;
    };
  };
}
