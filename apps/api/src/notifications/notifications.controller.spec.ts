import { Test } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  const service = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findUnreadCount: jest.fn(),
    markAllRead: jest.fn(),
    markRead: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('create delegates to service', async () => {
    service.create.mockResolvedValue({ id: 'n1' });
    const mod = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    const controller = mod.get(NotificationsController);
    await expect(
      controller.create({} as any, { user: { userId: 'u1' } } as any),
    ).resolves.toEqual({ id: 'n1' });
    expect(service.create).toHaveBeenCalledWith({}, 'u1');
  });

  it('countUnread wraps count', async () => {
    service.findUnreadCount.mockResolvedValue(7);
    const mod = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    const controller = mod.get(NotificationsController);
    await expect(
      controller.countUnread({ user: { userId: 'u1' } } as any),
    ).resolves.toEqual({ count: 7 });
  });
});
