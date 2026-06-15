import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('question-banks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionBankController {
  constructor(private readonly questionBankService: QuestionBankService) {}

  @Post()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateQuestionBankDto, @Request() req) {
    // Note: In real app, we need to map req.user.userId to teacher.id
    const teacher = await this.questionBankService['prisma'].teacher.findUnique({
      where: { userId: req.user.userId }
    });
    if (!teacher) {
      throw new UnauthorizedException('User is not a teacher');
    }
    return this.questionBankService.create(dto, teacher.id);
  }

  @Get()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  findAll(@Request() req) {
    if (req.user.role === Role.GURU) {
      // Logic to find teacher.id first or use userId if indexed
      return this.questionBankService.findAll(); // Simplified for now
    }
    return this.questionBankService.findAll();
  }

  @Get(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.questionBankService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateQuestionBankDto) {
    return this.questionBankService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.questionBankService.remove(id);
  }
}
