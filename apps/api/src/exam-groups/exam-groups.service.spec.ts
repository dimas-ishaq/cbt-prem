import { Test } from '@nestjs/testing';
import { ExamGroupsService } from './exam-groups.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamGroupsService', () => {
  const prisma = { examGroup: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } } as any;
  it('create converts dates', async () => {
    prisma.examGroup.create.mockResolvedValue({ id: 'g1' });
    const mod = await Test.createTestingModule({ providers: [ExamGroupsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(ExamGroupsService);
    await service.create({ name: 'G', startDate: '2026-01-01', endDate: '2026-02-01' } as any);
    expect(prisma.examGroup.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ startDate: expect.any(Date), endDate: expect.any(Date) }) }));
  });
});