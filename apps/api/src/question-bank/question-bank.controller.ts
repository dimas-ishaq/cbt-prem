import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query, Request } from '@nestjs/common';
import { QuestionBankService } from './question-bank.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('question-banks')
export class QuestionBankController {
  constructor(private readonly service: QuestionBankService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Permissions('question:bank:view')
  findAll(@Query('teacherId') teacherId?: string, @Query('skip') skip?: number, @Query('take') take?: number) {
    return this.service.findAll(teacherId, skip, take);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('question:bank:view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Permissions('question:bank:create')
  create(@Body() dto: CreateQuestionBankDto, @Request() req) {
    return this.service.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('question:bank:update')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionBankDto, @Request() req) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('question:bank:delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(id, req.user.id);
  }
}