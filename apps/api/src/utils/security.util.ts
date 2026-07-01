// apps/api/src/utils/security.util.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const rawEncryptionKey = process.env.ENCRYPTION_KEY;
if (!rawEncryptionKey) {
  throw new Error('ENCRYPTION_KEY is required');
}
const ENCRYPTION_KEY = rawEncryptionKey.substring(0, 32).padEnd(32, '0'); // Ensures exactly 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; // fallback for unencrypted old data
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

@Injectable()
export class SecurityUtil {
  private rateLimitMap = new Map<string, { hits: number; lastReset: number }>();
  private readonly MAX_HITS = 10;
  private readonly WINDOW_MS = 30 * 1000; // 30 seconds

  checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(ip);

    if (!record || now - record.lastReset > this.WINDOW_MS) {
      this.rateLimitMap.set(ip, { hits: 1, lastReset: now });
      return true;
    }

    if (record.hits >= this.MAX_HITS) {
      return false;
    }

    record.hits++;
    return true;
  }

  validateMagicBytes(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
    // GIF: GIF87a or GIF89a
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
    // WebP: RIFF .... WEBP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      const type = buffer.slice(8, 12).toString();
      return type === 'WEBP';
    }

    return false;
  }
}
