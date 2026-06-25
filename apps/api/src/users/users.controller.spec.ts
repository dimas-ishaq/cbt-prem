import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const mockService = {
    findAll: jest.fn(), findUserById: jest.fn(), createUser: jest.fn(),
    updateUser: jest.fn(), toggleActive: jest.fn(), resetPassword: jest.fn(),
    deleteUser: jest.fn(), exportAllUsers: jest.fn(), importUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();
    controller = module.get(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('findAll should delegate with role filter', () => {
    controller.findAll({ skip: 0, take: 10 } as any, 'GURU' as any);
    expect(mockService.findAll).toHaveBeenCalledWith('GURU', 0, 10);
  });

  it('findOne should delegate', () => {
    controller.findOne('u1');
    expect(mockService.findUserById).toHaveBeenCalledWith('u1');
  });

  it('create should delegate', () => {
    controller.create({ username: 'admin' } as any);
    expect(mockService.createUser).toHaveBeenCalled();
  });

  it('update should delegate', () => {
    controller.update('u1', { fullName: 'New' } as any);
    expect(mockService.updateUser).toHaveBeenCalledWith('u1', { fullName: 'New' });
  });

  it('toggleActive should delegate', () => {
    controller.toggleActive('u1');
    expect(mockService.toggleActive).toHaveBeenCalledWith('u1');
  });

  it('resetPassword should delegate', () => {
    controller.resetPassword('u1', { newPassword: '123' } as any);
    expect(mockService.resetPassword).toHaveBeenCalledWith('u1', { newPassword: '123' });
  });

  it('remove should delegate', () => {
    controller.remove('u1');
    expect(mockService.deleteUser).toHaveBeenCalledWith('u1');
  });

  it('import should delegate', async () => {
    mockService.importUsers.mockResolvedValue({});
    await controller.import([{ username: 'test' }]);
    expect(mockService.importUsers).toHaveBeenCalledWith([{ username: 'test' }]);
  });
});