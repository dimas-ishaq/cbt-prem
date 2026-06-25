import { Test, TestingModule } from '@nestjs/testing';
import { RombelsController } from './rombels.controller';
import { RombelsService } from './rombels.service';

describe('RombelsController', () => {
  let controller: RombelsController;
  const mockService = {
    create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(),
    update: jest.fn(), remove: jest.fn(), updateStudents: jest.fn(),
    generateTemplate: jest.fn(), importRombels: jest.fn(), getExamCardsData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RombelsController],
      providers: [{ provide: RombelsService, useValue: mockService }],
    }).compile();
    controller = module.get(RombelsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('create should delegate', () => {
    controller.create({ name: 'X RPL 1' } as any);
    expect(mockService.create).toHaveBeenCalled();
  });

  it('findAll should delegate with pagination', () => {
    controller.findAll({ skip: 0, take: 10 } as any);
    expect(mockService.findAll).toHaveBeenCalledWith(0, 10);
  });

  it('findOne should delegate', () => {
    controller.findOne('r1');
    expect(mockService.findOne).toHaveBeenCalledWith('r1');
  });

  it('update should delegate', () => {
    controller.update('r1', { name: 'Updated' } as any);
    expect(mockService.update).toHaveBeenCalledWith('r1', { name: 'Updated' });
  });

  it('remove should delegate', () => {
    controller.remove('r1');
    expect(mockService.remove).toHaveBeenCalledWith('r1');
  });

  it('updateStudents should delegate', () => {
    controller.updateStudents('r1', ['s1']);
    expect(mockService.updateStudents).toHaveBeenCalledWith('r1', ['s1']);
  });

  it('getExamCards should delegate', () => {
    controller.getExamCards('r1');
    expect(mockService.getExamCardsData).toHaveBeenCalledWith('r1');
  });
});
