import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RombelsService } from './rombels.service';
import { CreateRombelDto } from './dto/create-rombel.dto';
import { UpdateRombelDto } from './dto/update-rombel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('rombels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RombelsController {
  constructor(private readonly rombelsService: RombelsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN_SEKOLAH')
  create(@Body() createRombelDto: CreateRombelDto) {
    return this.rombelsService.create(createRombelDto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU', 'PENGAWAS')
  findAll() {
    return this.rombelsService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU', 'PENGAWAS')
  findOne(@Param('id') id: string) {
    return this.rombelsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_SEKOLAH')
  update(@Param('id') id: string, @Body() updateRombelDto: UpdateRombelDto) {
    return this.rombelsService.update(id, updateRombelDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_SEKOLAH')
  remove(@Param('id') id: string) {
    return this.rombelsService.remove(id);
  }

  @Post(':id/students')
  @Roles('SUPER_ADMIN', 'ADMIN_SEKOLAH')
  updateStudents(
    @Param('id') id: string,
    @Body('studentIds') studentIds: string[]
  ) {
    return this.rombelsService.updateStudents(id, studentIds);
  }
}
