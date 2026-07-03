import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { ExamSchedulerService } from './exam-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ExamsService, ExamSchedulerService],
  controllers: [ExamsController],
})
export class ExamsModule {}
