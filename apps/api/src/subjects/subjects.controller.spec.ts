import { Test } from '@nestjs/testing';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class AllowAllGuard implements CanActivate { canActivate(_c: ExecutionContext) { return true; } }

describe('SubjectsController', () => {
  const service = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), importFromCsv: jest.fn(), update: jest.fn(), remove: jest.fn() };
  beforeEach(() => jest.clearAllMocks());

  it('findAll delegates', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const mod = await Test.createTestingModule({ controllers: [SubjectsController], providers: [{ provide: SubjectsService, useValue: service }] }).overrideGuard(JwtAuthGuard).useClass(AllowAllGuard).overrideGuard(PermissionsGuard).useClass(AllowAllGuard).compile();
    const controller = mod.get(SubjectsController);
    await expect(controller.findAll({ skip: 0, take: 10 } as any)).resolves.toEqual({ data: [], total: 0 });
  });

  it('importCsv reject empty file', async () => {
    const mod = await Test.createTestingModule({ controllers: [SubjectsController], providers: [{ provide: SubjectsService, useValue: service }] }).overrideGuard(JwtAuthGuard).useClass(AllowAllGuard).overrideGuard(PermissionsGuard).useClass(AllowAllGuard).compile();
    const controller = mod.get(SubjectsController);
    await expect(controller.importCsv(null as any)).rejects.toThrow('File CSV wajib diunggah');
  });
});