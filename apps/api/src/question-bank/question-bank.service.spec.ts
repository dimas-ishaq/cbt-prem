import { Test } from '@nestjs/testing';
import { QuestionBankService } from './question-bank.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionBankService', () => {
  const prisma = {
    questionBank: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teacher: { findUnique: jest.fn(), findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
  } as any;

  prisma.user.findUnique.mockResolvedValue({ role: 'GURU' });
  prisma.teacher.findUnique.mockResolvedValue({ id: 't1' });

  it('create attaches teacherId', async () => {
    prisma.teacher.findUnique.mockResolvedValue({ id: 't1' });
    prisma.questionBank.create.mockResolvedValue({ id: 'qb1' });
    const mod = await Test.createTestingModule({
      providers: [
        QuestionBankService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    const service = mod.get(QuestionBankService);
    await expect(
      service.create({ name: 'QB', subjectId: 's1' } as any, 'u1'),
    ).resolves.toEqual({ id: 'qb1' });
    expect(prisma.questionBank.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teacherId: 't1' }),
      }),
    );
  });
});
