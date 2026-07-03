import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            student: { count: jest.fn() },
            exam: { count: jest.fn(), findMany: jest.fn() },
            subject: { count: jest.fn() },
            examSession: { aggregate: jest.fn() },
            violation: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('/health', () => {
    it('should return "ok"', () => {
      expect(appController.health()).toBe('ok');
    });
  });
});
