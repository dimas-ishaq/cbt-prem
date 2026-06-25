import { Test, TestingModule } from '@nestjs/testing';
import { MajorsService } from './majors.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MajorsService', () => {
  let service: MajorsService;
  const mockPrisma = {
    major: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MajorsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MajorsService>(MajorsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated majors with student count', async () => {
      mockPrisma.major.findMany.mockResolvedValue([
        { id: 'm1', name: 'IPA', code: 'IPA', _count: { students: 30 } },
      ]);
      mockPrisma.major.count.mockResolvedValue(1);

      const result = await service.findAll(0, 10);
      expect(result).toEqual({
        data: [{ id: 'm1', name: 'IPA', code: 'IPA', _count: { students: 30 } }],
        total: 1,
      });
    });

    it('should return all majors without pagination', async () => {
      mockPrisma.major.findMany.mockResolvedValue([{ id: 'm1', name: 'IPA', code: 'IPA' }]);
      mockPrisma.major.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(mockPrisma.major.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { code: 'asc' },
          include: { _count: { select: { students: true } } },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a major with students', async () => {
      mockPrisma.major.findUnique.mockResolvedValue({ id: 'm1', name: 'IPA', students: [] });

      const result = await service.findOne('m1');
      expect(result).toEqual({ id: 'm1', name: 'IPA', students: [] });
    });

    it('should throw NotFoundException for missing major', async () => {
      mockPrisma.major.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create major with uppercase code', async () => {
      mockPrisma.major.findFirst.mockResolvedValue(null);
      mockPrisma.major.create.mockResolvedValue({ id: 'm2', name: 'IPS', code: 'IPS' });

      const dto = { name: 'IPS', code: 'ips', description: 'Ilmu Pengetahuan Sosial' };
      const result = await service.create(dto as any);

      expect(mockPrisma.major.create).toHaveBeenCalledWith({
        data: { name: 'IPS', code: 'IPS', description: 'Ilmu Pengetahuan Sosial' },
      });
      expect(result.code).toBe('IPS');
    });

    it('should reject duplicate name or code', async () => {
      mockPrisma.major.findFirst.mockResolvedValue({ id: 'm1', name: 'IPA' });

      const dto = { name: 'IPA', code: 'IPA' };
      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update major name and code', async () => {
      mockPrisma.major.findUnique.mockResolvedValue({ id: 'm1', name: 'IPA', code: 'IPA' });
      mockPrisma.major.findFirst.mockResolvedValue(null);
      mockPrisma.major.update.mockResolvedValue({ id: 'm1', name: 'IPA Updated', code: 'IPA' });

      const result = await service.update('m1', { name: 'IPA Updated' } as any);
      expect(mockPrisma.major.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { name: 'IPA Updated', code: undefined, description: undefined },
      });
      expect(result.name).toBe('IPA Updated');
    });

    it('should throw on duplicate name during update', async () => {
      mockPrisma.major.findUnique.mockResolvedValue({ id: 'm1', name: 'IPA', code: 'IPA' });
      mockPrisma.major.findFirst.mockResolvedValue({ id: 'm2', name: 'IPS' });

      await expect(service.update('m1', { name: 'IPS' } as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete major if exists', async () => {
      mockPrisma.major.findUnique.mockResolvedValue({ id: 'm1', name: 'IPA' });
      mockPrisma.major.delete.mockResolvedValue({ id: 'm1' });

      const result = await service.remove('m1');
      expect(result.message).toContain('berhasil dihapus');
    });

    it('should throw NotFoundException if major does not exist', async () => {
      mockPrisma.major.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});