import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  const mockService = { getAll: jest.fn(), updateMany: jest.fn(), update: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: mockService }],
    }).compile();
    controller = module.get(SettingsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('getSettings should delegate', async () => {
    mockService.getAll.mockResolvedValue({ appName: 'CBT' });
    const result = await controller.getSettings();
    expect(result.appName).toBe('CBT');
  });

  it('getPublicSettings should exclude sensitive fields', async () => {
    mockService.getAll.mockResolvedValue({
      appName: 'CBT', redisHost: '127.0.0.1', redisPort: '6379',
      redisPassword: 'secret', redisEnabled: 'true',
    });
    const result = await controller.getPublicSettings();
    expect(result).not.toHaveProperty('redisHost');
    expect(result).not.toHaveProperty('redisPassword');
    expect(result.appName).toBe('CBT');
  });

  it('updateSettings should delegate', async () => {
    mockService.updateMany.mockResolvedValue([]);
    await controller.updateSettings({ appName: 'New' });
    expect(mockService.updateMany).toHaveBeenCalledWith({ appName: 'New' });
  });
});
