import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  const mockPrisma = {
    customRole: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rolePermission: { createMany: jest.fn(), deleteMany: jest.fn() },
    roleAuditLog: { create: jest.fn(), findMany: jest.fn() },
    menu: { findMany: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('findAll', () => {
    it('should return paginated roles', async () => {
      mockPrisma.customRole.findMany.mockResolvedValue([{ id: 'r1', name: 'Admin' }]);
      mockPrisma.customRole.count.mockResolvedValue(1);
      const result = await service.findAll(0, 10);
      expect(result).toEqual({ data: [{ id: 'r1', name: 'Admin' }], total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return role with permissionIds', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({
        id: 'r1', name: 'Admin', permissions: [{ permissionId: 'p1' }, { permissionId: 'p2' }],
      });
      const result = await service.findOne('r1');
      expect(result.permissionIds).toEqual(['p1', 'p2']);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create role with permissions and audit log', async () => {
      mockPrisma.customRole.findFirst.mockResolvedValue(null);
      mockPrisma.customRole.create.mockResolvedValue({ id: 'r1', name: 'Editor' });
      mockPrisma.rolePermission.createMany.mockResolvedValue({});
      mockPrisma.roleAuditLog.create.mockResolvedValue({});

      const result = await service.create({ name: 'Editor', permissionIds: ['p1'] } as any, 'actor1');
      expect(result.name).toBe('Editor');
      expect(mockPrisma.roleAuditLog.create).toHaveBeenCalled();
    });

    it('should throw on duplicate name', async () => {
      mockPrisma.customRole.findFirst.mockResolvedValue({ id: 'r1' });
      await expect(service.create({ name: 'Admin' } as any, 'actor1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update role', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({
        id: 'r1', name: 'Old', slug: 'old', isSystem: false,
        permissions: [{ permissionId: 'p1' }],
      });
      mockPrisma.customRole.findFirst.mockResolvedValue(null);
      mockPrisma.customRole.update.mockResolvedValue({ id: 'r1', name: 'New' });
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({});
      mockPrisma.rolePermission.createMany.mockResolvedValue({});
      mockPrisma.roleAuditLog.create.mockResolvedValue({});

      const result = await service.update('r1', { name: 'New', permissionIds: ['p2'] } as any, 'actor1');
      expect(result.name).toBe('New');
    });

    it('should block system role name change', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({
        id: 'r1', name: 'SuperAdmin', isSystem: true, permissions: [],
      });
      await expect(service.update('r1', { name: 'Changed' } as any, 'actor1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', {} as any, 'actor1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('clone', () => {
    it('should clone role with permissions', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({
        id: 'r1', name: 'Editor', permissions: [{ permissionId: 'p1' }],
      });
      mockPrisma.customRole.findFirst.mockResolvedValue(null);
      mockPrisma.customRole.create.mockResolvedValue({ id: 'r2', name: 'Editor Clone' });
      mockPrisma.rolePermission.createMany.mockResolvedValue({});
      mockPrisma.roleAuditLog.create.mockResolvedValue({});

      const result = await service.clone('r1', 'Editor Clone', 'actor1');
      expect(result.name).toBe('Editor Clone');
    });

    it('should throw on duplicate clone name', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({
        id: 'r1', name: 'Editor', permissions: [{ permissionId: 'p1' }],
      });
      mockPrisma.customRole.findFirst.mockResolvedValue({ id: 'r-exists' });
      await expect(service.clone('r1', 'Editor', 'actor1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete non-system role', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({ id: 'r1', isSystem: false, name: 'Custom' });
      mockPrisma.customRole.delete.mockResolvedValue({});
      mockPrisma.roleAuditLog.create.mockResolvedValue({});
      const result = await service.remove('r1', 'actor1');
      expect(result.success).toBe(true);
    });

    it('should block system role deletion', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue({ id: 'r1', isSystem: true });
      await expect(service.remove('r1', 'actor1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.customRole.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad', 'actor1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs', async () => {
      mockPrisma.roleAuditLog.findMany.mockResolvedValue([{ id: 'log1' }]);
      const result = await service.getAuditLogs('r1');
      expect(result).toEqual([{ id: 'log1' }]);
    });
  });

  describe('getPermissionsMatrix', () => {
    it('should return menu with permissions', async () => {
      mockPrisma.menu.findMany.mockResolvedValue([{ id: 'menu1' }]);
      const result = await service.getPermissionsMatrix();
      expect(result).toEqual([{ id: 'menu1' }]);
    });
  });
});
