import { Test } from '@nestjs/testing';
import { MajorsController } from './majors.controller';
import { MajorsService } from './majors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
class AllowAllGuard implements CanActivate {
  canActivate(_c: ExecutionContext) {
    return true;
  }
}

describe('MajorsController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  it('findOne delegates', async () => {
    service.findOne.mockResolvedValue({ id: 'm1' });
    const mod = await Test.createTestingModule({
      controllers: [MajorsController],
      providers: [{ provide: MajorsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(AllowAllGuard)
      .overrideGuard(PermissionsGuard)
      .useClass(AllowAllGuard)
      .compile();
    const controller = mod.get(MajorsController);
    await expect(controller.findOne('m1')).resolves.toEqual({ id: 'm1' });
  });
});
