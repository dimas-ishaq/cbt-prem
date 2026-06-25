import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsImportService } from './questions-import.service';
import { QuestionsTemplateService } from './questions-template.service';
import { SecurityUtil } from '../utils/security.util';

describe('QuestionsController', () => {
  let controller: QuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        { provide: QuestionsService, useValue: {} },
        { provide: QuestionsImportService, useValue: {} },
        { provide: QuestionsTemplateService, useValue: {} },
        { provide: SecurityUtil, useValue: { checkRateLimit: jest.fn().mockReturnValue(true), validateMagicBytes: jest.fn().mockReturnValue(true) } },
      ],
    }).compile();

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});