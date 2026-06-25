import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestionsService', () => {
  let service: QuestionsService;
  const mockPrisma = {
    question: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    questionOption: { deleteMany: jest.fn() },
    questionBank: { delete: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(QuestionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create question with options', async () => {
      mockPrisma.question.create.mockResolvedValue({ id: 'q1', content: 'What?' });
      const dto = { content: 'What?', questionBankId: 'qb1', type: 'PILIHAN_GANDA', options: [{ label: 'A', isCorrect: true }] };
      const result = await service.create(dto as any);
      expect(result.id).toBe('q1');
      expect(mockPrisma.question.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ options: { create: dto.options } }) })
      );
    });
  });

  describe('findByBank', () => {
    it('should return questions for bank', async () => {
      mockPrisma.question.findMany.mockResolvedValue([{ id: 'q1' }]);
      const result = await service.findByBank('qb1');
      expect(result).toEqual([{ id: 'q1' }]);
    });
  });

  describe('update', () => {
    it('should update question and replace options', async () => {
      mockPrisma.questionOption.deleteMany.mockResolvedValue({});
      mockPrisma.question.update.mockResolvedValue({ id: 'q1', content: 'Updated' });
      const result = await service.update('q1', { content: 'Updated', options: [{ label: 'B' }] } as any);
      expect(mockPrisma.questionOption.deleteMany).toHaveBeenCalledWith({ where: { questionId: 'q1' } });
      expect(result.content).toBe('Updated');
    });

    it('should update question without touching options', async () => {
      mockPrisma.question.update.mockResolvedValue({ id: 'q1', content: 'Updated' });
      await service.update('q1', { content: 'Updated' } as any);
      expect(mockPrisma.questionOption.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete question', async () => {
      mockPrisma.question.delete.mockResolvedValue({ id: 'q1' });
      await service.remove('q1');
      expect(mockPrisma.question.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
    });
  });

  describe('removeBank', () => {
    it('should delete question bank', async () => {
      mockPrisma.questionBank.delete.mockResolvedValue({ id: 'qb1' });
      await service.removeBank('qb1');
      expect(mockPrisma.questionBank.delete).toHaveBeenCalledWith({ where: { id: 'qb1' } });
    });
  });
});
