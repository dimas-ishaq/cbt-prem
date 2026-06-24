import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from '../utils/security.util';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    // Decrypt redisPassword if stored
    if (result.redisPassword) {
      result.redisPassword = decrypt(result.redisPassword);
    }
    // Set defaults if not set in db
    if (!result.logoUrl) result.logoUrl = '';
    // Redis integration defaults
    if (!result.redisEnabled) result.redisEnabled = 'false';
    if (!result.redisHost) result.redisHost = '127.0.0.1';
    if (!result.redisPort) result.redisPort = '6379';
    if (!result.redisPassword) result.redisPassword = '';
    if (!result.timezone) result.timezone = 'Asia/Jakarta';
    if (!result.appName) result.appName = 'Novatech CBT';
    if (!result.language) result.language = 'id';
    if (!result.academicYear) result.academicYear = '2024/2025';
    return result;
  }

  async update(key: string, value: string) {
    let finalValue = value;
    if (key === 'redisPassword' && value) {
      finalValue = encrypt(value);
    }
    return this.prisma.setting.upsert({
      where: { key },
      update: { value: finalValue },
      create: { key, value: finalValue },
    });
  }

  async updateMany(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) => {
      let finalValue = String(value);
      if (key === 'redisPassword' && value) {
        finalValue = encrypt(String(value));
      }
      return this.prisma.setting.upsert({
        where: { key },
        update: { value: finalValue },
        create: { key, value: finalValue },
      });
    });
    return this.prisma.$transaction(updates);
  }
}
