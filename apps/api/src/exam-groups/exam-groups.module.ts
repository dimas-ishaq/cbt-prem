import { Module } from '@nestjs/common';
import { ExamGroupsService } from './exam-groups.service';
import { ExamGroupsController } from './exam-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamGroupsController],
  providers: [ExamGroupsService],
  exports: [ExamGroupsService],
})
export class ExamGroupsModule {}
