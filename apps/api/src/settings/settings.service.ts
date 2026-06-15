import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    // Set defaults if not set in db
    if (!result.logoUrl) result.logoUrl = '';
    if (!result.timezone) result.timezone = 'Asia/Jakarta';
    if (!result.appName) result.appName = 'CBT Enterprise';
    if (!result.language) result.language = 'id';
    if (!result.academicYear) result.academicYear = '2024/2025';
    return result;
  }

  async update(key: string, value: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async updateMany(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) => {
      return this.prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });
    return this.prisma.$transaction(updates);
  }
}
