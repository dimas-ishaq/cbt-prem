import { Controller, Post, Put, Body, UnauthorizedException, UseGuards, Get, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
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
    const filename = `user-${req.user.userId}${ext}`;
    const destDir = path.join(process.cwd(), 'uploads', 'photos');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const newPath = path.join(destDir, filename);
    fs.writeFileSync(newPath, file.buffer);

    const photoUrl = `/uploads/photos/${filename}`;
    await this.authService.updateProfile(req.user.userId, { photo: photoUrl });

    return { photoUrl };
  }
}
