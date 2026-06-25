import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  const mockService = { getAllReports: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockService }],
    }).compile();
    controller = module.get(ReportsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('getReports should delegate', () => {
    mockService.getAllReports.mockResolvedValue({ exam: [], student: [] });
    controller.getReports();
    expect(mockService.getAllReports).toHaveBeenCalled();
  });
});
