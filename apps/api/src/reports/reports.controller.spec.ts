import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  it('getReports delegates', async () => {
    const service = { getAllReports: jest.fn().mockResolvedValue({ exam: [] }) };
    const mod = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();
    const controller = mod.get(ReportsController);
    await expect(controller.getReports()).resolves.toEqual({ exam: [] });
  });
});