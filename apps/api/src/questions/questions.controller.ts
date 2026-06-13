import { Controller, Post, Body, Delete, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsImportService } from './questions-import.service';

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly importService: QuestionsImportService,
  ) {}

  @Post()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Post('import/:bankId')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  importQuestions(
    @Param('bankId') bankId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.importService.importFromDocx(bankId, file);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
