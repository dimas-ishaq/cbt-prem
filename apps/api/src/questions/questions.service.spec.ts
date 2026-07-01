import { Test } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionsService', () => {
  const prisma = {
    question: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    questionOption: { deleteMany: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
    questionBank: { delete: jest.fn(), findUnique: jest.fn() },
    teacher: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  } as any;

  it('create nests options', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'TEACHER' });
    prisma.teacher.findUnique.mockResolvedValue({ id: 't1' });
    prisma.questionBank.findUnique.mockResolvedValue({ id: 'b1', teacherId: 't1', subject: { teachers: [] } });
    prisma.question.create.mockResolvedValue({ id: 'q1' });
    const mod = await Test.createTestingModule({ providers: [QuestionsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(QuestionsService);
    await service.create({ questionBankId: 'b1', content: 'Q', type: 'ESSAY', difficulty: 'MUDAH', points: 5, options: [] } as any, 'u1');
    expect(prisma.question.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ options: { create: [] } }) }));
  });
});