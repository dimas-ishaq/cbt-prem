import { Test } from '@nestjs/testing';
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('LogsService', () => {
  const prisma = {
    setting: { findUnique: jest.fn(), upsert: jest.fn() },
  } as any;
  const tempDir = path.join(process.cwd(), '.test-logs');

  beforeAll(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });
  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  afterEach(() => jest.clearAllMocks());

  it('getSettings returns parsed retention', async () => {
    prisma.setting.findUnique.mockResolvedValue({ value: '7' });
    const mod = await Test.createTestingModule({
      providers: [LogsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(LogsService);
    await expect(service.getSettings()).resolves.toEqual({
      logRetentionDays: 7,
    });
  });

  it('getLogFileContent rejects invalid path', async () => {
    const mod = await Test.createTestingModule({
      providers: [LogsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(LogsService);
    expect(() => service.getLogFileContent('../evil.log')).toThrow(
      'Invalid filename format',
    );
  });

  it('getLogFiles sorts newest first', async () => {
    const mod = await Test.createTestingModule({
      providers: [LogsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = mod.get(LogsService);
    (service as any).logsDir = tempDir;
    const base = (service as any).logsDir;
    fs.writeFileSync(path.join(base, 'old.log'), 'old');
    fs.writeFileSync(path.join(base, 'new.log'), 'new');
    const now = new Date();
    fs.utimesSync(
      path.join(base, 'old.log'),
      now,
      new Date(now.getTime() - 10000),
    );
    fs.utimesSync(path.join(base, 'new.log'), now, now);
    expect(service.getLogFiles()).toEqual(['new.log', 'old.log']);
  });
});
