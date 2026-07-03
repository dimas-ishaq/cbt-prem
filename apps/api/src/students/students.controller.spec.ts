import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

describe('StudentsController', () => {
  let controller: StudentsController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getMyProfile: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [{ provide: StudentsService, useValue: mockService }],
    }).compile();
    controller = module.get(StudentsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('create should delegate', () => {
    controller.create({ username: 'adi', fullName: 'Adi' } as any);
    expect(mockService.create).toHaveBeenCalled();
  });

  it('findAll should delegate with filters', () => {
    controller.findAll({ skip: 0, take: 10 }, 'm1', 'r1', 'X');
    expect(mockService.findAll).toHaveBeenCalledWith('m1', 'r1', 'X', 0, 10);
  });

  it('myProfile should delegate', async () => {
    mockService.getMyProfile.mockResolvedValue({ id: 's1' });
    await controller.myProfile({ user: { userId: 'u1' } });
    expect(mockService.getMyProfile).toHaveBeenCalledWith('u1');
  });

  it('findOne should delegate', () => {
    controller.findOne('s1');
    expect(mockService.findOne).toHaveBeenCalledWith('s1');
  });

  it('remove should delegate', () => {
    controller.remove('s1');
    expect(mockService.remove).toHaveBeenCalledWith('s1');
  });
});
