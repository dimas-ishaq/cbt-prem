import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MajorsService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('majors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MajorsController {
  constructor(private readonly majorsService: MajorsService) {}

  @Get()
  @Permissions('majors:view')
  findAll(@Query() pagination: PaginationDto) {
    return this.majorsService.findAll(pagination.skip, pagination.take);
  }

  @Get(':id')
  @Permissions('majors:view')
  findOne(@Param('id') id: string) {
    return this.majorsService.findOne(id);
  }

  @Post()
  @Permissions('majors:create')
  create(@Body() dto: CreateMajorDto) {
    return this.majorsService.create(dto);
  }

  @Put(':id')
  @Permissions('majors:update')
  update(@Param('id') id: string, @Body() dto: UpdateMajorDto) {
    return this.majorsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('majors:delete')
  remove(@Param('id') id: string) {
    return this.majorsService.remove(id);
  }
}
