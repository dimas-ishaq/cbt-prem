import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsImportService } from './questions-import.service';
import { QuestionsTemplateService } from './questions-template.service';
import { SecurityUtil } from '../utils/security.util';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { Request } from 'express';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/\.{2,}/g, '');
}

@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly importService: QuestionsImportService,
    private readonly templateService: QuestionsTemplateService,
    private readonly securityUtil: SecurityUtil,
  ) {}

  @Get('template/download')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.templateService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=template-import-soal.docx');
    return res.send(buffer);
  }

  @Post()
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Get('media')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async listMedia(@Res() res: Response) {
    const dir = join(process.cwd(), 'uploads', 'questions');
    try {
      await fs.mkdir(dir, { recursive: true });
      const files = await fs.readdir(dir);
      const media = files
          .filter((f) => /\.(jpe?g|png|gif|webp)$/i.test(f))
          .map((f) => ({ url: `/uploads/questions/${f}`, name: f }));
      return res.json(media);
    } catch (error) {
      return res.json([]);
    }
  }

  @Post('upload')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const clientIp = req.ip || 'unknown';
    if (!this.securityUtil.checkRateLimit(clientIp)) {
      throw new BadRequestException('Too many upload requests. Please try again later.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, GIF, WebP images are allowed');
    }

    if (!this.securityUtil.validateMagicBytes(file.buffer)) {
      throw new BadRequestException('Invalid image file content');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'questions');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeName = sanitizeFilename(file.originalname);
    const filename = `${randomUUID()}__${safeName}`;
    const filePath = join(uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    // Placeholder virus scan hook (currently always returns clean)
    // await this.securityUtil.scanFile(filePath);

    return { url: `/uploads/questions/${filename}` };
  }

  @Post('import/:bankId/preview')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @Param('bankId') bankId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importService.previewFromDocx(file);
  }

  @Post('import/:bankId')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async doImport(
    @Param('bankId') bankId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.importService.importFromDocx(bankId, file);
  }

  @Patch(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }

  @Delete('bank/:id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async deleteBank(@Param('id') id: string) {
    return this.questionsService.removeBank(id);
  }
}
