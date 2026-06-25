import { Test, TestingModule } from '@nestjs/testing';
import { MajorsController } from './majors.controller';
import { MajorsService } from './majors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class MockGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

@Injectable()
class MockPermissionsGuard extends MockGuard {}

const majorsServiceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('MajorsController', () => {
  let controller: MajorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MajorsController],
      providers: [{ provide: MajorsService, useValue: majorsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockGuard)
      .overrideGuard(PermissionsGuard)
      .useClass(MockPermissionsGuard)
      .compile();

    controller = module.get<MajorsController>(MajorsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service with pagination', async () => {
      majorsServiceMock.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await controller.findAll({ skip: 0, take: 10 });
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('should return major detail', async () => {
      majorsServiceMock.findOne.mockResolvedValue({ id: 'm1', name: 'IPA' });
      const result = await controller.findOne('m1');
      expect(result.name).toBe('IPA');
    });
  });

  describe('create', () => {
    it('should create major', async () => {
      majorsServiceMock.create.mockResolvedValue({ id: 'm2', name: 'IPS', code: 'IPS' });

      const dto = { name: 'IPS', code: 'IPS' };
      const result = await controller.create(dto as any);
      expect(result).toEqual({ id: 'm2', name: 'IPS', code: 'IPS' });
    });
  });

  describe('update', () => {
    it('should update major', async () => {
      majorsServiceMock.update.mockResolvedValue({ id: 'm1', name: 'IPA Updated' });

      const result = await controller.update('m1', { name: 'IPA Updated' } as any);
      expect(majorsServiceMock.update).toHaveBeenCalledWith('m1', { name: 'IPA Updated' });
    });
  });

  describe('remove', () => {
    it('should delete major', async () => {
      majorsServiceMock.remove.mockResolvedValue({ success: true, message: 'Jurusan berhasil dihapus' });

      const result = await controller.remove('m1');
      expect(result.success).toBe(true);
    });
  });
});