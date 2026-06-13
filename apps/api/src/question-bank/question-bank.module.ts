import { Module } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { QuestionBankController } from './question-bank.controller';

@Module({
  providers: [QuestionBankService],
  controllers: [QuestionBankController]
})
export class QuestionBankModule {}
