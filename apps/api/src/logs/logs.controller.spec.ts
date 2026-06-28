import { Test } from '@nestjs/testing';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

describe('LogsController', () => {
  const service = { getLogFiles: jest.fn(), getLogFileContent: jest.fn(), getSettings: jest.fn(), updateSettings: jest.fn(), deleteLogFile: jest.fn(), clearLogFile: jest.fn() };

  it('getFiles delegates', async () => {
    service.getLogFiles.mockResolvedValue([]);
    const mod = await Test.createTestingModule({ controllers: [LogsController], providers: [{ provide: LogsService, useValue: service }] }).compile();
    const controller = mod.get(LogsController);
    await expect(controller.getFiles()).resolves.toEqual([]);
  });
});