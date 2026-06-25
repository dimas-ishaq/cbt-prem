import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Res, Query } from '@nestjs/common';
import { RombelsService } from './rombels.service';
import { CreateRombelDto } from './dto/create-rombel.dto';
import { UpdateRombelDto } from './dto/update-rombel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('rombels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RombelsController {
  constructor(private readonly rombelsService: RombelsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  create(@Body() createRombelDto: CreateRombelDto) {
    return this.rombelsService.create(createRombelDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH, Role.GURU, Role.PENGAWAS)
  findAll(@Query() pagination: PaginationDto) {
    return this.rombelsService.findAll(pagination.skip, pagination.take);
  }

  @Get('template/download')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.rombelsService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="template-import-rombel.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('import')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  @UseInterceptors(FileInterceptor('file'))
  async importRombels(@UploadedFile() file: any) {
    return this.rombelsService.importRombels(file.buffer);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH, Role.GURU, Role.PENGAWAS)
  findOne(@Param('id') id: string) {
    return this.rombelsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  update(@Param('id') id: string, @Body() updateRombelDto: UpdateRombelDto) {
    return this.rombelsService.update(id, updateRombelDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  remove(@Param('id') id: string) {
    return this.rombelsService.remove(id);
  }

  @Post(':id/students')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  updateStudents(
    @Param('id') id: string,
    @Body('studentIds') studentIds: string[]
  ) {
    return this.rombelsService.updateStudents(id, studentIds);
  }

  @Get(':id/exam-cards')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH, Role.GURU)
  getExamCards(@Param('id') id: string) {
    return this.rombelsService.getExamCardsData(id);
  }
}
