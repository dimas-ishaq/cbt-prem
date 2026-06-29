import { Test } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class AllowAllGuard implements CanActivate { canActivate(_c: ExecutionContext) { return true; } }

describe('RolesController', () => {
  const service = { findAll: jest.fn(), getPermissionsMatrix: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), clone: jest.fn(), remove: jest.fn(), getAuditLogs: jest.fn() };

  it('getPermissionsMatrix delegates', async () => {
    service.getPermissionsMatrix.mockResolvedValue({});
    const mod = await Test.createTestingModule({ controllers: [RolesController], providers: [{ provide: RolesService, useValue: service }] }).overrideGuard(JwtAuthGuard).useClass(AllowAllGuard).overrideGuard(PermissionsGuard).useClass(AllowAllGuard).compile();
    const controller = mod.get(RolesController);
    await expect(controller.getPermissionsMatrix()).resolves.toEqual({});
  });
});