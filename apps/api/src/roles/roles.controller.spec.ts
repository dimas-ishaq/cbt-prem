import { Test } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  const service = { findAll: jest.fn(), getPermissionsMatrix: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), clone: jest.fn(), remove: jest.fn(), getAuditLogs: jest.fn() };

  it('getPermissionsMatrix delegates', async () => {
    service.getPermissionsMatrix.mockResolvedValue({});
    const mod = await Test.createTestingModule({ controllers: [RolesController], providers: [{ provide: RolesService, useValue: service }] }).compile();
    const controller = mod.get(RolesController);
    await expect(controller.getPermissionsMatrix()).resolves.toEqual({});
  });
});