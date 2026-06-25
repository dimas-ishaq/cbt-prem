import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('RolesController', () => {
  let controller: RolesController;
  const mockService = {
    findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(),
    update: jest.fn(), clone: jest.fn(), remove: jest.fn(),
    getAuditLogs: jest.fn(), getPermissionsMatrix: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(RolesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('findAll should delegate', () => {
    controller.findAll({ skip: 0, take: 10 } as any);
    expect(mockService.findAll).toHaveBeenCalledWith(0, 10);
  });

  it('findOne should delegate', () => {
    controller.findOne('r1');
    expect(mockService.findOne).toHaveBeenCalledWith('r1');
  });

  it('create should delegate with actorId', () => {
    controller.create({ name: 'Editor' } as any, { user: { userId: 'u1' } });
    expect(mockService.create).toHaveBeenCalledWith({ name: 'Editor' }, 'u1');
  });

  it('update should delegate', () => {
    controller.update('r1', { name: 'New' } as any, { user: { userId: 'u1' } });
    expect(mockService.update).toHaveBeenCalledWith('r1', { name: 'New' }, 'u1');
  });

  it('clone should delegate', () => {
    controller.clone('r1', 'Clone', { user: { userId: 'u1' } });
    expect(mockService.clone).toHaveBeenCalledWith('r1', 'Clone', 'u1');
  });

  it('remove should delegate', () => {
    controller.remove('r1', { user: { userId: 'u1' } });
    expect(mockService.remove).toHaveBeenCalledWith('r1', 'u1');
  });

  it('getAuditLogs should delegate', () => {
    controller.getAuditLogs('r1');
    expect(mockService.getAuditLogs).toHaveBeenCalledWith('r1');
  });

  it('getPermissionsMatrix should delegate', () => {
    controller.getPermissionsMatrix();
    expect(mockService.getPermissionsMatrix).toHaveBeenCalled();
  });
});
