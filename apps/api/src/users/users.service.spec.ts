import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    student: { create: jest.fn() },
    teacher: { create: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  } as any;
  const audit = { write: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('findAll filters by role', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);
    const mod = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    const service = mod.get(UsersService);

    await service.findAll(Role.SISWA, 0, 10);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: Role.SISWA } }),
    );
  });

  it('createUser reject duplicate username', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const mod = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    const service = mod.get(UsersService);

    await expect(
      service.createUser({
        username: 'u',
        password: 'p',
        fullName: 'U',
      } as any),
    ).rejects.toThrow('Username sudah digunakan');
  });
});
