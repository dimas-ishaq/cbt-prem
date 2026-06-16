import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentProfileController } from './student-profile.controller';

@Module({
  providers: [StudentsService],
  controllers: [StudentsController, StudentProfileController],
})
export class StudentsModule {}
