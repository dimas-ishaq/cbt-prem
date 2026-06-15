import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExamGroupsService } from './exam-groups.service';
import { CreateExamGroupDto } from './dto/create-exam-group.dto';
import { UpdateExamGroupDto } from './dto/update-exam-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('exam-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamGroupsController {
  constructor(private readonly examGroupsService: ExamGroupsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.GURU)
  create(@Body() createExamGroupDto: CreateExamGroupDto) {
    return this.examGroupsService.create(createExamGroupDto);
  }

  @Get()
  findAll() {
    return this.examGroupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.examGroupsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.GURU)
  update(@Param('id') id: string, @Body() updateExamGroupDto: UpdateExamGroupDto) {
    return this.examGroupsService.update(id, updateExamGroupDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.examGroupsService.remove(id);
  }
}
