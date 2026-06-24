import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Headers, UnauthorizedException, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExamsService } from './exams.service';
import { PaginationDto } from '../common/dto/pagination.dto';
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
  async findAll(@Request() req, @Query() pagination: PaginationDto) {
    const { skip, take } = pagination;
    return this.examsService.findAll(req.user, skip, take);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-seb-config-key') sebConfigKey: string,
    @Headers('x-seb-browser-key') sebBrowserKey: string,
    @Headers('user-agent') userAgent: string,
    @Request() req
  ) {
    const isSiswa = req.user?.role === Role.SISWA;
    if (isSiswa) {
      const isValidSeb = await this.examsService.validateSeb(id, userAgent, sebConfigKey, sebBrowserKey);
      if (!isValidSeb) {
        throw new UnauthorizedException('Safe Exam Browser diperlukan untuk mengerjakan ujian ini.');
      }
    }
    return this.examsService.findOne(id, req.user);
  }

  @Get(':id/analytics')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  analytics(@Param('id') id: string) {
    return this.examsService.analytics(id);
  }

  @Get(':id/analytics/pdf')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.examsService.generatePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=hasil-ujian-${id}.pdf`);
    res.send(pdfBuffer);
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
