'use client';

import { Box, Button, Checkbox, Flex, Heading, Input, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';
import { ExamRulesGate } from './_components/exam-rules-gate';
import { ExamHeader } from './_components/exam-header';
import { ExamWorkspace } from './_components/exam-workspace';
import { ExamSidebar } from './_components/exam-sidebar';
import { ViolationWarningModal } from './_components/violation-warning-modal';
import { ExamLockedOverlay } from './_components/exam-locked-overlay';
import { TimeAddedDialog } from './_components/time-added-dialog';
import { useExamSession } from './hooks/use-exam-session';
import { useExamRealtime } from './hooks/use-exam-realtime';
import { useExamViolation } from './hooks/use-exam-violation';

interface Props { examId: string; }

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

  const { data: exam, isLoading: isLoadingExam } = useQuery({ queryKey: ['exam', examId], queryFn: async () => (await api.get(`/exams/${examId}`)).data, enabled: !!token && !!examId, retry: false });
  const { sessionId, sessionEndTime, isLocked, answers, startSession, setAnswers, setIsLocked, setSessionEndTime } = useExamSession(examId, token, user?.role);

  const finishExam = async () => { if (!sessionId) return; await api.post(`/exam-sessions/${sessionId}/finish`); router.push('/dashboard'); };
  useExamRealtime({ socket, examId, sessionId, playSuccess, setIsLocked, finishExam, setSessionEndTime, setTimeAddedMinutes, setShowTimeAddedDialog });
  useExamViolation({ enabled: true, exam, examId, socket, sessionId, playViolation, finishExam, setViolationCount, setViolationMessage, setShowViolationModal });

  const isTokenRequired = !!exam?.token;
  const currentQuestion = exam?.examQuestions?.[currentQuestionIndex]?.question;
  const timerEndTime = sessionEndTime || exam?.endTime;
  const timerStartTime = exam?.startTime || timerEndTime || new Date().toISOString();

  if (!exam && isLoadingExam) return <Flex align="center" justify="center" minH="screen"><Spinner size="xl" /></Flex>;
  if (!exam) return <Flex align="center" justify="center" minH="screen"><Text>Ujian tidak ditemukan.</Text></Flex>;
  if (isLocked) return <ExamLockedOverlay />;
  if (!sessionId) return <ExamRulesGate checkedTerms={checkedTerms} isTokenRequired={isTokenRequired} tokenInput={tokenInput} tokenError={tokenError} onToggleTerm={(id) => setCheckedTerms((prev) => ({ ...prev, [id]: !prev[id] }))} onTokenChange={setTokenInput} onStart={() => startSession(isTokenRequired ? tokenInput : undefined)} />;

  return (
    <Box minH="screen" bg="gray.50">
      <ExamHeader title={exam.title} subjectName={exam.subject?.name} startTime={timerStartTime} duration={exam.duration} overrideEndTime={timerEndTime} onTimeUp={finishExam} onFinish={finishExam} />
      <Flex>
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
          />
        </Box>
        <ExamSidebar questions={exam.examQuestions} currentIndex={currentQuestionIndex} answers={answers} flaggedQuestions={flaggedQuestions} onSelectQuestion={setCurrentQuestionIndex} />
      </Flex>
      <ViolationWarningModal message={violationMessage} onAcknowledge={() => setShowViolationModal(false)} />
      <TimeAddedDialog open={showTimeAddedDialog} minutes={timeAddedMinutes} onOpenChange={setShowTimeAddedDialog} />
    </Box>
  );
}
