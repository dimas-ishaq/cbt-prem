import { Test } from '@nestjs/testing';
import { RombelsService } from './rombels.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RombelsService', () => {
  const prisma = {
    rombel: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), upsert: jest.fn() },
    major: { findUnique: jest.fn(), findMany: jest.fn() },
    student: { updateMany: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('create reject missing major', async () => {
    prisma.rombel.findUnique.mockResolvedValue(null);
    prisma.major.findUnique.mockResolvedValue(null);
    const mod = await Test.createTestingModule({ providers: [RombelsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RombelsService);

    await expect(service.create({ name: 'X', majorId: 'm1' } as any)).rejects.toThrow('Major not found');
  });

  it('generateTemplate returns buffer', async () => {
    const mod = await Test.createTestingModule({ providers: [RombelsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(RombelsService);
    expect(Buffer.isBuffer(await service.generateTemplate())).toBe(true);
  });
});