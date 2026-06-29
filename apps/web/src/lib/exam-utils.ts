export type ExamSessionLike = { status?: string };

export type ExamLike = {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  subject?: { name?: string };
  teacher?: { user?: { fullName?: string; username?: string } | null } | null;
  examSessions?: ExamSessionLike[];
};

export type ExamStatus = 'upcoming' | 'active' | 'ended' | 'locked' | 'completed';

export function classifyExam(exam: ExamLike, now = new Date()): ExamStatus {
  const sessionStatus = exam.examSessions?.[0]?.status;
  if (sessionStatus === 'LOCKED') return 'locked';
  if (sessionStatus === 'SUBMITTED' || sessionStatus === 'FINISHED') return 'completed';
  if (sessionStatus === 'IN_PROGRESS') return 'active';

  const startTs = new Date(exam.startTime).getTime();
  const endTs = new Date(exam.endTime).getTime();
  const nowTs = now.getTime();

  if (Number.isNaN(startTs) || Number.isNaN(endTs)) return 'upcoming';
  if (nowTs < startTs) return 'upcoming';
  if (nowTs > endTs) return 'ended';
  return 'active';
}

export function getAvailabilityLabel(exam: ExamLike, now = new Date()) {
  switch (classifyExam(exam, now)) {
    case 'active':
      return 'SEDANG BERLANGSUNG';
    case 'locked':
      return 'TERKUNCI';
    case 'completed':
      return 'SELESAI';
    case 'ended':
      return 'SUDAH BERAKHIR';
    default:
      return 'BELUM DIMULAI';
  }
}

export function getUpcomingExams(exams: ExamLike[] = [], now = new Date()) {
  return exams
    .filter((exam) => classifyExam(exam, now) === 'upcoming')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
