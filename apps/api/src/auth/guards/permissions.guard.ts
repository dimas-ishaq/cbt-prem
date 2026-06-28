import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super Admin and Admin Sekolah have bypass access to all operations
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_SEKOLAH') {
      return true;
    }

    // Guru has implicit access to view subjects (needed for creating exams/question banks)
    if (user.role === 'GURU' && requiredPermissions.every(p => p === 'subjects:view')) {
      return true;
    }

    // Query user's permissions from database
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const userPermissionNames = new Set<string>();
    for (const ur of userRoles) {
      if (!ur.role.isActive) continue;
      if (ur.role.slug === 'super-admin') {
        return true;
      }
      for (const rp of ur.role.permissions) {
        userPermissionNames.add(rp.permission.name);
      }
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissionNames.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Akses Ditolak: Anda tidak memiliki wewenang untuk aksi ini.');
    }

    return true;
  }
}
