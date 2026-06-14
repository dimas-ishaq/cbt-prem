import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SubjectsModule } from './subjects/subjects.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ExamSessionsModule } from './exam-sessions/exam-sessions.module';
import { SettingsModule } from './settings/settings.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    SubjectsModule,
    QuestionBankModule,
    QuestionsModule,
    ExamsModule,
    RealtimeModule,
    ExamSessionsModule,
    SettingsModule,
    RolesModule,
  ],
})
export class AppModule {}
