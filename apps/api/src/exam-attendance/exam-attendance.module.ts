import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExamAttendanceService } from './exam-attendance.service';
import { ExamAttendanceController } from './exam-attendance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExamAttendanceController],
  providers: [ExamAttendanceService],
  exports: [ExamAttendanceService],
})
export class ExamAttendanceModule {}
