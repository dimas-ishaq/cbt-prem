import { Test, TestingModule } from '@nestjs/testing';
import { RombelsService } from './rombels.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RombelsService', () => {
  let service: RombelsService;
  const mockPrisma = {
    rombel: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    major: { findUnique: jest.fn(), findMany: jest.fn() },
    student: { updateMany: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RombelsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(RombelsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should throw ConflictException for duplicate name', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(service.create({ name: 'X RPL 1', majorId: 'm1' } as any)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if major not found', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      mockPrisma.major.findUnique.mockResolvedValue(null);
      await expect(service.create({ name: 'X RPL 1', majorId: 'm1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should create rombel on happy path', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      mockPrisma.major.findUnique.mockResolvedValue({ id: 'm1' });
      mockPrisma.rombel.create.mockResolvedValue({ id: 'r1', name: 'X RPL 1' });
      const result = await service.create({ name: 'X RPL 1', majorId: 'm1' } as any);
      expect(result.name).toBe('X RPL 1');
    });
  });

  describe('findAll', () => {
    it('should return paginated rombels', async () => {
      mockPrisma.rombel.findMany.mockResolvedValue([{ id: 'r1' }]);
      mockPrisma.rombel.count.mockResolvedValue(1);
      const result = await service.findAll(0, 10);
      expect(result).toEqual({ data: [{ id: 'r1' }], total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return rombel', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue({ id: 'r1', name: 'X RPL 1' });
      const result = await service.findOne('r1');
      expect(result.name).toBe('X RPL 1');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update rombel', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValueOnce({ id: 'r1', name: 'X RPL 1' });
      mockPrisma.rombel.update.mockResolvedValue({ id: 'r1', name: 'X RPL 2' });
      const result = await service.update('r1', { name: 'X RPL 2' } as any);
      expect(result.name).toBe('X RPL 2');
    });

    it('should throw ConflictException for duplicate name', async () => {
      mockPrisma.rombel.findUnique
        .mockResolvedValueOnce({ id: 'r1', name: 'X RPL 1' })
        .mockResolvedValueOnce({ id: 'r2', name: 'X RPL 2' });
      await expect(service.update('r1', { name: 'X RPL 2' } as any)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if rombel not found', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete rombel', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrisma.rombel.delete.mockResolvedValue({ id: 'r1' });
      await service.remove('r1');
      expect(mockPrisma.rombel.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStudents', () => {
    it('should throw NotFoundException if rombel not found', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      await expect(service.updateStudents('bad', ['s1'])).rejects.toThrow(NotFoundException);
    });

    it('should disconnect old and connect new students', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue({ id: 'r1' });
      mockPrisma.student.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.updateStudents('r1', ['s1', 's2']);
      expect(result).toEqual({ success: true });
      expect(mockPrisma.student.updateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('importRombels', () => {
    it('should import valid CSV', async () => {
      mockPrisma.major.findMany.mockResolvedValue([{ id: 'm1', code: 'RPL' }]);
      mockPrisma.rombel.upsert.mockResolvedValue({});
      const csv = 'Nama Rombel,Kode Jurusan\nX RPL 1,RPL\n';
      const result = await service.importRombels(Buffer.from(csv));
      expect(result.totalParsed).toBe(1);
      expect(result.imported).toBe(1);
    });

    it('should warn for unknown major code', async () => {
      mockPrisma.major.findMany.mockResolvedValue([]);
      const csv = 'Nama Rombel,Kode Jurusan\nX RPL 1,UNKNOWN\n';
      const result = await service.importRombels(Buffer.from(csv));
      expect(result.totalParsed).toBe(0);
      expect(result.warnings.length).toBe(1);
    });
  });

  describe('generateTemplate', () => {
    it('should return a buffer', async () => {
      const result = await service.generateTemplate();
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('getExamCardsData', () => {
    it('should throw NotFoundException if rombel not found', async () => {
      mockPrisma.rombel.findUnique.mockResolvedValue(null);
      await expect(service.getExamCardsData('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
