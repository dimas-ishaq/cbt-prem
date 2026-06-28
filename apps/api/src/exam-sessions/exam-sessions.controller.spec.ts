import { Test } from '@nestjs/testing';
import { ExamSessionsController } from './exam-sessions.controller';
import { ExamSessionsService } from './exam-sessions.service';

describe('ExamSessionsController', () => {
  const service = { startSession: jest.fn(), getActiveSessionByExam: jest.fn(), submitAnswer: jest.fn(), finishSession: jest.fn(), gradeAnswer: jest.fn(), getMyHistory: jest.fn(), getExamSessions: jest.fn(), getEssayAnswersByExam: jest.fn(), gradeEssayAnswer: jest.fn(), exportToExcel: jest.fn(), getSession: jest.fn(), resetSession: jest.fn(), getMonitoringHistory: jest.fn(), getUpcomingMonitoring: jest.fn() };

  it('start delegates', async () => {
    service.startSession.mockResolvedValue({ id: 's1' });
    const mod = await Test.createTestingModule({ controllers: [ExamSessionsController], providers: [{ provide: ExamSessionsService, useValue: service }] }).compile();
    const controller = mod.get(ExamSessionsController);
    await expect(controller.start({ examId: 'e1' } as any, { user: { userId: 'u1' } } as any, '', '', '')).resolves.toEqual({ id: 's1' });
  });
});