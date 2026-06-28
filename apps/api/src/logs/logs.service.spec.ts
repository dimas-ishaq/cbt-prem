import { Test } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('LogsService', () => {
  const prisma = { setting: { findUnique: jest.fn(), upsert: jest.fn() } } as any;
  const tempDir = path.join(process.cwd(), '.test-logs');

  beforeAll(() => { fs.mkdirSync(tempDir, { recursive: true }); });
  afterAll(() => { fs.rmSync(tempDir, { recursive: true, force: true }); });

  it('getSettings returns parsed retention', async () => {
    prisma.setting.findUnique.mockResolvedValue({ value: '7' });
    const mod = await Test.createTestingModule({ providers: [LogsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(LogsService);
    await expect(service.getSettings()).resolves.toEqual({ logRetentionDays: 7 });
  });

  it('getLogFileContent rejects invalid path', async () => {
    const mod = await Test.createTestingModule({ providers: [LogsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(LogsService);
    expect(() => service.getLogFileContent('../evil.log')).toThrow('Invalid filename format');
  });
});