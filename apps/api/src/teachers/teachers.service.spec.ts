import { Test } from '@nestjs/testing';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeachersService', () => {
  const prisma = {
    user: { create: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
    teacher: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('create returns temporaryPassword', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1', teacher: { id: 't1' } });
    const mod = await Test.createTestingModule({ providers: [TeachersService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(TeachersService);

    const res = await service.create({ username: 't', email: 't@example.com', fullName: 'T', nip: '123' } as any);
    expect(res.temporaryPassword).toBeTruthy();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('remove delete user if teacher exists', async () => {
    prisma.teacher.findUnique.mockResolvedValue({ userId: 'u1' });
    prisma.user.delete.mockResolvedValue({ id: 'u1' });
    const mod = await Test.createTestingModule({ providers: [TeachersService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(TeachersService);

    await expect(service.remove('t1')).resolves.toEqual({ id: 'u1' });
  });
});