import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.GURU, Role.SUPER_ADMIN)
export class ReportsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('recommendations')
  getRecommendations() {
    return this.recommendationsService.getAllRecommendations();
  }
}
