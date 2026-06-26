import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPolicyDto } from './dto/update-policy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notification Policies')
@Controller('notifications/policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationPoliciesController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ambil daftar kebijakan notifikasi untuk semua role' })
  async getPolicies() {
    return this.notificationsService.getNotificationPolicies();
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update kebijakan notifikasi untuk kustom role' })
  async updatePolicy(@Body() dto: UpdateNotificationPolicyDto) {
    return this.notificationsService.updateNotificationPolicy(dto);
  }
}
