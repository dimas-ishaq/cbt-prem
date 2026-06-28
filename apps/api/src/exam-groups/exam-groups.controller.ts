import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExamGroupsService } from './exam-groups.service';
import { CreateExamGroupDto } from './dto/create-exam-group.dto';
import { UpdateExamGroupDto } from './dto/update-exam-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('exam-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamGroupsController {
  constructor(private readonly examGroupsService: ExamGroupsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() createExamGroupDto: CreateExamGroupDto) {
    return this.examGroupsService.create(createExamGroupDto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.examGroupsService.findAll(pagination.skip, pagination.take);
  }

  @Get(':id/report-ledger')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  getReportLedger(@Param('id') id: string) {
    return this.examGroupsService.getReportLedger(id);
  }

  @Get(':id/export-ledger')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async exportLedger(@Param('id') id: string, @Res() res: Response) {
    return this.examGroupsService.exportLedgerToExcel(id, res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examGroupsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateExamGroupDto: UpdateExamGroupDto) {
    return this.examGroupsService.update(id, updateExamGroupDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.examGroupsService.remove(id);
  }
}
