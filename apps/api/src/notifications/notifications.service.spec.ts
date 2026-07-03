import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationType,
  NotificationTargetType,
  NotificationPriority,
} from './dto/create-notification.dto';

describe('NotificationsService', () => {
  const prisma = {
    customRole: { findMany: jest.fn() },
    notificationRolePolicy: { upsert: jest.fn() },
    user: { findMany: jest.fn() },
    notificationPreference: { findUnique: jest.fn() },
    examSession: { findUnique: jest.fn(), findMany: jest.fn() },
    exam: { findUnique: jest.fn() },
    teacher: { findUnique: jest.fn() },
    student: { findMany: jest.fn() },
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    notificationRecipient: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    setting: { findUnique: jest.fn(), upsert: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  } as any;
  const moduleRef = { get: jest.fn(() => ({ sendToUser: jest.fn() })) } as any;

  it('create reject empty targets', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.create({ targets: [] } as any)).rejects.toThrow(
      'Minimal satu target notifikasi harus diisi',
    );
  });

  it('markRead returns recipient when already read', async () => {
    prisma.notificationRecipient.findUnique.mockResolvedValue({ isRead: true });
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.markRead('n1', 'u1')).resolves.toEqual({
      isRead: true,
    });
  });

  it('updateNotificationPolicy returns success', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await expect(
      service.updateNotificationPolicy({
        roleId: 'r1',
        policies: [{ type: NotificationType.EXAM_SUBMITTED, isEnabled: true }],
      } as any),
    ).resolves.toEqual({ success: true });
  });

  it('getNotificationRetentionSettings returns parsed days', async () => {
    prisma.setting.findUnique.mockResolvedValue({ value: '14' });
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.getNotificationRetentionSettings()).resolves.toEqual({
      notificationRetentionDays: 14,
    });
  });

  it('getNotificationRetentionSettings defaults to zero', async () => {
    prisma.setting.findUnique.mockResolvedValue(null);
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.getNotificationRetentionSettings()).resolves.toEqual({
      notificationRetentionDays: 0,
    });
  });

  it('updateNotificationRetentionSettings upserts setting', async () => {
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await service.updateNotificationRetentionSettings({
      notificationRetentionDays: 30,
    });
    expect(prisma.setting.upsert).toHaveBeenCalledWith({
      where: { key: 'notificationRetentionDays' },
      update: { value: '30' },
      create: { key: 'notificationRetentionDays', value: '30' },
    });
  });

  it('handleNotificationCleanup skips when retention disabled', async () => {
    prisma.setting.findUnique.mockResolvedValue({ value: '0' });
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await service.handleNotificationCleanup();
    expect(prisma.notification.deleteMany).not.toHaveBeenCalled();
  });

  it('handleNotificationCleanup deletes stale notifications', async () => {
    prisma.setting.findUnique.mockResolvedValue({ value: '7' });
    prisma.notification.deleteMany.mockResolvedValue({ count: 3 });
    const mod = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleRef, useValue: moduleRef },
      ],
    }).compile();
    const service = mod.get(NotificationsService);
    await service.handleNotificationCleanup();
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: { lt: expect.any(Date) },
      },
    });
  });
});
