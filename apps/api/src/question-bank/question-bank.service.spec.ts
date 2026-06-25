import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBankService } from './question-bank.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('QuestionBankService', () => {
  let service: QuestionBankService;
  const mockPrisma = {
    questionBank: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionBankService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(QuestionBankService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create question bank', async () => {
      mockPrisma.questionBank.create.mockResolvedValue({ id: 'qb1', name: 'Bank Soal' });
      const result = await service.create({ name: 'Bank Soal' } as any, 't1');
      expect(result.id).toBe('qb1');
      expect(mockPrisma.questionBank.create).toHaveBeenCalledWith({
        data: { name: 'Bank Soal', teacherId: 't1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated list', async () => {
      mockPrisma.questionBank.findMany.mockResolvedValue([{ id: 'qb1' }]);
      mockPrisma.questionBank.count.mockResolvedValue(1);
      const result = await service.findAll('t1', 0, 10);
      expect(result).toEqual({ data: [{ id: 'qb1' }], total: 1 });
    });

    it('should return all without teacherId filter', async () => {
      mockPrisma.questionBank.findMany.mockResolvedValue([]);
      mockPrisma.questionBank.count.mockResolvedValue(0);
      const result = await service.findAll();
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return question bank with questions', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue({ id: 'qb1', questions: [] });
      const result = await service.findOne('qb1');
      expect(result.id).toBe('qb1');
    });
  });

  describe('update', () => {
    it('should update own question bank', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue({ id: 'qb1', teacherId: 't1' });
      mockPrisma.questionBank.update.mockResolvedValue({ id: 'qb1', name: 'Updated' });
      const result = await service.update('qb1', { name: 'Updated' } as any, 't1');
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', {} as any, 't1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue({ id: 'qb1', teacherId: 't-other' });
      await expect(service.update('qb1', {} as any, 't1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete own question bank', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue({ id: 'qb1', teacherId: 't1' });
      mockPrisma.questionBank.delete.mockResolvedValue({ id: 'qb1' });
      await service.remove('qb1', 't1');
      expect(mockPrisma.questionBank.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue({ id: 'qb1', teacherId: 't-other' });
      await expect(service.remove('qb1', 't1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.questionBank.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad', 't1')).rejects.toThrow(NotFoundException);
    });
  });
});