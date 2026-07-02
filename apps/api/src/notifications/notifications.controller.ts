import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, NotificationTargetType } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN_SEKOLAH, Role.GURU)
  @ApiOperation({ summary: 'Buat notifikasi baru' })
  @ApiResponse({ status: 201, description: 'Notifikasi berhasil dibuat' })
  async create(@Body() dto: CreateNotificationDto, @Request() req) {
    return this.notificationsService.create(dto, req.user.userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Ambil daftar notifikasi saya' })
  @ApiResponse({ status: 200, description: 'Daftar notifikasi' })
  async findMe(@Request() req) {
    return this.notificationsService.findByUser(req.user.userId);
  }

  @Get('me/count')
  @ApiOperation({ summary: 'Hitung notifikasi belum dibaca' })
  async countUnread(@Request() req) {
    return { count: await this.notificationsService.findUnreadCount(req.user.userId) };
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Tandai semua notifikasi sudah dibaca' })
  async markAllRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu notifikasi sudah dibaca' })
  async markRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markRead(id, req.user.userId);
  }

  @Get('settings')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ambil pengaturan retensi notifikasi' })
  async getRetentionSettings() {
    return this.notificationsService.getNotificationRetentionSettings();
  }

  @Post('settings')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update pengaturan retensi notifikasi' })
  async updateRetentionSettings(@Body() dto: { notificationRetentionDays: number }) {
    return this.notificationsService.updateNotificationRetentionSettings(dto);
  }
}
