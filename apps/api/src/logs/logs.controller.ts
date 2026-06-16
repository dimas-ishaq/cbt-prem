import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
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
}
