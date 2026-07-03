import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogsService {
  private readonly logsDir = path.join(process.cwd(), 'logs');

  constructor(private readonly prisma: PrismaService) {}

  getLogFiles(): string[] {
    if (!fs.existsSync(this.logsDir)) {
      return [];
    }
    // Return log files sorted by modification time (newest first)
    return fs
      .readdirSync(this.logsDir)
      .filter((file) => file.endsWith('.log'))
      .map((file) => ({
        name: file,
        time: fs.statSync(path.join(this.logsDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)
      .map((item) => item.name);
  }

  getLogFileContent(filename: string): string {
    if (!/^[a-zA-Z0-9_-]+\.log$/.test(filename)) {
      throw new Error('Format nama file tidak valid');
    }

    const filePath = path.join(this.logsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Berkas log ${filename} tidak ditemukan`);
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  clearLogFile(filename: string): void {
    if (!/^[a-zA-Z0-9_-]+\.log$/.test(filename)) {
      throw new Error('Format nama file tidak valid');
    }
    const filePath = path.join(this.logsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Berkas log ${filename} tidak ditemukan`);
    }
    fs.writeFileSync(filePath, '', 'utf-8');
  }

  deleteLogFile(filename: string): void {
    if (!/^[a-zA-Z0-9_-]+\.log$/.test(filename)) {
      throw new Error('Format nama file tidak valid');
    }
    const filePath = path.join(this.logsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Berkas log ${filename} tidak ditemukan`);
    }
    fs.unlinkSync(filePath);
  }

  async getSettings() {
    const retentionSetting = await this.prisma.setting.findUnique({
      where: { key: 'logRetentionDays' },
    });
    return {
      logRetentionDays: retentionSetting
        ? parseInt(retentionSetting.value, 10)
        : 0,
    };
  }

  async updateSettings(dto: { logRetentionDays: number }) {
    return this.prisma.setting.upsert({
      where: { key: 'logRetentionDays' },
      update: { value: String(dto.logRetentionDays) },
      create: { key: 'logRetentionDays', value: String(dto.logRetentionDays) },
    });
  }

  // Cron job runs daily at midnight to prune log files older than logRetentionDays
  @Cron('0 0 * * *')
  async handleLogCleanup() {
    try {
      const settings = await this.getSettings();
      const days = settings.logRetentionDays;
      if (!days || days <= 0) return;

      if (!fs.existsSync(this.logsDir)) return;

      const now = Date.now();
      const files = fs
        .readdirSync(this.logsDir)
        .filter((file) => file.endsWith('.log'));
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const mtime = fs.statSync(filePath).mtime.getTime();
        const diffDays = (now - mtime) / (1000 * 60 * 60 * 24);

        if (diffDays > days) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      console.log(
        `[Log Cleanup] Automated cleanup deleted ${deletedCount} files older than ${days} days.`,
      );
    } catch (error) {
      console.error('[Log Cleanup] Automated cleanup failed:', error);
    }
  }
}
