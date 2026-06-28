import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

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

  describe('uploadFavicon', () => {
    it('should reject missing file', async () => {
      await expect(controller.uploadFavicon(undefined as any)).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid mime', async () => {
      const file = { mimetype: 'text/plain', originalname: 'bad.txt', size: 100 } as any;
      await expect(controller.uploadFavicon(file)).rejects.toThrow(BadRequestException);
    });

    it('should reject file too large', async () => {
      const file = { mimetype: 'image/png', originalname: 'icon.png', size: 300 * 1024 } as any;
      await expect(controller.uploadFavicon(file)).rejects.toThrow(BadRequestException);
    });

    it('should accept and save valid favicon', async () => {
      const file = { mimetype: 'image/png', originalname: 'favicon.png', size: 1024, buffer: Buffer.from('test') } as any;
      mockService.update.mockResolvedValue({});
      const result = await controller.uploadFavicon(file);
      expect(mockService.update).toHaveBeenCalledWith('faviconUrl', '/uploads/settings/favicon.png');
      expect(result.faviconUrl).toBe('/uploads/settings/favicon.png');
    });

    it('should accept .ico favicon', async () => {
      const file = { mimetype: 'image/x-icon', originalname: 'icon.ico', size: 512, buffer: Buffer.from('ico') } as any;
      mockService.update.mockResolvedValue({});
      const result = await controller.uploadFavicon(file);
      expect(result.faviconUrl).toBe('/uploads/settings/favicon.ico');
    });
  });
});