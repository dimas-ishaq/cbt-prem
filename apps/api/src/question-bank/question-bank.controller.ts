import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request, UnauthorizedException, BadRequestException, NotFoundException, Query } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('question-banks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Post()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateQuestionBankDto, @Request() req) {
    let teacherId: string;
    if (req.user.role === Role.SUPER_ADMIN) {
      const firstTeacher = await this.questionBankService['prisma'].teacher.findFirst();
      if (!firstTeacher) {
        throw new BadRequestException('No teachers registered in the system. Please add a teacher first.');
      }
      teacherId = firstTeacher.id;
    } else {
      const teacher = await this.questionBankService['prisma'].teacher.findUnique({
        where: { userId: req.user.userId }
      });
      if (!teacher) {
        throw new UnauthorizedException('User is not a teacher');
      }
      teacherId = teacher.id;
    }
    return this.questionBankService.create(dto, teacherId);
  }

  @Get()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async findAll(@Request() req, @Query() pagination: PaginationDto) {
    const teacher = req.user.role === Role.GURU
      ? await this.questionBankService['prisma'].teacher.findUnique({
          where: { userId: req.user.userId },
        })
      : null;

    return this.questionBankService.findAll(teacher?.id, pagination.skip, pagination.take);
  }

  @Get(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.questionBankService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionBankDto, @Request() req) {
    let teacherId: string;
    if (req.user.role === Role.SUPER_ADMIN) {
      const bank = await this.questionBankService.findOne(id);
      if (!bank) {
        throw new NotFoundException('Question bank not found');
      }
      teacherId = bank.teacherId;
    } else {
      const teacher = await this.questionBankService['prisma'].teacher.findUnique({
        where: { userId: req.user.userId }
      });
      if (!teacher) {
        throw new UnauthorizedException('User is not a teacher');
      }
      teacherId = teacher.id;
    }
    return this.questionBankService.update(id, dto, teacherId);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    let teacherId: string;
    if (req.user.role === Role.SUPER_ADMIN) {
      const bank = await this.questionBankService.findOne(id);
      if (!bank) {
        throw new NotFoundException('Question bank not found');
      }
      teacherId = bank.teacherId;
    } else {
      const teacher = await this.questionBankService['prisma'].teacher.findUnique({
        where: { userId: req.user.userId }
      });
      if (!teacher) {
        throw new UnauthorizedException('User is not a teacher');
      }
      teacherId = teacher.id;
    }
    return this.questionBankService.remove(id, teacherId);
  }
}
