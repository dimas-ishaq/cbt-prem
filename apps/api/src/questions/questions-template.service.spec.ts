import { Test } from '@nestjs/testing';
import { QuestionsTemplateService } from './questions-template.service';

describe('QuestionsTemplateService', () => {
  it('generateTemplate returns buffer', async () => {
    const mod = await Test.createTestingModule({ providers: [QuestionsTemplateService] }).compile();
    const service = mod.get(QuestionsTemplateService);
    expect(Buffer.isBuffer(await service.generateTemplate())).toBe(true);
  });
});