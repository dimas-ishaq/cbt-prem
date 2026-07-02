import { Controller, UseGuards, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GURU, Role.SUPER_ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getReports() {
    return this.reportsService.getAllReports();
  }

  @Get('recommendations')
  getRecommendations() {
    return this.reportsService.getAllReports();
  }

  @Get('student-master')
  exportStudentMaster(@Res() res: Response) {
    return this.reportsService.exportStudentMasterToExcel(res);
  }

  @Get('achievement')
  exportAchievement(@Res() res: Response) {
    return this.reportsService.exportAchievementToExcel(res);
  }

  @Get('violations')
  exportViolations(@Res() res: Response) {
    return this.reportsService.exportViolationsToExcel(res);
  }

  @Get('user-audit')
  exportUserAudit(@Res() res: Response) {
    return this.reportsService.exportUserAuditToExcel(res);
  }

  @Get('subscription')
  exportSubscription(@Res() res: Response) {
    return this.reportsService.exportSubscriptionToExcel(res);
  }

  @Get('revenue')
  exportRevenue(@Res() res: Response) {
    return this.reportsService.exportRevenueToExcel(res);
  }
}
