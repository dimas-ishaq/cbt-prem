import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const mockService = {
    create: jest.fn(), findByUser: jest.fn(), findUnreadCount: jest.fn(),
    markAllRead: jest.fn(), markRead: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(NotificationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('create should delegate with userId', async () => {
    mockService.create.mockResolvedValue({ id: 'n1' });
    await controller.create({ title: 'Test' } as any, { user: { userId: 'u1' } });
    expect(mockService.create).toHaveBeenCalledWith({ title: 'Test' }, 'u1');
  });

  it('findMe should delegate', async () => {
    mockService.findByUser.mockResolvedValue([]);
    await controller.findMe({ user: { userId: 'u1' } });
    expect(mockService.findByUser).toHaveBeenCalledWith('u1');
  });

  it('countUnread should delegate', async () => {
    mockService.findUnreadCount.mockResolvedValue(3);
    const result = await controller.countUnread({ user: { userId: 'u1' } });
    expect(result).toEqual({ count: 3 });
  });

  it('markAllRead should delegate', async () => {
    mockService.markAllRead.mockResolvedValue({ success: true });
    await controller.markAllRead({ user: { userId: 'u1' } });
    expect(mockService.markAllRead).toHaveBeenCalledWith('u1');
  });

  it('markRead should delegate', async () => {
    mockService.markRead.mockResolvedValue({});
    await controller.markRead('n1', { user: { userId: 'u1' } });
    expect(mockService.markRead).toHaveBeenCalledWith('n1', 'u1');
  });
});
