import { Test } from '@nestjs/testing';
import { QuestionsImportService } from './questions-import.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionsImportService', () => {
  const prisma = {
    $transaction: jest.fn(async (fn: any) => fn(prisma)),
    question: { create: jest.fn() },
    user: { findUnique: jest.fn() },
    teacher: { findUnique: jest.fn() },
    questionBank: { findUnique: jest.fn() },
  } as any;

  function makeService() {
    return Test.createTestingModule({
      providers: [
        QuestionsImportService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .compile()
      .then((m) => m.get(QuestionsImportService));
  }

  beforeEach(() => jest.clearAllMocks());

  it('parseQuestions handles plain doc', async () => {
    const service = await makeService();
    const result = service.parseQuestions('<p>no markers</p>');
    expect(result.totalWarnings).toBeGreaterThanOrEqual(1);
  });

  it('parseQuestions returns warning for invalid doc', async () => {
    const service = await makeService();
    const result = service.parseQuestions('<p>hello</p>');
    expect(result.totalWarnings).toBeGreaterThanOrEqual(1);
  });

  it('parses valid MULTIPLE CHOICE questions with SQ/EQ markers', async () => {
    const service = await makeService();
    const html = `
      <p>MULTIPLE CHOICE</p>
      <p>SQ</p>
      <p>What is 2 + 2?</p>
      <p>A. 3</p>
      <p>B. 4</p>
      <p>JAWABAN: B</p>
      <p>EQ</p>
      <p>END MULTIPLE CHOICE</p>
    `;
    const result = service.parseQuestions(html);
    expect(result.success).toHaveLength(1);
    expect(result.success[0].options).toHaveLength(2);
    expect(result.success[0].options.some((o: any) => o.isCorrect)).toBe(true);
    expect(result.totalWarnings).toBe(0);
  });

  it('parses ESSAY questions', async () => {
    const service = await makeService();
    const html = `
      <p>ESSAY</p>
      <p>SQ</p>
      <p>Jelaskan siklus air</p>
      <p>EQ</p>
      <p>END ESSAY</p>
    `;
    const result = service.parseQuestions(html);
    expect(result.success).toHaveLength(1);
    expect(result.success[0].options).toHaveLength(0);
  });

  it('parses multiple questions from one document', async () => {
    const service = await makeService();
    const html = `
      <p>MULTIPLE CHOICE</p>
      <p>SQ</p><p>Q1?</p><p>A. 1</p><p>B. 2</p><p>JAWABAN: A</p><p>EQ</p>
      <p>SQ</p><p>Q2?</p><p>A. 3</p><p>B. 4</p><p>JAWABAN: B</p><p>EQ</p>
      <p>END MULTIPLE CHOICE</p>
    `;
    const result = service.parseQuestions(html);
    expect(result.success).toHaveLength(2);
    expect(result.success[0].options[0].isCorrect).toBe(true);
    expect(result.success[1].options[1].isCorrect).toBe(true);
  });

  it('warns on question without answer key', async () => {
    const service = await makeService();
    const html = `
      <p>MULTIPLE CHOICE</p>
      <p>SQ</p><p>Q1?</p><p>A. 1</p><p>B. 2</p><p>EQ</p>
      <p>END MULTIPLE CHOICE</p>
    `;
    const result = service.parseQuestions(html);
    expect(result.success).toHaveLength(0);
    expect(result.totalWarnings).toBeGreaterThan(0);
  });

  it('imports valid docx content into database', async () => {
    const service = await makeService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'TEACHER' });
    prisma.teacher.findUnique.mockResolvedValue({ id: 't1' });
    prisma.questionBank.findUnique.mockResolvedValue({
      id: 'b1',
      teacherId: 't1',
      subject: { teachers: [] },
    });
    service.convertDocxToHtml = jest.fn().mockResolvedValue(`
      <p>MULTIPLE CHOICE</p>
      <p>SQ</p><p>What is 2 + 2?</p><p>A. 3</p><p>B. 4</p><p>JAWABAN: B</p><p>EQ</p>
      <p>END MULTIPLE CHOICE</p>
    `);
    const questionRecord = {
      id: 'q1',
      content: '<p>What is 2 + 2</p>',
      type: 'PILIHAN_GANDA',
      difficulty: 'MUDAH',
      points: 5,
      options: [],
    };
    prisma.question.create.mockResolvedValue(questionRecord);

    const result = await service.importFromDocx('b1', 'u1', {
      buffer: Buffer.from('x'),
    } as any);
    expect(result.imported).toBe(1);
    expect(result.questions).toHaveLength(1);
    expect(prisma.question.create).toHaveBeenCalledTimes(1);
  });
});
