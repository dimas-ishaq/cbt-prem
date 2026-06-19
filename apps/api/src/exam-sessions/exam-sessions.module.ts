import { Module } from '@nestjs/common';
import { ExamSessionsService } from './exam-sessions.service';
import { ExamSessionsController } from './exam-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService],
})
export class ExamSessionsModule {}
