import { Test, TestingModule } from '@nestjs/testing';
import { ExamSessionsController } from './exam-sessions.controller';
import { ExamSessionsService } from './exam-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ExamSessionsController', () => {
  let controller: ExamSessionsController;
  const mockService = {
    startSession: jest.fn(),
    submitAnswer: jest.fn(),
    finishSession: jest.fn(),
    gradeAnswer: jest.fn(),
    getMyHistory: jest.fn(),
    getExamSessions: jest.fn(),
    getEssayAnswersByExam: jest.fn(),
    gradeEssayAnswer: jest.fn(),
    exportToExcel: jest.fn(),
    getSession: jest.fn(),
    resetSession: jest.fn(),
    bulkResetSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamSessionsController],
      providers: [{ provide: ExamSessionsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(ExamSessionsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('start should delegate to service', async () => {
    mockService.startSession.mockResolvedValue({ id: 'sess1' });
    const req = { user: { userId: 'u1' } };
    await controller.start({ examId: 'e1' } as any, req, 'ua', 'cfg', 'brw');
    expect(mockService.startSession).toHaveBeenCalledWith({ examId: 'e1' }, 'u1', 'ua', 'cfg', 'brw');
  });

  it('submitAnswer should delegate', async () => {
    mockService.submitAnswer.mockResolvedValue({ id: 'a1' });
    await controller.submitAnswer('sess1', { questionId: 'q1' } as any);
    expect(mockService.submitAnswer).toHaveBeenCalledWith('sess1', { questionId: 'q1' });
  });

  it('finish should delegate', async () => {
    mockService.finishSession.mockResolvedValue({});
    await controller.finish('sess1');
    expect(mockService.finishSession).toHaveBeenCalledWith('sess1');
  });

  it('gradeAnswer should delegate', async () => {
    mockService.gradeAnswer.mockResolvedValue({});
    await controller.gradeAnswer('a1', { score: 10 } as any);
    expect(mockService.gradeAnswer).toHaveBeenCalledWith('a1', { score: 10 });
  });

  it('myHistory should delegate', async () => {
    mockService.getMyHistory.mockResolvedValue([]);
    await controller.myHistory({ user: { userId: 'u1' } });
    expect(mockService.getMyHistory).toHaveBeenCalledWith('u1');
  });

  it('getExamSessions should delegate', async () => {
    mockService.getExamSessions.mockResolvedValue([]);
    await controller.getExamSessions('e1');
    expect(mockService.getExamSessions).toHaveBeenCalledWith('e1');
  });

  it('getSession should delegate', async () => {
    mockService.getSession.mockResolvedValue({});
    await controller.getSession('sess1');
    expect(mockService.getSession).toHaveBeenCalledWith('sess1');
  });

  it('resetSession should delegate', async () => {
    mockService.resetSession.mockResolvedValue({});
    await controller.resetSession('sess1');
    expect(mockService.resetSession).toHaveBeenCalledWith('sess1');
  });

  it('bulkResetSessions should delegate', async () => {
    mockService.bulkResetSessions.mockResolvedValue({});
    await controller.bulkResetSessions(['s1', 's2']);
    expect(mockService.bulkResetSessions).toHaveBeenCalledWith(['s1', 's2']);
  });
});
