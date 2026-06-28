import { Test } from '@nestjs/testing';
import { RombelsController } from './rombels.controller';
import { RombelsService } from './rombels.service';

describe('RombelsController', () => {
  const service = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn(), updateStudents: jest.fn(), generateTemplate: jest.fn(), importRombels: jest.fn(), getExamCardsData: jest.fn() };

  it('findAll delegates', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const mod = await Test.createTestingModule({ controllers: [RombelsController], providers: [{ provide: RombelsService, useValue: service }] }).compile();
    const controller = mod.get(RombelsController);
    await expect(controller.findAll({ skip: 0, take: 10 } as any)).resolves.toEqual({ data: [], total: 0 });
  });
});