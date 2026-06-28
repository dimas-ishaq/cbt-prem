import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, BadRequestException, InternalServerErrorException, UploadedFile, UseInterceptors, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import Redis from 'ioredis';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSettings() {
    return this.settingsService.getAll();
  }

  @Get('public')
  async getPublicSettings() {
    const allSettings = await this.settingsService.getAll();
    const { redisHost, redisPort, redisPassword, redisEnabled, ...publicSettings } = allSettings;
    return publicSettings;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async updateSettings(@Body() body: Record<string, string>) {
    return this.settingsService.updateMany(body);
  }

  @Post('favicon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File favicon wajib diupload');
    const allowedMimes = ['image/x-icon', 'image/png', 'image/svg+xml'];
    const allowedExt = ['.ico', '.png', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedMimes.includes(file.mimetype) || !allowedExt.includes(ext)) {
      throw new BadRequestException('Favicon harus .ico, .png, atau .svg');
    }
    if (file.size > 256 * 1024) throw new BadRequestException('Ukuran favicon maksimal 256 KB');
    const destDir = path.join(process.cwd(), 'uploads', 'settings');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const filename = `favicon${ext}`;
    fs.writeFileSync(path.join(destDir, filename), file.buffer);
    const faviconUrl = `/uploads/settings/${filename}`;
    await this.settingsService.update('faviconUrl', faviconUrl);
    return { faviconUrl };
  }

  @Post('redis/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async syncRedis(@Body() body: { host: string; port: number; password?: string }) {
    const { host, port, password } = body;
    const tempRedis = new Redis({ host, port, password, connectTimeout: 3000, retryStrategy: () => null });
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
        tempRedis.on('connect', () => clearTimeout(timeout));
        tempRedis.on('error', (err) => { clearTimeout(timeout); reject(err); });
        tempRedis.on('ready', () => resolve());
      });
      await this.settingsService.update('redisEnabled', 'true');
      await this.settingsService.update('redisHost', host);
      await this.settingsService.update('redisPort', String(port));
      if (password) await this.settingsService.update('redisPassword', password);
      return { success: true, message: 'Redis connection successful' };
    } catch (err: any) {
      throw new InternalServerErrorException(err?.message || 'Redis connection failed');
    } finally {
      tempRedis.disconnect();
    }
  }
}
