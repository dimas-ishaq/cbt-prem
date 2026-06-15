import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH, Role.GURU)
  findAll(
    @Query('majorId') majorId?: string,
    @Query('rombelId') rombelId?: string,
    @Query('grade') grade?: string,
  ) {
    return this.studentsService.findAll(majorId, rombelId, grade);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH, Role.GURU)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH)
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
