import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeachersService', () => {
  let service: TeachersService;
  const mockPrisma = {
    user: { create: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
    teacher: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(TeachersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create teacher user with temp password', async () => {
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1', username: 'guru1', teacher: { id: 't1', nip: '999' },
      });
      const result = await service.create({
        username: 'guru1', fullName: 'Guru Satu', nip: '999',
      } as any);
      expect(result.temporaryPassword).toBeDefined();
      expect(result.teacher.nip).toBe('999');
    });
  });

  describe('findAll', () => {
    it('should return paginated teachers', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([{ id: 't1' }]);
      mockPrisma.teacher.count.mockResolvedValue(1);
      const result = await service.findAll(undefined, 0, 10);
      expect(result).toEqual({ data: [{ id: 't1' }], total: 1 });
    });

    it('should search by name', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
      mockPrisma.teacher.findMany.mockResolvedValue([{ id: 't1' }]);
      mockPrisma.teacher.count.mockResolvedValue(1);
      const result = await service.findAll('Guru');
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: expect.any(Array) },
        })
      );
      expect(result.data.length).toBe(1);
    });
  });

  describe('remove', () => {
    it('should delete teacher and user', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({ id: 't1', userId: 'u1' });
      mockPrisma.user.delete.mockResolvedValue({});
      await service.remove('t1');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('should do nothing if teacher not found', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);
      await service.remove('bad');
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});