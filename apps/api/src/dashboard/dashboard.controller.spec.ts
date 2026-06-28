import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  it('getStats delegates', async () => {
    const service = { getStats: jest.fn().mockResolvedValue({ users: 1 }) };
    const mod = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }],
    }).compile();

    const controller = mod.get(DashboardController);
    await expect(controller.getStats()).resolves.toEqual({ users: 1 });
  });
});