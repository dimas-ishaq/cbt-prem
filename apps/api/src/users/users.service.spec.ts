import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('findUserById should return user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
    await expect(service.findUserById('1')).resolves.toEqual({ id: '1' });
  });

  it('findUserById should throw when missing', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findUserById('1')).rejects.toThrow(NotFoundException);
  });

  it('createUser should reject duplicate username', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1' });
    await expect(
      service.createUser({ username: 'u', password: 'p', fullName: 'n' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('findAll should return data and total', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);
    await expect(service.findAll(Role.SUPER_ADMIN)).resolves.toEqual({ data: [], total: 0 });
  });
});