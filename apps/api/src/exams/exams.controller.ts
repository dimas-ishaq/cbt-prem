import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateExamDto, @Request() req) {
    const teacher = await this.examsService['prisma'].teacher.findUnique({
      where: { userId: req.user.userId }
    });
    if (!teacher) {
      throw new UnauthorizedException('User is not a teacher');
    }
    return this.examsService.create(dto, teacher.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.examsService.findAll(req.user);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-seb-config-key') sebConfigKey: string,
    @Headers('x-seb-browser-key') sebBrowserKey: string,
    @Request() req
  ) {
    const isValidSeb = await this.examsService.validateSeb(id, sebConfigKey, sebBrowserKey);
    if (!isValidSeb) {
      throw new UnauthorizedException('Safe Exam Browser required');
    }
    return this.examsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }
}
