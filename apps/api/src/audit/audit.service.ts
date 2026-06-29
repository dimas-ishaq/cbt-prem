import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  write(data: {
    userId?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    before?: any;
    after?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
