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
import type { Response } from 'express';
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
import type { Request } from 'express';

type RequestWithUser = Request & { user: { userId: string } };

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
  create(@Body() dto: CreateQuestionDto, @Req() req: RequestWithUser) {
    return this.questionsService.create(dto, req.user.userId);
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMedia(@UploadedFile() file: Express.Multer.File, @Req() req: RequestWithUser) {
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

    return { url: `/uploads/questions/${filename}` };
  }

  @Post('preview-pdf')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadPreviewPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedMimeTypes = ['application/pdf', 'application/octet-stream'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new BadRequestException('PDF size must be less than 20MB');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'tmp');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}__preview.pdf`;
    const filePath = join(uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);

    return { url: `/uploads/tmp/${filename}` };
  }

  @Post('import/:bankId/preview')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async previewImport(
    @Param('bankId') bankId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new BadRequestException('Only DOCX files are allowed');
    }
    return this.importService.previewFromDocx(bankId, req.user.userId, file);
  }

  @Post('import/:bankId')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async doImport(
    @Param('bankId') bankId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new BadRequestException('Only DOCX files are allowed');
    }
    return this.importService.importFromDocx(bankId, req.user.userId, file);
  }

  @Patch(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto, @Req() req: RequestWithUser) {
    return this.questionsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.questionsService.remove(id, req.user.userId);
  }

  @Delete('bank/:id')
  @Roles(Role.GURU, Role.SUPER_ADMIN)
  async deleteBank(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.questionsService.removeBank(id, req.user.userId);
  }
}
