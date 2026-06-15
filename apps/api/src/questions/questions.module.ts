import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { QuestionsImportService } from './questions-import.service';
import { QuestionsTemplateService } from './questions-template.service';
import { SecurityUtil } from '../utils/security.util';

@Module({
  providers: [QuestionsService, QuestionsImportService, QuestionsTemplateService, SecurityUtil],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
