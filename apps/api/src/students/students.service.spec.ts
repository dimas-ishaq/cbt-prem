import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StudentsService', () => {
  let service: StudentsService;
  const mockPrisma = {
    user: { create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    student: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(StudentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create student user with hashed password', async () => {
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        username: 'adi',
        student: { id: 's1', nis: '12345' },
      });
      const result = await service.create({
        username: 'adi',
        fullName: 'Adi',
        nis: '12345',
      } as any);
      expect(result.temporaryPassword).toBeDefined();
      expect(typeof result.temporaryPassword).toBe('string');
    });
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      mockPrisma.student.findMany.mockResolvedValue([{ id: 's1' }]);
      mockPrisma.student.count.mockResolvedValue(1);
      const result = await service.findAll(
        undefined,
        undefined,
        undefined,
        0,
        10,
      );
      expect(result).toEqual({ data: [{ id: 's1' }], total: 1 });
    });

    it('should filter by majorId', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);
      await service.findAll('m1');
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ majorId: 'm1' }),
        }),
      );
    });

    it('should filter no-class students', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);
      await service.findAll(undefined, 'no-class');
      expect(mockPrisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ rombelId: null }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return student by id', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 's1',
        user: { fullName: 'Adi' },
      });
      const result = await service.findOne('s1');
      expect(result.id).toBe('s1');
    });
  });

  describe('getMyProfile', () => {
    it('should return profile for student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 's1',
        nis: '123',
        majorId: 'm1',
        rombelId: 'r1',
        user: {
          fullName: 'Adi',
          username: 'adi',
          email: 'a@b.com',
          role: 'SISWA',
          photo: null,
        },
        rombel: { name: 'X RPL 1' },
        major: { name: 'RPL' },
      });
      const result = await service.getMyProfile('u1');
      expect(result.fullName).toBe('Adi');
      expect(result.rombel).toEqual({ name: 'X RPL 1' });
    });

    it('should return null if not a student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      const result = await service.getMyProfile('u1');
      expect(result).toBeNull();
    });
  });

  describe('updatePhoto', () => {
    it('should update user photo', async () => {
      mockPrisma.user.update.mockResolvedValue({ photo: '/photo.jpg' });
      await service.updatePhoto('u1', '/photo.jpg');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { photo: '/photo.jpg' },
      });
    });
  });

  describe('remove', () => {
    it('should delete student and user', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        id: 's1',
        userId: 'u1',
      });
      mockPrisma.user.delete.mockResolvedValue({});
      await service.remove('s1');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
    });

    it('should return null if student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      const result = await service.remove('bad');
      expect(result).toBeNull();
    });
  });
});
