import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { join, normalize, relative } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

@Controller('uploads')
export class UploadsController {
  @Get('photos/:filename')
  async getPhoto(@Param('filename') filename: string, @Res() res: Response) {
    const baseDir = join(process.cwd(), 'uploads', 'photos');
    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = normalize(join(baseDir, safeName));
    if (relative(baseDir, filePath).startsWith('..')) {
      throw new BadRequestException('Invalid file path');
    }
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    return res.sendFile(filePath);
  }

  @Get('questions/images/:filename')
  async getQuestionImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const baseDir = join(process.cwd(), 'uploads', 'questions', 'images');
    const safeName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = normalize(join(baseDir, safeName));
    if (relative(baseDir, filePath).startsWith('..')) {
      throw new BadRequestException('Invalid file path');
    }
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    return res.sendFile(filePath);
  }
}
