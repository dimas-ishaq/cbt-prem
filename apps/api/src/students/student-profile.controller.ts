import {
  Controller,
  Put,
  Get,
  UseGuards,
  Req,
  UploadedFile,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Controller('students/profile')
@UseGuards(JwtAuthGuard)
export class StudentProfileController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me')
  @Roles(Role.SISWA)
  async myProfile(@Req() req: any) {
    return this.studentsService.getMyProfile(req.user.userId);
  }

  @Put('photo')
  @Roles(Role.SISWA)
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
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
    const filename = `${req.user.userId}${ext}`;
    const destDir = path.join(process.cwd(), 'uploads', 'photos');

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const newPath = path.join(destDir, filename);
    fs.writeFileSync(newPath, file.buffer);

    const photoUrl = `/uploads/photos/${filename}`;
    await this.studentsService.updatePhoto(req.user.userId, photoUrl);

    return { photoUrl };
  }
}
