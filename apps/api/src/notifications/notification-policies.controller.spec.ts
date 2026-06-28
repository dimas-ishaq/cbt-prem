import { Test } from '@nestjs/testing';
import { NotificationPoliciesController } from './notification-policies.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationPoliciesController', () => {
  const service = {
    getNotificationPolicies: jest.fn(),
    updateNotificationPolicy: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('getPolicies delegates', async () => {
    service.getNotificationPolicies.mockResolvedValue([{ id: 'r1' }]);
    const mod = await Test.createTestingModule({
      controllers: [NotificationPoliciesController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();

    const controller = mod.get(NotificationPoliciesController);
    await expect(controller.getPolicies()).resolves.toEqual([{ id: 'r1' }]);
  });
});