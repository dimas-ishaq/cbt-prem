import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip?: number, take?: number) {
    const [data, total] = await Promise.all([
      this.prisma.customRole.findMany({
        include: {
          _count: {
            select: { permissions: true },
          },
        },
        orderBy: { name: 'asc' },
        ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
      }),
      this.prisma.customRole.count(),
    ]);
    return { data, total };
  }

  async getPermissionsMatrix() {
    return this.prisma.menu.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        subMenus: {
          orderBy: { orderIndex: 'asc' },
          include: {
            permissions: {
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { permissionId: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role tidak ditemukan');
    }

    return {
      ...role,
      permissionIds: role.permissions.map((p) => p.permissionId),
    };
  }

  async create(dto: CreateRoleDto, actorId: string) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if exists
    const existing = await this.prisma.customRole.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug }],
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Role dengan nama tersebut sudah terdaftar',
      );
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const newRole = await tx.customRole.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          isSystem: false,
          isActive: true,
        },
      });

      if (dto.permissionIds && dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((pId) => ({
            roleId: newRole.id,
            permissionId: pId,
          })),
        });
      }

      // Audit log
      const activePermissions = dto.permissionIds || [];
      await tx.roleAuditLog.create({
        data: {
          roleId: newRole.id,
          actorId,
          actionType: 'ROLE_CREATE',
          payloadBefore: {},
          payloadAfter: { name: newRole.name, permissions: activePermissions },
        },
      });

      return newRole;
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto, actorId: string) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { permissionId: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role tidak ditemukan');
    }

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException(
        'Nama role bawaan sistem tidak dapat diubah',
      );
    }

    const slug = dto.name
      ? dto.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : role.slug;

    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.customRole.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Role dengan nama tersebut sudah terdaftar',
        );
      }
    }

    const updatedRole = await this.prisma.$transaction(async (tx) => {
      const dataToUpdate: any = {};
      if (dto.name) dataToUpdate.name = dto.name;
      if (dto.description !== undefined)
        dataToUpdate.description = dto.description;
      if (dto.isActive !== undefined) dataToUpdate.isActive = dto.isActive;
      if (!role.isSystem) {
        dataToUpdate.slug = slug;
      }

      const updated = await tx.customRole.update({
        where: { id },
        data: dataToUpdate,
      });

      const beforePerms = role.permissions.map((p) => p.permissionId);
      let afterPerms = beforePerms;

      if (dto.permissionIds !== undefined) {
        // Clear old permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Insert new permissions
        if (dto.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((pId) => ({
              roleId: id,
              permissionId: pId,
            })),
          });
        }
        afterPerms = dto.permissionIds;
      }

      // Log difference
      await tx.roleAuditLog.create({
        data: {
          roleId: id,
          actorId,
          actionType: 'ROLE_UPDATE',
          payloadBefore: { name: role.name, permissions: beforePerms },
          payloadAfter: { name: updated.name, permissions: afterPerms },
        },
      });

      return updated;
    });

    return updatedRole;
  }

  async clone(id: string, name: string, actorId: string) {
    const roleToClone = await this.findOne(id);

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const existing = await this.prisma.customRole.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Role dengan nama kloning tersebut sudah terdaftar',
      );
    }

    const cloned = await this.prisma.$transaction(async (tx) => {
      const newRole = await tx.customRole.create({
        data: {
          name,
          slug,
          description: `Kloning dari ${roleToClone.name}. ${roleToClone.description || ''}`,
          isSystem: false,
          isActive: true,
        },
      });

      if (roleToClone.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: roleToClone.permissionIds.map((pId) => ({
            roleId: newRole.id,
            permissionId: pId,
          })),
        });
      }

      await tx.roleAuditLog.create({
        data: {
          roleId: newRole.id,
          actorId,
          actionType: 'ROLE_CLONE',
          payloadBefore: { sourceRoleId: id, sourceRoleName: roleToClone.name },
          payloadAfter: {
            name: newRole.name,
            permissions: roleToClone.permissionIds,
          },
        },
      });

      return newRole;
    });

    return cloned;
  }

  async remove(id: string, actorId: string) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role tidak ditemukan');
    }

    if (role.isSystem) {
      throw new BadRequestException('Role bawaan sistem tidak dapat dihapus');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customRole.delete({
        where: { id },
      });

      // Audit log
      await tx.roleAuditLog.create({
        data: {
          actorId,
          actionType: 'ROLE_DELETE',
          payloadBefore: { name: role.name, id: role.id },
          payloadAfter: {},
        },
      });
    });

    return { success: true, message: 'Role berhasil dihapus' };
  }

  async getAuditLogs(roleId: string) {
    return this.prisma.roleAuditLog.findMany({
      where: { roleId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
