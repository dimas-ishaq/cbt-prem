import { Test } from '@nestjs/testing';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

describe('SubjectsController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    importFromCsv: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('findAll delegates', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const mod = await Test.createTestingModule({
      controllers: [SubjectsController],
      providers: [{ provide: SubjectsService, useValue: service }],
    }).compile();
    const controller = mod.get(SubjectsController);

    await expect(controller.findAll({ skip: 0, take: 10 } as any)).resolves.toEqual({ data: [], total: 0 });
  });

  it('importCsv reject empty file', async () => {
    const mod = await Test.createTestingModule({
      controllers: [SubjectsController],
      providers: [{ provide: SubjectsService, useValue: service }],
    }).compile();
    const controller = mod.get(SubjectsController);

    await expect(controller.importCsv(null as any)).rejects.toThrow('File CSV wajib diunggah');
  });
});