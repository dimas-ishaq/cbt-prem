import { Test } from '@nestjs/testing';
import { MajorsController } from './majors.controller';
import { MajorsService } from './majors.service';

describe('MajorsController', () => {
  const service = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };

  it('findOne delegates', async () => {
    service.findOne.mockResolvedValue({ id: 'm1' });
    const mod = await Test.createTestingModule({ controllers: [MajorsController], providers: [{ provide: MajorsService, useValue: service }] }).compile();
    const controller = mod.get(MajorsController);
    await expect(controller.findOne('m1')).resolves.toEqual({ id: 'm1' });
  });
});