import { Test } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsImportService } from './questions-import.service';
import { QuestionsTemplateService } from './questions-template.service';
import { SecurityUtil } from '../utils/security.util';

describe('QuestionsController', () => {
  const service = {
    create: jest.fn(),
    findByBank: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    removeBank: jest.fn(),
  };
  const importService = {
    previewFromDocx: jest.fn(),
    importFromDocx: jest.fn(),
  };
  const templateService = { generateTemplate: jest.fn() };
  const security = { checkRateLimit: jest.fn(), validateMagicBytes: jest.fn() };

  it('create delegates', async () => {
    service.create.mockResolvedValue({ id: 'q1' });
    const mod = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        { provide: QuestionsService, useValue: service },
        { provide: QuestionsImportService, useValue: importService },
        { provide: QuestionsTemplateService, useValue: templateService },
        { provide: SecurityUtil, useValue: security },
      ],
    }).compile();
    const controller = mod.get(QuestionsController);
    await expect(
      controller.create({} as any, { user: { userId: 'u1' } } as any),
    ).resolves.toEqual({ id: 'q1' });
  });
});
