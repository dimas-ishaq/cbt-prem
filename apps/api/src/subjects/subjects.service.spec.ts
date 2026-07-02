import { Test } from '@nestjs/testing';
import { SubjectsService } from './subjects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubjectsService', () => {
  const prisma = {
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
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('create uppercases code', async () => {
    prisma.subject.findFirst.mockResolvedValue(null);
    prisma.subject.create.mockResolvedValue({ id: 's1' });
    const mod = await Test.createTestingModule({
      providers: [SubjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(SubjectsService);

    await expect(service.create({ name: 'Mat', code: 'ipa' } as any)).resolves.toEqual({ id: 's1' });
    expect(prisma.subject.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ code: 'IPA' }) }));
  });

  it('importFromCsv reject missing header', async () => {
    const mod = await Test.createTestingModule({
      providers: [SubjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(SubjectsService);

    await expect(service.importFromCsv('name,code\nMath,MAT')).rejects.toThrow('Kolom CSV wajib');
  });

  it('create reject duplicate name or code', async () => {
    prisma.subject.findFirst.mockResolvedValue({ id: 'exists' });
    const mod = await Test.createTestingModule({
      providers: [SubjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(SubjectsService);

    await expect(service.create({ name: 'Mat', code: 'ipa' } as any)).rejects.toThrow('Mata pelajaran dengan nama atau kode tersebut sudah terdaftar');
  });

  it('remove delete subject', async () => {
    prisma.subject.findUnique.mockResolvedValue({ id: 's1', _count: { questionBanks: 0, exams: 0, teachers: 0 } });
    prisma.subject.delete.mockResolvedValue({ id: 's1' });
    const mod = await Test.createTestingModule({
      providers: [SubjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(SubjectsService);

    await expect(service.remove('s1')).resolves.toEqual({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  });
});