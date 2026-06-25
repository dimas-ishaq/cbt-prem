jest.mock('fs', () => ({
  __esModule: true,
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import { LogsService } from './logs.service';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';


describe('LogsService', () => {
  let service: LogsService;

  beforeEach(() => {
    service = new LogsService();
    jest.restoreAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getLogFiles', () => {
    it('should return empty array if logs dir missing', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(service.getLogFiles()).toEqual([]);
    });

    it('should return sorted log files', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readdirSync').mockReturnValue(['app.log', 'error.log', 'readme.txt'] as any);
      jest.spyOn(fs, 'statSync').mockImplementation((path: any) => ({
        mtime: { getTime: () => path.includes('error') ? 2000 : 1000 },
      } as any));
      const result = service.getLogFiles();
      expect(result).toEqual(['error.log', 'app.log']);
    });
  });

  describe('getLogFileContent', () => {
    it('should throw Error for invalid filename', () => {
      expect(() => service.getLogFileContent('../etc/passwd')).toThrow('Invalid filename format');
    });

    it('should throw NotFoundException if file missing', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => service.getLogFileContent('app.log')).toThrow(NotFoundException);
    });

    it('should return file content', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('log content here' as any);
      const result = service.getLogFileContent('app.log');
      expect(result).toBe('log content here');
    });
  });
});
