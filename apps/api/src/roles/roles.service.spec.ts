import { Test } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesService', () => {
  const prisma = {
    customRole: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
    menu: { findMany: jest.fn() },
    rolePermission: { createMany: jest.fn() },
    roleAuditLog: { create: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('findOne maps permissionIds', async () => {
    prisma.customRole.findUnique.mockResolvedValue({ id: 'r1', permissions: [{ permissionId: 'p1' }] });
    const mod = await Test.createTestingModule({ providers: [RolesService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RolesService);

    await expect(service.findOne('r1')).resolves.toEqual(expect.objectContaining({ permissionIds: ['p1'] }));
  });

  it('create reject duplicate role', async () => {
    prisma.customRole.findFirst.mockResolvedValue({ id: 'r1' });
    const mod = await Test.createTestingModule({ providers: [RolesService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RolesService);

    await expect(service.create({ name: 'Admin' } as any, 'actor')).rejects.toThrow('Role dengan nama tersebut sudah terdaftar');
  });
});