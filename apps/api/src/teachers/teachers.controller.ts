import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  findAll() {
    return this.teachersService.findAll();
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
