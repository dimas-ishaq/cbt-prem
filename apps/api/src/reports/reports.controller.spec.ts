import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  const buildService = () => ({
    getAllReports: jest.fn().mockResolvedValue({ exam: [] }),
    exportStudentMasterToExcel: jest.fn(),
    exportAchievementToExcel: jest.fn(),
    exportViolationsToExcel: jest.fn(),
    exportUserAuditToExcel: jest.fn(),
    exportSubscriptionToExcel: jest.fn(),
    exportRevenueToExcel: jest.fn(),
  });

  async function setup() {
    const service = buildService();
    const mod = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();
    return { controller: mod.get(ReportsController), service };
  }

  it('getReports delegates', async () => {
    const { controller, service } = await setup();
    await expect(controller.getReports()).resolves.toEqual({ exam: [] });
    expect(service.getAllReports).toHaveBeenCalledTimes(1);
  });

  it('getRecommendations delegates', async () => {
    const { controller, service } = await setup();
    await expect(controller.getRecommendations()).resolves.toEqual({
      exam: [],
    });
    expect(service.getAllReports).toHaveBeenCalledTimes(1);
  });

  it('exportStudentMaster delegates', async () => {
    const { controller, service } = await setup();
    await controller.exportStudentMaster({} as any);
    expect(service.exportStudentMasterToExcel).toHaveBeenCalledTimes(1);
  });

  it('exportAchievement delegates', async () => {
    const { controller, service } = await setup();
    await controller.exportAchievement({} as any);
    expect(service.exportAchievementToExcel).toHaveBeenCalledTimes(1);
  });

  it('exportViolations delegates', async () => {
    const { controller, service } = await setup();
    await controller.exportViolations({} as any);
    expect(service.exportViolationsToExcel).toHaveBeenCalledTimes(1);
  });

  it('exportUserAudit delegates', async () => {
    const { controller, service } = await setup();
    await controller.exportUserAudit({} as any);
    expect(service.exportUserAuditToExcel).toHaveBeenCalledTimes(1);
  });

  it('exportSubscription delegates', async () => {
    const { controller, service } = await setup();
    await controller.exportSubscription({} as any);
    expect(service.exportSubscriptionToExcel).toHaveBeenCalledTimes(1);
  });

  it('exportRevenue delegates', async () => {
    const { controller, service } = await setup();
    await controller.exportRevenue({} as any);
    expect(service.exportRevenueToExcel).toHaveBeenCalledTimes(1);
  });
});
