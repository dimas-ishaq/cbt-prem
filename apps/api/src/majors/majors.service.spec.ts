import { Test } from '@nestjs/testing';
import { MajorsService } from './majors.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MajorsService', () => {
  const prisma = {
    major: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('create uppercases code', async () => {
    prisma.major.findFirst.mockResolvedValue(null);
    prisma.major.create.mockResolvedValue({ id: 'm1' });
    const mod = await Test.createTestingModule({
      providers: [MajorsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(MajorsService);

    await expect(
      service.create({ name: 'IPA', code: 'ipa' } as any),
    ).resolves.toEqual({ id: 'm1' });
    expect(prisma.major.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: 'IPA' }),
      }),
    );
  });

  it('remove delete major', async () => {
    prisma.major.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.major.delete.mockResolvedValue({ id: 'm1' });
    const mod = await Test.createTestingModule({
      providers: [MajorsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(MajorsService);

    await expect(service.remove('m1')).resolves.toEqual({
      success: true,
      message: 'Jurusan berhasil dihapus',
    });
  });
});
