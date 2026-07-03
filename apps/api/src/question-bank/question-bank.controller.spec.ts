import { Test } from '@nestjs/testing';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';

describe('QuestionBankController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  it('findAll delegates', async () => {
    service.findAll.mockResolvedValue({ data: [], total: 0 });
    const mod = await Test.createTestingModule({
      controllers: [QuestionBankController],
      providers: [{ provide: QuestionBankService, useValue: service }],
    }).compile();
    const controller = mod.get(QuestionBankController);
    await expect(
      controller.findAll(undefined, undefined, undefined),
    ).resolves.toEqual({ data: [], total: 0 });
  });
});
