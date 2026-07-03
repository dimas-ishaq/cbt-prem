import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const service = { findAll: jest.fn(), findUserById: jest.fn(), createUser: jest.fn(), updateUser: jest.fn(), toggleActive: jest.fn(), resetPassword: jest.fn(), deleteUser: jest.fn(), exportAllUsers: jest.fn(), importUsers: jest.fn() };

  it('findAll delegates', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const mod = await Test.createTestingModule({ controllers: [UsersController], providers: [{ provide: UsersService, useValue: service }] }).compile();
    const controller = mod.get(UsersController);
    await expect(controller.findAll({ skip: 0, take: 10 } as any, undefined, '1', '10')).resolves.toEqual({ data: [], total: 0 });
  });

  it('export delegates before :id route', async () => {
    service.exportAllUsers.mockResolvedValue('csv-data');
    const mod = await Test.createTestingModule({ controllers: [UsersController], providers: [{ provide: UsersService, useValue: service }] }).compile();
    const controller = mod.get(UsersController);
    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };
    await controller.export(res);
    expect(service.exportAllUsers).toHaveBeenCalledTimes(1);
  });
});