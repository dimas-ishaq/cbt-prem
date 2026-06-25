import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationTargetType } from './dto/create-notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const mockPrisma: any = {
    notification: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    notificationRecipient: {
      createMany: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(),
      update: jest.fn(), updateMany: jest.fn(), count: jest.fn(),
    },
    user: { findMany: jest.fn() },
    student: { findMany: jest.fn() },
    examSession: { findMany: jest.fn() },
  };
  const mockGateway = { sendToUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealtimeGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should throw ForbiddenException if no targets', async () => {
      await expect(service.create({ targets: [] } as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if no valid recipients', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await expect(service.create({
        title: 'Test', message: 'msg',
        targets: [{ type: NotificationTargetType.ROLE, id: 'GURU' }],
      } as any)).rejects.toThrow(NotFoundException);
    });

    it('should create notification and send realtime events', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1' });
      mockPrisma.notificationRecipient.createMany.mockResolvedValue({});
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', title: 'Test', createdAt: new Date() });
      mockPrisma.notificationRecipient.findMany.mockResolvedValue([{ userId: 'u1' }]);

      const result = await service.create({
        title: 'Test', message: 'msg', type: 'GENERAL',
        targets: [{ type: NotificationTargetType.ROLE, id: 'GURU' }],
      } as any, 'creator1');

      expect(result.id).toBe('n1');
      expect(mockGateway.sendToUser).toHaveBeenCalledWith('u1', 'new_notification', expect.any(Object));
    });
  });

  describe('findByUser', () => {
    it('should return notifications for user', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
      const result = await service.findByUser('u1');
      expect(result).toEqual([{ id: 'n1' }]);
    });
  });

  describe('findUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notificationRecipient.count.mockResolvedValue(5);
      const result = await service.findUnreadCount('u1');
      expect(result).toBe(5);
    });
  });

  describe('markRead', () => {
    it('should throw NotFoundException if recipient not found', async () => {
      mockPrisma.notificationRecipient.findUnique.mockResolvedValue(null);
      await expect(service.markRead('n1', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should return existing if already read', async () => {
      const existing = { isRead: true };
      mockPrisma.notificationRecipient.findUnique.mockResolvedValue(existing);
      const result = await service.markRead('n1', 'u1');
      expect(result).toBe(existing);
    });

    it('should mark as read', async () => {
      mockPrisma.notificationRecipient.findUnique.mockResolvedValue({ isRead: false });
      mockPrisma.notificationRecipient.update.mockResolvedValue({ isRead: true });
      const result = await service.markRead('n1', 'u1');
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllRead', () => {
    it('should mark all as read', async () => {
      mockPrisma.notificationRecipient.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.markAllRead('u1');
      expect(result).toEqual({ success: true });
    });
  });
});
