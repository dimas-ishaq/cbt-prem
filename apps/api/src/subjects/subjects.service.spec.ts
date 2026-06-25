import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubjectsService', () => {
  let service: SubjectsService;
  const mockPrisma = {
    subject: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teacher: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SubjectsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('findAll', () => {
    it('should return paginated subjects', async () => {
      mockPrisma.subject.findMany.mockResolvedValue([{ id: 's1', name: 'Math' }]);
      mockPrisma.subject.count.mockResolvedValue(1);
      const result = await service.findAll(0, 10);
      expect(result).toEqual({ data: [{ id: 's1', name: 'Math' }], total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return subject', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 's1', name: 'Math' });
      expect(await service.findOne('s1')).toEqual({ id: 's1', name: 'Math' });
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create with uppercase code', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);
      mockPrisma.subject.create.mockResolvedValue({ id: 's1', name: 'Math', code: 'MTK' });
      const result = await service.create({ name: 'Math', code: 'mtk' } as any);
      expect(result.code).toBe('MTK');
    });

    it('should throw on duplicate', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue({ id: 's1' });
      await expect(service.create({ name: 'Math', code: 'MTK' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update subject', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 's1', name: 'Math', code: 'MTK' });
      mockPrisma.subject.findFirst.mockResolvedValue(null);
      mockPrisma.subject.update.mockResolvedValue({ id: 's1', name: 'Mathematics' });
      const result = await service.update('s1', { name: 'Mathematics' } as any);
      expect(result.name).toBe('Mathematics');
    });

    it('should throw on duplicate name during update', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 's1', name: 'Math', code: 'MTK' });
      mockPrisma.subject.findFirst.mockResolvedValue({ id: 's2' });
      await expect(service.update('s1', { name: 'Physics' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete subject', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.subject.delete.mockResolvedValue({});
      const result = await service.remove('s1');
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('importFromCsv', () => {
    it('should throw if CSV has no data rows', async () => {
      await expect(service.importFromCsv('name,code,description,teacherusernames')).rejects.toThrow(BadRequestException);
    });

    it('should throw for missing required columns', async () => {
      await expect(service.importFromCsv('name,code\nMath,MTK')).rejects.toThrow(BadRequestException);
    });

    it('should import valid CSV', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);
      mockPrisma.subject.findFirst.mockResolvedValue(null);
      mockPrisma.subject.create.mockResolvedValue({ id: 's1' });
      const csv = 'name,code,description,teacherusernames\nMath,MTK,Mathematics,\n';
      const result = await service.importFromCsv(csv);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);
    });
  });
});
