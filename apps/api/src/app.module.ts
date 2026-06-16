import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { QuestionsModule } from './questions/questions.module';
import { ExamsModule } from './exams/exams.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ExamSessionsModule } from './exam-sessions/exam-sessions.module';
import { SettingsModule } from './settings/settings.module';
import { RolesModule } from './roles/roles.module';
import { MajorsModule } from './majors/majors.module';
import { ExamGroupsModule } from './exam-groups/exam-groups.module';
import { RombelsModule } from './rombels/rombels.module';
import { LoggerModule } from './common/logger/logger.module';
import { LogsModule } from './logs/logs.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MulterModule.registerAsync({
      useFactory: () => ({
        dest: 'uploads/tmp',
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (_: any, file: any, cb: any) => {
          const allowed = ['image/jpeg', 'image/png', 'image/webp'];
          cb(null, allowed.includes(file.mimetype));
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    QuestionBankModule,
    QuestionsModule,
    ExamsModule,
    RealtimeModule,
    ExamSessionsModule,
    SettingsModule,
    RolesModule,
    MajorsModule,
    ExamGroupsModule,
    RombelsModule,
    LoggerModule,
    LogsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
