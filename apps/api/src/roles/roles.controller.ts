import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:view')
  findAll(@Query() pagination: PaginationDto) {
    return this.rolesService.findAll(pagination.skip, pagination.take);
  }

  @Get('permissions')
  @Permissions('roles:view')
  getPermissionsMatrix() {
    return this.rolesService.getPermissionsMatrix();
  }

  @Get(':id')
  @Permissions('roles:view')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Permissions('roles:create')
  create(@Body() dto: CreateRoleDto, @Request() req) {
    return this.rolesService.create(dto, req.user.userId);
  }

  @Put(':id')
  @Permissions('roles:update')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Request() req) {
    return this.rolesService.update(id, dto, req.user.userId);
  }

  @Post(':id/clone')
  @Permissions('roles:create')
  clone(@Param('id') id: string, @Body('name') name: string, @Request() req) {
    return this.rolesService.clone(id, name, req.user.userId);
  }

  @Delete(':id')
  @Permissions('roles:delete')
  remove(@Param('id') id: string, @Request() req) {
    return this.rolesService.remove(id, req.user.userId);
  }

  @Get(':id/audit-logs')
  @Permissions('roles:view')
  getAuditLogs(@Param('id') id: string) {
    return this.rolesService.getAuditLogs(id);
  }
}
