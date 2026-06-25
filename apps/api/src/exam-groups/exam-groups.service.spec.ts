import { Test, TestingModule } from '@nestjs/testing';
import { ExamGroupsService } from './exam-groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ExamGroupsService', () => {
  let service: ExamGroupsService;
  const mockPrisma = {
    examGroup: {
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
        ExamGroupsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ExamGroupsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create exam group with date conversion', async () => {
      const dto = { name: 'UTS 2025', startDate: '2025-06-01', endDate: '2025-06-05' };
      mockPrisma.examGroup.create.mockResolvedValue({ id: 'g1', ...dto });
      const result = await service.create(dto as any);
      expect(mockPrisma.examGroup.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'UTS 2025' }),
      });
      expect(result.id).toBe('g1');
    });
  });

  describe('findAll', () => {
    it('should return paginated groups', async () => {
      mockPrisma.examGroup.findMany.mockResolvedValue([{ id: 'g1' }]);
      mockPrisma.examGroup.count.mockResolvedValue(1);
      const result = await service.findAll(0, 10);
      expect(result).toEqual({ data: [{ id: 'g1' }], total: 1 });
    });

    it('should return all without pagination', async () => {
      mockPrisma.examGroup.findMany.mockResolvedValue([]);
      mockPrisma.examGroup.count.mockResolvedValue(0);
      const result = await service.findAll();
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('should return group by id', async () => {
      mockPrisma.examGroup.findUnique.mockResolvedValue({ id: 'g1', name: 'UTS' });
      const result = await service.findOne('g1');
      expect(result.name).toBe('UTS');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.examGroup.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update group', async () => {
      mockPrisma.examGroup.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrisma.examGroup.update.mockResolvedValue({ id: 'g1', name: 'Updated' });
      const result = await service.update('g1', { name: 'Updated' } as any);
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException on update non-existent', async () => {
      mockPrisma.examGroup.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete group', async () => {
      mockPrisma.examGroup.findUnique.mockResolvedValue({ id: 'g1' });
      mockPrisma.examGroup.delete.mockResolvedValue({ id: 'g1' });
      await service.remove('g1');
      expect(mockPrisma.examGroup.delete).toHaveBeenCalledWith({ where: { id: 'g1' } });
    });

    it('should throw NotFoundException on remove non-existent', async () => {
      mockPrisma.examGroup.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
