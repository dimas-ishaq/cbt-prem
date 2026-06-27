'use client';

import { Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';
import { useAuthStore } from '@/store/auth.store';
import { ExamLockedOverlay } from './_components/exam-locked-overlay';
import { ExamRulesGate } from './_components/exam-rules-gate';
import { ExamHeader } from './_components/exam-header';
import { TimeAddedDialog } from './_components/time-added-dialog';
import { ViolationWarningModal } from './_components/violation-warning-modal';
import { ExamWorkspace } from './_components/exam-workspace';
import { useExamRealtime } from './hooks/use-exam-realtime';
import { useExamSession } from './hooks/use-exam-session';
import { useExamViolation } from './hooks/use-exam-violation';

interface Props { examId: string; }

const REQUIRED_TERM_IDS = [0, 1, 2] as const;

export function ExamContainer({ examId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const socket = useSocket();
  const { playViolation, playSuccess } = useSound();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.access_token);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const [showTimeAddedDialog, setShowTimeAddedDialog] = useState(false);
  const [timeAddedMinutes, setTimeAddedMinutes] = useState(5);
  const [checkedTerms, setCheckedTerms] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => (await api.get(`/exams/${examId}`)).data,
    enabled: !!token && !!examId,
    retry: false,
  });

  const {
    sessionId,
    sessionEndTime,
    isLocked,
    answers,
    isRestoringSession,
    isStartingSession,
    startSession,
    setAnswers,
    setIsLocked,
    setSessionEndTime,
  } = useExamSession(examId, token, user?.role);

  const finishExam = async () => {
    if (!sessionId) return;
    await api.post(`/exam-sessions/${sessionId}/finish`);
    router.push('/dashboard');
  };

  useExamRealtime({ socket, examId, sessionId, playSuccess, setIsLocked, finishExam, setSessionEndTime, setTimeAddedMinutes, setShowTimeAddedDialog });
  useExamViolation({ enabled: true, exam, examId, socket, sessionId, playViolation, finishExam, setViolationCount, setViolationMessage, setShowViolationModal });

  const isTokenRequired = !!exam?.token;
  const allTermsChecked = REQUIRED_TERM_IDS.every((id) => checkedTerms[id]);
  const disableStart = isStartingSession || !allTermsChecked || (isTokenRequired && !tokenInput.trim());
  const currentQuestion = exam?.examQuestions?.[currentQuestionIndex] ?? null;
  const timerEndTime = sessionEndTime || exam?.endTime;
  const timerStartTime = exam?.startTime || timerEndTime || new Date().toISOString();

  const handleTokenChange = (value: string) => {
    setTokenInput(value);
    if (tokenError) setTokenError('');
  };

  const handleToggleTerm = (id: number, checked: boolean) => {
    setCheckedTerms((prev) => ({ ...prev, [id]: checked }));
  };

  const handleStartExam = async () => {
    if (!allTermsChecked) {
      setTokenError('Setujui seluruh informasi ujian sebelum memulai.');
      return;
    }

    if (isTokenRequired && !tokenInput.trim()) {
      setTokenError('Token ujian wajib diisi sebelum memulai sesi.');
      return;
    }

    setTokenError('');

    try {
      await startSession(isTokenRequired ? tokenInput.trim() : undefined);
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || error.response?.data?.error || error.message
        : 'Gagal memulai ujian. Silakan coba lagi.';
      setTokenError(Array.isArray(message) ? message[0] : String(message));
    }
  };

  if (!exam && isLoadingExam) return <Flex align="center" justify="center" minH="screen"><Spinner size="xl" /></Flex>;
  if (!exam) return <Flex align="center" justify="center" minH="screen"><Text>Ujian tidak ditemukan.</Text></Flex>;
  if (isLocked) return <ExamLockedOverlay />;
  if (isRestoringSession) return <Flex align="center" justify="center" minH="screen"><Spinner size="xl" /></Flex>;
  if (!sessionId) {
    return (
      <ExamRulesGate
        checkedTerms={checkedTerms}
        isTokenRequired={isTokenRequired}
        tokenInput={tokenInput}
        tokenError={tokenError}
        isStarting={isStartingSession}
        disableStart={disableStart}
        onToggleTerm={handleToggleTerm}
        onTokenChange={handleTokenChange}
        onStart={handleStartExam}
      />
    );
  }

  return (
    <Box minH="screen" bg="gray.50">
      <ExamHeader title={exam.title} subjectName={exam.subject?.name} startTime={timerStartTime} duration={exam.duration} overrideEndTime={timerEndTime} onTimeUp={finishExam} onFinish={finishExam} />
      <Box flex={1} p={8}>
        <ExamWorkspace
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          onAnswer={(questionId, answer) => setAnswers((prev) => ({ ...prev, [questionId]: answer }))}
          onToggleFlag={(questionId) => setFlaggedQuestions((prev) => prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId])}
          questions={exam.examQuestions}
          onSelectQuestion={setCurrentQuestionIndex}
          onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
          onNext={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, exam.examQuestions.length - 1))}
          onFinish={finishExam}
        />
      </Box>
      <ViolationWarningModal open={showViolationModal} message={violationMessage} onAcknowledge={() => setShowViolationModal(false)} />
      <TimeAddedDialog open={showTimeAddedDialog} minutes={timeAddedMinutes} onOpenChange={setShowTimeAddedDialog} />
    </Box>
  );
}

