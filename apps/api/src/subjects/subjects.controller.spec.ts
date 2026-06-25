import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('SubjectsController', () => {
  let controller: SubjectsController;
  const mockService = {
    findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(),
    importFromCsv: jest.fn(), update: jest.fn(), remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubjectsController],
      providers: [{ provide: SubjectsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(SubjectsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('findAll should delegate', () => {
    controller.findAll({ skip: 0, take: 10 } as any);
    expect(mockService.findAll).toHaveBeenCalledWith(0, 10);
  });

  it('findOne should delegate', () => {
    controller.findOne('s1');
    expect(mockService.findOne).toHaveBeenCalledWith('s1');
  });

  it('create should delegate', () => {
    controller.create({ name: 'Math', code: 'MTK' } as any);
    expect(mockService.create).toHaveBeenCalled();
  });

  it('update should delegate', () => {
    controller.update('s1', { name: 'Updated' } as any);
    expect(mockService.update).toHaveBeenCalledWith('s1', { name: 'Updated' });
  });

  it('remove should delegate', () => {
    controller.remove('s1');
    expect(mockService.remove).toHaveBeenCalledWith('s1');
  });
});
