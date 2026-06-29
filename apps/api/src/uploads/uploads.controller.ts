import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';
import type { Response } from 'express';

@Controller('uploads')
export class UploadsController {
  @Get('photos/:filename')
  async getPhoto(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'photos', filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    return res.sendFile(filePath);
  }
}
