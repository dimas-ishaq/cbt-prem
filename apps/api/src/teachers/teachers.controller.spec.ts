import { Test } from '@nestjs/testing';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

describe('TeachersController', () => {
  const service = { create: jest.fn(), findAll: jest.fn(), remove: jest.fn() };

  it('findAll delegates', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const mod = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [{ provide: TeachersService, useValue: service }],
    }).compile();
    const controller = mod.get(TeachersController);
    await expect(
      controller.findAll({ skip: 0, take: 10 } as any, 'abc'),
    ).resolves.toEqual({ data: [], total: 0 });
  });
});
