import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('files')
  getFiles() {
    return this.logsService.getLogFiles();
  }

  @Get('content')
  getContent(@Query('file') file: string) {
    return {
      content: this.logsService.getLogFileContent(file),
    };
  }

  @Get('settings')
  getSettings() {
    return this.logsService.getSettings();
  }

  @Post('settings')
  updateSettings(@Body() dto: { logRetentionDays: number }) {
    return this.logsService.updateSettings(dto);
  }

  @Delete(':filename')
  deleteFile(@Param('filename') filename: string) {
    this.logsService.deleteLogFile(filename);
    return { success: true };
  }

  @Post(':filename/clear')
  clearFile(@Param('filename') filename: string) {
    this.logsService.clearLogFile(filename);
    return { success: true };
  }
}
