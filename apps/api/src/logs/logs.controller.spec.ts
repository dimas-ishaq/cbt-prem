import { Test, TestingModule } from '@nestjs/testing';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

describe('LogsController', () => {
  let controller: LogsController;
  const mockService = { getLogFiles: jest.fn(), getLogFileContent: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogsController],
      providers: [{ provide: LogsService, useValue: mockService }],
    }).compile();
    controller = module.get(LogsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('getFiles should delegate', () => {
    mockService.getLogFiles.mockReturnValue(['app.log']);
    const result = controller.getFiles();
    expect(result).toEqual(['app.log']);
  });

  it('getContent should delegate', () => {
    mockService.getLogFileContent.mockReturnValue('log data');
    const result = controller.getContent('app.log');
    expect(result).toEqual({ content: 'log data' });
  });
});
