import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { Response } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users?role=GURU — list all users (super admin only) */
  @Get()
  @Roles(Role.SUPER_ADMIN)
  findAll(@Query() pagination: PaginationDto, @Query('role') role?: Role) {
    return this.usersService.findAll(role, pagination.skip, pagination.take);
  }

  /** GET /users/:id — single user detail */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  /** POST /users — create new user */
  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  /** PUT /users/:id — update profile */
  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  /** PATCH /users/:id/toggle-active — activate / deactivate */
  @Patch(':id/toggle-active')
  @Roles(Role.SUPER_ADMIN)
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  /** PATCH /users/:id/reset-password — admin reset password */
  @Patch(':id/reset-password')
  @Roles(Role.SUPER_ADMIN)
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  /** DELETE /users/:id — delete user */
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  /** GET /users/export — CSV export */
  @Get('export')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async export(@Res() res: Response) {
    const csv = await this.usersService.exportAllUsers();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    return res.status(200).send(csv);
  }

  /** POST /users/import — CSV import */
  @Post('import')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async import(@Body('users') users: any[]) {
    return this.usersService.importUsers(users);
  }
}
