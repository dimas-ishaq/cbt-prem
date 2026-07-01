import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ExamAttendanceService } from './exam-attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('exam-attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamAttendanceController {
  constructor(private readonly attendanceService: ExamAttendanceService) {}

  @Post('check-in')
  @Roles(Role.GURU, Role.SUPER_ADMIN, Role.PENGAWAS, Role.ADMIN_SEKOLAH)
  async checkIn(@Body() dto: CheckInDto, @Request() req) {
    return this.attendanceService.checkIn(dto, req.user.userId);
  }

  @Get('exam/:examId')
  @Roles(Role.GURU, Role.SUPER_ADMIN, Role.PENGAWAS, Role.ADMIN_SEKOLAH)
  async getByExam(@Param('examId') examId: string) {
    return this.attendanceService.getAttendanceByExam(examId);
  }

  @Get('exam/:examId/history')
  @Roles(Role.GURU, Role.SUPER_ADMIN, Role.PENGAWAS, Role.ADMIN_SEKOLAH)
  async getHistory(@Param('examId') examId: string) {
    return this.attendanceService.getCheckinHistory(examId);
  }
}
