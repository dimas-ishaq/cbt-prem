import { Controller, Post, Put, Body, UnauthorizedException, UseGuards, Get, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuditService } from '../audit/audit.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

const isValidImageBuffer = (file: Express.Multer.File) => {
  const buf = file.buffer;
  if (file.mimetype === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;
  if (file.mimetype === 'image/png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === 'image/webp') return buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private auditService: AuditService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: any, @Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers?.['user-agent'];
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      await this.auditService.write({ action: 'LOGIN_FAILED', resource: 'Auth', ip, userAgent });
      throw new UnauthorizedException('Kredensial tidak valid');
    }
    const result = await this.authService.login(user);
    await this.auditService.write({ userId: user.id, action: 'LOGIN_SUCCESS', resource: 'Auth', ip, userAgent });
    return result;
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req, @Body() body: any) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File foto wajib diupload');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Hanya format JPEG, PNG, atau WebP yang diizinkan');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Ukuran foto maksimal 2 MB');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExt.includes(ext)) {
      throw new BadRequestException('Ekstensi file foto tidak valid');
    }

    if (!isValidImageBuffer(file)) {
      throw new BadRequestException('Isi file foto tidak valid');
    }
    const filename = `user-${req.user.userId}${ext}`;
    const destDir = path.join(process.cwd(), 'uploads', 'photos');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    for (const oldExt of allowedExt) {
      const oldPath = path.join(destDir, `user-${req.user.userId}${oldExt}`);
      if (oldPath !== path.join(destDir, filename) && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newPath = path.join(destDir, filename);
    fs.writeFileSync(newPath, file.buffer);

    const photoUrl = `/api/uploads/photos/${filename}`;
    await this.authService.updateProfile(req.user.userId, { photo: photoUrl });

    return { photoUrl };
  }
}
