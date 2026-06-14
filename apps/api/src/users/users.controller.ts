import { Controller, Get, Post, Body, UseGuards, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { Response } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('export')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async export(@Res() res: Response) {
    const csv = await this.usersService.exportAllUsers();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    return res.status(200).send(csv);
  }

  @Post('import')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async import(@Body('users') users: any[]) {
    return this.usersService.importUsers(users);
  }
}
