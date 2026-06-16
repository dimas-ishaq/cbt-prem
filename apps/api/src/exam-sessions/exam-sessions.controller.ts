import { Controller, Post, Body, Param, Get, UseGuards, Request, Patch, Res } from '@nestjs/common';
import * as express from 'express';
import { ExamSessionsService } from './exam-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamSessionsController {
  constructor(private readonly examSessionsService: ExamSessionsService) {}

  @Post('start')
  @Roles(Role.SISWA)
  async start(@Body() dto: StartSessionDto, @Request() req) {
    return this.examSessionsService.startSession(dto, req.user.userId);
  }

  @Post(':id/submit-answer')
  @Roles(Role.SISWA)
  async submitAnswer(
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.examSessionsService.submitAnswer(id, dto);
  }

  @Post(':id/finish')
  @Roles(Role.SISWA)
  async finish(@Param('id') id: string) {
    return this.examSessionsService.finishSession(id);
  }

  @Patch('answers/:answerId/grade')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async gradeAnswer(
    @Param('answerId') answerId: string,
    @Body() dto: GradeAnswerDto,
  ) {
    return this.examSessionsService.gradeAnswer(answerId, dto);
  }

  @Get('my-history')
  @Roles(Role.SISWA)
  async myHistory(@Request() req) {
    return this.examSessionsService.getMyHistory(req.user.userId);
  }

  @Get('exam/:examId')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async getExamSessions(@Param('examId') examId: string) {
    return this.examSessionsService.getExamSessions(examId);
  }

  @Get('exam/:examId/export')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async exportResults(
    @Param('examId') examId: string,
    @Res() res: express.Response,
  ) {
    const buffer = await this.examSessionsService.exportToExcel(examId);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="results-${examId}.xlsx"`,
      'Content-Length': (buffer as any).length,
    });

    res.end(buffer);
  }

  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.examSessionsService.getSession(id);
  }
}
