import { Test, TestingModule } from '@nestjs/testing';
import { ExamGroupsController } from './exam-groups.controller';
import { ExamGroupsService } from './exam-groups.service';

describe('ExamGroupsController', () => {
  let controller: ExamGroupsController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamGroupsController],
      providers: [{ provide: ExamGroupsService, useValue: mockService }],
    }).compile();
    controller = module.get(ExamGroupsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('create should delegate', () => {
    mockService.create.mockResolvedValue({ id: 'g1' });
    controller.create({ name: 'UTS' });
    expect(mockService.create).toHaveBeenCalledWith({ name: 'UTS' });
  });

  it('findAll should delegate with pagination', () => {
    mockService.findAll.mockResolvedValue({ data: [], total: 0 });
    controller.findAll({ skip: 0, take: 10 });
    expect(mockService.findAll).toHaveBeenCalledWith(0, 10);
  });

  it('findOne should delegate', () => {
    controller.findOne('g1');
    expect(mockService.findOne).toHaveBeenCalledWith('g1');
  });

  it('update should delegate', () => {
    controller.update('g1', { name: 'Updated' });
    expect(mockService.update).toHaveBeenCalledWith('g1', { name: 'Updated' });
  });

  it('remove should delegate', () => {
    controller.remove('g1');
    expect(mockService.remove).toHaveBeenCalledWith('g1');
  });
});
