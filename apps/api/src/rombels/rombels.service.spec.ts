import { Test } from '@nestjs/testing';
import { RombelsService } from './rombels.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RombelsService', () => {
  const prisma = {
    rombel: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), upsert: jest.fn() },
    major: { findUnique: jest.fn(), findMany: jest.fn() },
    student: { updateMany: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $transaction: jest.fn(async (fn: any) => fn(prisma)),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('create reject missing major', async () => {
    prisma.rombel.findUnique.mockResolvedValue(null);
    prisma.major.findUnique.mockResolvedValue(null);
    const mod = await Test.createTestingModule({ providers: [RombelsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RombelsService);
    await expect(service.create({ name: 'X', majorId: 'm1' } as any)).rejects.toThrow('Major not found');
  });

  it('findAll returns rombel list', async () => {
    prisma.rombel.findMany.mockResolvedValue([{ id: 'r1', name: 'XII-A' }]);
    prisma.rombel.count.mockResolvedValue(1);
    const mod = await Test.createTestingModule({ providers: [RombelsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RombelsService);
    const res = await service.findAll();
    expect(res.total).toBe(1);
    expect(res.data).toHaveLength(1);
  });

  it('updateStudents reassigns students', async () => {
    prisma.rombel.findUnique.mockResolvedValue({ id: 'r1', name: 'XII-A' });
    const mod = await Test.createTestingModule({ providers: [RombelsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RombelsService);
    const res = await service.updateStudents('r1', ['s1', 's2']);
    expect(res).toEqual({ success: true });
    expect(prisma.student.updateMany).toHaveBeenCalled();
  });

  it('generateTemplate returns buffer', async () => {
    const mod = await Test.createTestingModule({ providers: [RombelsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RombelsService);
    expect(Buffer.isBuffer(await service.generateTemplate())).toBe(true);
  });
});
