import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Request,
  Patch,
  Res,
  Delete,
  Headers,
  Query,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import * as express from 'express';
import { ExamSessionsService } from './exam-sessions.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import { UnlockSessionDto } from './dto/unlock-session.dto';
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
  async start(
    @Body() dto: StartSessionDto,
    @Request() req,
    @Headers('user-agent') userAgent: string,
    @Headers('x-seb-config-key') sebConfigKey: string,
    @Headers('x-seb-browser-key') sebBrowserKey: string,
  ) {
    return this.examSessionsService.startSession(
      dto,
      req.user.userId,
      userAgent,
      sebConfigKey,
      sebBrowserKey,
    );
  }

  @Get('active/:examId')
  @Roles(Role.SISWA)
  async getActiveSession(@Param('examId') examId: string, @Request() req) {
    return this.examSessionsService.getActiveSessionByExam(
      examId,
      req.user.userId,
    );
  }

  @Post(':id/submit-answer')
  @Roles(Role.SISWA)
  async submitAnswer(@Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    return this.examSessionsService.submitAnswer(id, dto);
  }

  @Post(':id/finish')
  @Roles(Role.SISWA)
  async finish(@Param('id') id: string) {
    return this.examSessionsService.finishSession(id);
  }

  @Post('unlock')
  @Roles(Role.SISWA)
  async unlock(@Body() dto: UnlockSessionDto) {
    return this.examSessionsService.unlockWithToken(dto.sessionId, dto.token);
  }

  @Get(':id/lock-info')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async getLockInfo(@Param('id') id: string) {
    return this.examSessionsService.getLockInfo();
  }

  @Post(':id/refresh-lock-token')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async refreshLockToken(@Param('id') id: string) {
    return this.examSessionsService.generateLockToken();
  }

  @Post('exam/:examId/refresh-lock-token')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async refreshGlobalLockToken(@Param('examId') examId: string) {
    return this.examSessionsService.generateLockToken();
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
  async getExamSessions(
    @Param('examId') examId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('rombelId') rombelId?: string,
  ) {
    return this.examSessionsService.getExamSessions(
      examId,
      page,
      limit,
      search,
      status,
      rombelId,
    );
  }

  @Get('exam/:examId/essay-answers')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async getEssayAnswers(@Param('examId') examId: string) {
    return this.examSessionsService.getEssayAnswersByExam(examId);
  }

  @Post('exam/:examId/essay-answers/:answerId/grade')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async gradeEssayAnswer(
    @Param('examId') examId: string,
    @Param('answerId') answerId: string,
    @Body() dto: GradeAnswerDto,
  ) {
    return this.examSessionsService.gradeEssayAnswer(answerId, dto);
  }

  @Get('exam/:examId/export')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async exportResults(
    @Param('examId') examId: string,
    @Res() res: express.Response,
  ) {
    const buffer = await this.examSessionsService.exportToExcel(examId);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="results-${examId}.xlsx"`,
      'Content-Length': (buffer as any).length,
    });

    res.end(buffer);
  }

  @Get(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async getSession(@Param('id') id: string) {
    return this.examSessionsService.getSession(id);
  }

  @Get('me/:id')
  @Roles(Role.SISWA)
  async getMySession(@Param('id') id: string, @Request() req) {
    return this.examSessionsService.getMySession(id, req.user.userId);
  }

  @Delete(':id/reset')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async resetSession(@Param('id') id: string) {
    return this.examSessionsService.resetSession(id);
  }

  @Get('monitoring/history')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async getMonitoringHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.examSessionsService.getMonitoringHistory(startDate, endDate);
  }

  @Get('monitoring/upcoming')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async getUpcomingMonitoring(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.examSessionsService.getUpcomingMonitoring(startDate, endDate);
  }
}
