import { Controller, Get, Param, Req, Res, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { join } from 'path';
import * as fs from 'fs';
import type { Response, Request } from 'express';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  @Get('photos/:filename')
  async getPhoto(@Param('filename') filename: string, @Req() req: Request, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'photos', filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    return res.sendFile(filePath);
  }
}
