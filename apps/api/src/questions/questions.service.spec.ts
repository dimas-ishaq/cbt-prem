import { Test } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionsService', () => {
  const prisma = { question: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() }, questionOption: { deleteMany: jest.fn() }, $transaction: jest.fn(async (fn) => fn(prisma)), questionBank: { delete: jest.fn() } } as any;

  it('create nests options', async () => {
    prisma.question.create.mockResolvedValue({ id: 'q1' });
    const mod = await Test.createTestingModule({ providers: [QuestionsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(QuestionsService);
    await service.create({ questionBankId: 'b1', content: 'Q', type: 'ESSAY', difficulty: 'MUDAH', points: 5, options: [] } as any);
    expect(prisma.question.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ options: { create: [] } }) }));
  });
});