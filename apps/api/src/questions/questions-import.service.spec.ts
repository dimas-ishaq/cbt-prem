import { Test } from '@nestjs/testing';
import { QuestionsImportService } from './questions-import.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionsImportService', () => {
  const prisma = { $transaction: jest.fn(), question: { create: jest.fn() } } as any;

  it('parseQuestions handles plain doc', async () => {
    const mod = await Test.createTestingModule({ providers: [QuestionsImportService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(QuestionsImportService) as any;
    const result = service.parseQuestions('<p>no markers</p>');
    expect(result.totalWarnings).toBeGreaterThanOrEqual(1);
  });

  it('parseQuestions returns warning for invalid doc', async () => {
    const mod = await Test.createTestingModule({ providers: [QuestionsImportService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(QuestionsImportService) as any;
    const result = service.parseQuestions('<p>hello</p>');
    expect(result.totalWarnings).toBeGreaterThanOrEqual(1);
  });
});