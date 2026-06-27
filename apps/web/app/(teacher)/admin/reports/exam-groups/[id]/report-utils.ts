export interface ExamInfo {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  passingGrade: number;
  status?: string;
  duration?: number;
  description?: string;
}

export interface LedgerStudent {
  studentId: string;
  userId: string;
  fullName: string;
  username: string;
  rombel: { id: string; name: string } | null;
  major: { id: string; name: string } | null;
  scores: Record<string, number | null>;
  statuses: Record<string, string | null>;
  average: number | null;
}

export interface UnsubmittedStudent {
  studentId: string;
  fullName: string;
  username: string;
  rombel: { id: string; name: string } | null;
  major: { id: string; name: string } | null;
  missingExams: { examId: string; title: string; subject: string; status: string | null }[];
}

export interface ExamStat {
  examId: string;
  title: string;
  subject: string;
  participantCount: number;
  totalEnrolled: number;
  averageScore: number | null;
  passedCount: number;
  passRate: number;
}

export interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
}

export interface LedgerData {
  group: GroupInfo;
  exams: ExamInfo[];
  ledger: LedgerStudent[];
  unsubmitted: UnsubmittedStudent[];
  examStats: ExamStat[];
  totalStudents: number;
}

export interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  exams: ExamInfo[];
}

export interface SubjectSummary {
  subject: string;
  examCount: number;
  participantCount: number;
  totalEnrolled: number;
  averageScore: number | null;
  passedCount: number;
  totalSubmitted: number;
  passRate: number;
  missingCount: number;
}

export interface OverviewMetrics {
  totalStudents: number;
  totalExams: number;
  totalSubjects: number;
  overallPassRate: number;
  overallParticipationRate: number;
  overallMissingCount: number;
}

export interface AttentionInsight {
  label: string;
  value: string;
  caption: string;
  tone: 'red' | 'amber' | 'blue' | 'green';
}

export interface StudentLedgerRow extends LedgerStudent {
  subjectAverage: number | null;
  submittedExamCount: number;
  completedExamCount: number;
  totalExamCount: number;
}

export interface RombelSummary {
  rombelId: string;
  rombelName: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  missingStudents: number;
  averageScore: number | null;
  passRate: number;
}

export interface StatusAggregate {
  status: string;
  label: string;
  color: string;
  count: number;
}

export const sessionStatusMap: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Belum Mulai', color: 'gray' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', color: 'amber' },
  LOCKED: { label: 'Terkunci', color: 'red' },
  SUBMITTED: { label: 'Selesai', color: 'green' },
  FINISHED: { label: 'Selesai', color: 'green' },
};

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getScoreTone(score: number | null | undefined, passingGrade: number) {
  if (score == null) return { bg: 'rgba(248, 250, 252, 0.9)', color: 'gray.500' };
  if (score >= passingGrade) return { bg: 'rgba(220, 252, 231, 0.95)', color: 'green.700' };
  if (score >= Math.max(0, passingGrade - 10)) return { bg: 'rgba(254, 249, 195, 0.95)', color: 'amber.700' };
  return { bg: 'rgba(254, 226, 226, 0.95)', color: 'red.700' };
}

export function buildSubjectOptions(group?: ExamGroup | null) {
  if (!group?.exams) return [];
  const map = new Map<string, string>();
  group.exams.forEach((exam) => {
    const subject = exam.subject as unknown as { name?: string } | string | null | undefined;
    const subjectValue = typeof subject === 'object' && subject ? subject.name ?? '-' : String(subject ?? '-');
    if (!map.has(subjectValue)) map.set(subjectValue, subjectValue);
  });
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

export function buildRombels(data?: LedgerData | null) {
  if (!data) return [];
  const map = new Map<string, string>();
  data.ledger.forEach((s) => {
    if (s.rombel) map.set(s.rombel.id, s.rombel.name);
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}

export function buildSubjectSummaries(data?: LedgerData | null): SubjectSummary[] {
  if (!data?.examStats.length) return [];
  const summaryMap = new Map<string, SubjectSummary & { weightedAverageTotal: number; weightedParticipantTotal: number }>();

  data.examStats.forEach((stat) => {
    const current = summaryMap.get(stat.subject) ?? {
      subject: stat.subject,
      examCount: 0,
      participantCount: 0,
      totalEnrolled: stat.totalEnrolled,
      averageScore: null,
      passedCount: 0,
      totalSubmitted: 0,
      passRate: 0,
      missingCount: 0,
      weightedAverageTotal: 0,
      weightedParticipantTotal: 0,
    };

    current.examCount += 1;
    current.participantCount = Math.max(current.participantCount, stat.participantCount);
    current.totalEnrolled = Math.max(current.totalEnrolled, stat.totalEnrolled);
    current.passedCount += stat.passedCount;
    current.totalSubmitted += stat.participantCount;
    current.missingCount += Math.max(stat.totalEnrolled - stat.participantCount, 0);

    if (stat.averageScore != null && stat.participantCount > 0) {
      current.weightedAverageTotal += stat.averageScore * stat.participantCount;
      current.weightedParticipantTotal += stat.participantCount;
    }

    summaryMap.set(stat.subject, current);
  });

  return Array.from(summaryMap.values())
    .map(({ weightedAverageTotal, weightedParticipantTotal, ...summary }) => ({
      ...summary,
      averageScore: weightedParticipantTotal > 0 ? weightedAverageTotal / weightedParticipantTotal : null,
      passRate: summary.totalSubmitted > 0 ? (summary.passedCount / summary.totalSubmitted) * 100 : 0,
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

export function buildOverviewMetrics(data: LedgerData | null | undefined, subjectSummaries: SubjectSummary[]): OverviewMetrics {
  const totalStudents = data?.totalStudents ?? 0;
  const totalExams = data?.exams.length ?? 0;
  const totalSubjects = subjectSummaries.length;
  const totalSubmitted = subjectSummaries.reduce((sum, item) => sum + item.totalSubmitted, 0);
  const totalPassed = subjectSummaries.reduce((sum, item) => sum + item.passedCount, 0);
  const totalPossibleAttempts = totalStudents * Math.max(totalExams, 1);
  return {
    totalStudents,
    totalExams,
    totalSubjects,
    overallPassRate: totalSubmitted > 0 ? (totalPassed / totalSubmitted) * 100 : 0,
    overallParticipationRate: totalPossibleAttempts > 0 ? (totalSubmitted / totalPossibleAttempts) * 100 : 0,
    overallMissingCount: totalPossibleAttempts > 0 ? Math.max(totalPossibleAttempts - totalSubmitted, 0) : 0,
  };
}

export function buildAttentionInsights(subjectSummaries: SubjectSummary[], totalUnsubmittedStudents: number): AttentionInsight[] {
  const [firstSummary] = subjectSummaries;
  if (!firstSummary) {
    return [{ label: 'Belum ada data', value: '-', caption: 'Insight akan muncul setelah ada submission ujian.', tone: 'blue' }];
  }

  const lowestPassRate = [...subjectSummaries].sort((a, b) => a.passRate - b.passRate)[0] ?? firstSummary;
  const lowestParticipation = [...subjectSummaries].sort((a, b) => {
    const aRate = a.totalEnrolled > 0 ? a.totalSubmitted / (a.totalEnrolled * Math.max(a.examCount, 1)) : 0;
    const bRate = b.totalEnrolled > 0 ? b.totalSubmitted / (b.totalEnrolled * Math.max(b.examCount, 1)) : 0;
    return aRate - bRate;
  })[0] ?? firstSummary;
  const biggestGap = [...subjectSummaries].sort((a, b) => b.missingCount - a.missingCount)[0] ?? firstSummary;

  const lowestParticipationRate = lowestParticipation.totalEnrolled > 0
    ? (lowestParticipation.totalSubmitted / (lowestParticipation.totalEnrolled * Math.max(lowestParticipation.examCount, 1))) * 100
    : 0;

  return [
    {
      label: 'Pass rate terendah',
      value: `${lowestPassRate.subject}`,
      caption: `${lowestPassRate.passRate.toFixed(1)}% lulus dari ${lowestPassRate.totalSubmitted} submission.`,
      tone: lowestPassRate.passRate < 50 ? 'red' : 'amber',
    },
    {
      label: 'Partisipasi terendah',
      value: `${lowestParticipation.subject}`,
      caption: `${lowestParticipationRate.toFixed(1)}% coverage submission pada mapel ini.`,
      tone: lowestParticipationRate < 60 ? 'red' : 'amber',
    },
    {
      label: 'Gap submission terbesar',
      value: `${biggestGap.subject}`,
      caption: `${biggestGap.missingCount} attempt belum masuk dibanding target.`,
      tone: biggestGap.missingCount > 0 ? 'amber' : 'green',
    },
    {
      label: 'Siswa belum tuntas',
      value: `${totalUnsubmittedStudents}`,
      caption: 'Jumlah siswa yang masih punya ujian belum selesai.',
      tone: totalUnsubmittedStudents > 0 ? 'red' : 'green',
    },
  ];
}

export function buildSelectedExams(data: LedgerData | null | undefined, subject: string) {
  if (!data?.exams.length || !subject) return [];
  return data.exams.filter((exam) => exam.subject === subject);
}

export function buildSelectedExamStats(data: LedgerData | null | undefined, subject: string) {
  if (!data?.examStats.length || !subject) return [];
  return data.examStats.filter((stat) => stat.subject === subject);
}

export function buildFilteredLedger(data: LedgerData | null | undefined, exams: ExamInfo[], ledgerSearch: string, ledgerRombel: string): StudentLedgerRow[] {
  if (!data || exams.length === 0) return [];
  return data.ledger
    .filter((s) => {
      const name = `${s.fullName}${s.username}`.toLowerCase();
      if (ledgerSearch && !name.includes(ledgerSearch.toLowerCase())) return false;
      if (ledgerRombel && s.rombel?.id !== ledgerRombel) return false;
      return true;
    })
    .map((student) => {
      const subjectScores = exams.map((exam) => student.scores[exam.id]).filter((score): score is number => score != null);
      const completedExamCount = exams.filter((exam) => student.statuses[exam.id] === 'SUBMITTED' || student.statuses[exam.id] === 'FINISHED').length;
      const submittedExamCount = exams.filter((exam) => student.statuses[exam.id] && student.statuses[exam.id] !== 'NOT_STARTED').length;
      return {
        ...student,
        subjectAverage: subjectScores.length > 0 ? subjectScores.reduce((total, score) => total + score, 0) / subjectScores.length : null,
        submittedExamCount,
        completedExamCount,
        totalExamCount: exams.length,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function buildFilteredUnsubmitted(data: LedgerData | null | undefined, examIds: Set<string>, examsLength: number, unsubSearch: string): UnsubmittedStudent[] {
  if (!data || examsLength === 0) return [];
  return data.unsubmitted
    .map((student) => ({ ...student, missingExams: student.missingExams.filter((m) => examIds.has(m.examId)) }))
    .filter((s) => s.missingExams.length > 0)
    .filter((s) => {
      const name = `${s.fullName}${s.username}`.toLowerCase();
      if (unsubSearch && !name.includes(unsubSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function buildStatusAggregates(ledgerRows: StudentLedgerRow[], exams: ExamInfo[]): StatusAggregate[] {
  const counts = { NOT_STARTED: 0, IN_PROGRESS: 0, LOCKED: 0, SUBMITTED: 0 };
  ledgerRows.forEach((student) => {
    exams.forEach((exam) => {
      const status = student.statuses[exam.id] ?? 'NOT_STARTED';
      if (status === 'SUBMITTED' || status === 'FINISHED') counts.SUBMITTED += 1;
      else if (status === 'IN_PROGRESS') counts.IN_PROGRESS += 1;
      else if (status === 'LOCKED') counts.LOCKED += 1;
      else counts.NOT_STARTED += 1;
    });
  });

  const orderedStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'LOCKED', 'SUBMITTED'] as const;
  return orderedStatuses.map((key) => ({
    status: key,
    label: sessionStatusMap[key]?.label ?? key,
    color: sessionStatusMap[key]?.color ?? 'gray',
    count: counts[key],
  }));
}

export function buildRombelSummaries(ledgerRows: StudentLedgerRow[], exams: ExamInfo[]): RombelSummary[] {
  const map = new Map<string, RombelSummary & { totalScore: number; scoredCount: number; passedCount: number }>();
  ledgerRows.forEach((student) => {
    const key = student.rombel?.id ?? 'unknown';
    const current = map.get(key) ?? {
      rombelId: key,
      rombelName: student.rombel?.name ?? 'Tanpa Kelas',
      totalStudents: 0,
      activeStudents: 0,
      completedStudents: 0,
      missingStudents: 0,
      averageScore: null,
      passRate: 0,
      totalScore: 0,
      scoredCount: 0,
      passedCount: 0,
    };

    current.totalStudents += 1;
    if (student.submittedExamCount > 0) current.activeStudents += 1;
    if (student.completedExamCount === exams.length && exams.length > 0) current.completedStudents += 1;
    if (student.completedExamCount < exams.length) current.missingStudents += 1;
    if (student.subjectAverage != null) {
      current.totalScore += student.subjectAverage;
      current.scoredCount += 1;
    }
    if (student.subjectAverage != null && exams.length > 0) {
      const passingAverage = exams.reduce((sum, exam) => sum + exam.passingGrade, 0) / exams.length;
      if (student.subjectAverage >= passingAverage) current.passedCount += 1;
    }

    map.set(key, current);
  });

  return Array.from(map.values())
    .map(({ totalScore, scoredCount, passedCount, ...item }) => ({
      ...item,
      averageScore: scoredCount > 0 ? totalScore / scoredCount : null,
      passRate: item.totalStudents > 0 ? (passedCount / item.totalStudents) * 100 : 0,
    }))
    .sort((a, b) => b.missingStudents - a.missingStudents || a.rombelName.localeCompare(b.rombelName));
}
