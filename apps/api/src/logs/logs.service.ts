import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogsService {
  private readonly logsDir = path.join(process.cwd(), 'logs');

  getLogFiles(): string[] {
    if (!fs.existsSync(this.logsDir)) {
      return [];
    }
    // Return log files sorted by modification time (newest first)
    return fs.readdirSync(this.logsDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(this.logsDir, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time)
      .map(item => item.name);
  }

  getLogFileContent(filename: string): string {
    if (!/^[a-zA-Z0-9_-]+\.log$/.test(filename)) {
      throw new Error('Invalid filename format');
    }
    
    const filePath = path.join(this.logsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Log file ${filename} not found`);
    }

    return fs.readFileSync(filePath, 'utf-8');
  }
}
