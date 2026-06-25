import { Test, TestingModule } from '@nestjs/testing';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';

describe('QuestionBankController', () => {
  let controller: QuestionBankController;
  const mockService = {
    findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionBankController],
      providers: [{ provide: QuestionBankService, useValue: mockService }],
    }).compile();
    controller = module.get(QuestionBankController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('findAll should delegate', () => {
    controller.findAll('t1', 0, 10);
    expect(mockService.findAll).toHaveBeenCalledWith('t1', 0, 10);
  });

  it('findOne should delegate', () => {
    controller.findOne('qb1');
    expect(mockService.findOne).toHaveBeenCalledWith('qb1');
  });

  it('create should delegate with user id', () => {
    controller.create({ name: 'Bank' } as any, { user: { id: 't1' } });
    expect(mockService.create).toHaveBeenCalledWith({ name: 'Bank' }, 't1');
  });

  it('update should delegate', () => {
    controller.update('qb1', { name: 'Updated' } as any, { user: { id: 't1' } });
    expect(mockService.update).toHaveBeenCalledWith('qb1', { name: 'Updated' }, 't1');
  });

  it('remove should delegate', () => {
    controller.remove('qb1', { user: { id: 't1' } });
    expect(mockService.remove).toHaveBeenCalledWith('qb1', 't1');
  });
});