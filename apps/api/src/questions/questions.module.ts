import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { QuestionsImportService } from './questions-import.service';

@Module({
  providers: [QuestionsService, QuestionsImportService],
  controllers: [QuestionsController]
})
export class QuestionsModule {}
