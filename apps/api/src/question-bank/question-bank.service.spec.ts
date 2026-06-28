import { Test } from '@nestjs/testing';
import { QuestionBankService } from './question-bank.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionBankService', () => {
  const prisma = { questionBank: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } } as any;

  it('create attaches teacherId', async () => {
    prisma.questionBank.create.mockResolvedValue({ id: 'qb1' });
    const mod = await Test.createTestingModule({ providers: [QuestionBankService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(QuestionBankService);
    await expect(service.create({ name: 'QB', subjectId: 's1' } as any, 't1')).resolves.toEqual({ id: 'qb1' });
    expect(prisma.questionBank.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ teacherId: 't1' }) }));
  });
});