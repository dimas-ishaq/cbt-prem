import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @Permissions('subjects:view')
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  @Permissions('subjects:view')
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @Permissions('subjects:create')
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }

  @Put(':id')
  @Permissions('subjects:update')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('subjects:delete')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
