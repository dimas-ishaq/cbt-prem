import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock encrypt/decrypt
jest.mock('../utils/security.util', () => ({
  encrypt: jest.fn((v) => `encrypted:${v}`),
  decrypt: jest.fn((v) => v.startsWith('encrypted:') ? v.replace('encrypted:', '') : v),
}));

describe('SettingsService', () => {
  let service: SettingsService;
  const mockPrisma = {
    setting: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SettingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getAll', () => {
    it('should return settings with defaults', async () => {
      mockPrisma.setting.findMany.mockResolvedValue([
        { key: 'appName', value: 'My CBT' },
      ]);
      const result = await service.getAll();
      expect(result.appName).toBe('My CBT');
      expect(result.timezone).toBe('Asia/Jakarta');
      expect(result.redisEnabled).toBe('false');
      expect(result.redisHost).toBe('127.0.0.1');
    });

    it('should decrypt redisPassword', async () => {
      mockPrisma.setting.findMany.mockResolvedValue([
        { key: 'redisPassword', value: 'encrypted:secret123' },
      ]);
      const result = await service.getAll();
      expect(result.redisPassword).toBe('secret123');
    });
  });

  describe('update', () => {
    it('should upsert setting', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({ key: 'appName', value: 'New' });
      await service.update('appName', 'New');
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'appName' },
        update: { value: 'New' },
        create: { key: 'appName', value: 'New' },
      });
    });

    it('should encrypt redisPassword', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({});
      await service.update('redisPassword', 'mypass');
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { value: 'encrypted:mypass' },
        })
      );
    });
  });

  describe('updateMany', () => {
    it('should upsert multiple settings', async () => {
      mockPrisma.setting.upsert.mockResolvedValue({});
      await service.updateMany({ appName: 'CBT', timezone: 'UTC' });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
