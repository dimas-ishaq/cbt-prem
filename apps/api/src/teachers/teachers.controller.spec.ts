import { Test, TestingModule } from '@nestjs/testing';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';

describe('TeachersController', () => {
  let controller: TeachersController;
  const mockService = { create: jest.fn(), findAll: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [{ provide: TeachersService, useValue: mockService }],
    }).compile();
    controller = module.get(TeachersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('create should delegate', () => {
    controller.create({ username: 'guru1' } as any);
    expect(mockService.create).toHaveBeenCalled();
  });

  it('findAll should delegate with search', () => {
    controller.findAll({ skip: 0, take: 10 } as any, 'Guru');
    expect(mockService.findAll).toHaveBeenCalledWith('Guru', 0, 10);
  });

  it('remove should delegate', () => {
    controller.remove('t1');
    expect(mockService.remove).toHaveBeenCalledWith('t1');
  });
});