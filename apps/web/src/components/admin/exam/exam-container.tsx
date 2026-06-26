'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Box, Button, Checkbox, Flex, Heading, Input, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';
import { generateSEBConfig } from './exam-utils';
import { QuestionCard } from './_components/question-card';
import { ExamNav } from './_components/exam-nav';
import { ExamTimer } from './_components/exam-timer';
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
  const confirmDialog = useConfirm();
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
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get('/settings')).data });
  const { data: profile } = useQuery({ queryKey: ['student-profile'], queryFn: async () => (await api.get('/students/me')).data, enabled: user?.role === 'SISWA' });

  const { sessionId, sessionEndTime, isLocked, answers, startSession, setAnswers, setIsLocked, setSessionEndTime } = useExamSession(examId, token, user?.role);

  const finishExam = async () => {
    if (!sessionId) return;
    await api.post(`/exam-sessions/${sessionId}/finish`);
    router.push('/dashboard');
  };

  useExamRealtime({ socket, examId, sessionId, playSuccess, setIsLocked, finishExam, setSessionEndTime, setTimeAddedMinutes, setShowTimeAddedDialog });
  useExamViolation({ enabled: true, exam, examId, socket, sessionId, playViolation, finishExam, setViolationCount, setViolationMessage, setShowViolationModal });

  const allChecked = checkedTerms[0] && checkedTerms[1] && checkedTerms[2];
  const isTokenRequired = !!exam?.token;
  const currentQuestion = exam?.examQuestions?.[currentQuestionIndex]?.question;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const totalQuestions = exam?.examQuestions?.length || 0;
  const timerEndTime = sessionEndTime || exam?.endTime;
  const timerStartTime = exam?.startTime || timerEndTime || new Date().toISOString();

  const toggleFlagQuestion = (questionId: string) => setFlaggedQuestions((prev) => prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]);

  if (!exam && isLoadingExam) return <Flex align="center" justify="center" minH="screen"><Spinner size="xl" /></Flex>;
  if (!exam) return <Flex align="center" justify="center" minH="screen"><Text>Ujian tidak ditemukan.</Text></Flex>;
  if (isLocked) return <ExamLockedOverlay />;

  if (!sessionId) {
    return (
      <Flex direction="column" minH="screen" bg="gray.950" p={4}>
        <Flex align="center" justify="space-between" mb={4}>
          <Button variant="ghost" color="gray.300" onClick={() => router.push('/dashboard')}><ArrowLeft size={16} /> Kembali</Button>
          <Text color="gray.500" fontSize="xs">Lobi Ujian CBT</Text>
        </Flex>
        <Box bg="gray.900" borderRadius="3xl" p={6} border="1px solid" borderColor="whiteAlpha.100">
          <Heading size="lg" color="white">{t('confirmExamRules')}</Heading>
          <Text color="gray.400" mt={2}>Periksa informasi sebelum memulai.</Text>
          <SimpleGrid columns={1} gap={3} mt={6}>
            {[0, 1, 2].map((id) => (
              <Flex key={id} align="start" gap={3} p={4} bg="whiteAlpha.50" borderRadius="2xl" cursor="pointer" onClick={() => setCheckedTerms((prev) => ({ ...prev, [id]: !prev[id] }))}>
                <Checkbox.Root checked={checkedTerms[id]} onCheckedChange={() => {}}><Checkbox.HiddenInput /><Checkbox.Control /></Checkbox.Root>
                <Box><Text color="white" fontWeight="bold">Syarat {id + 1}</Text><Text color="gray.400" fontSize="sm">Persetujuan ujian.</Text></Box>
              </Flex>
            ))}
          </SimpleGrid>
          {isTokenRequired && <Input mt={5} value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Masukkan token ujian" />}
          {tokenError && <Text color="red.400" mt={2} fontSize="sm">{tokenError}</Text>}
          <Button mt={6} w="full" onClick={() => startSession(isTokenRequired ? tokenInput : undefined)} disabled={!allChecked}>Mulai Ujian Sekarang</Button>
        </Box>
      </Flex>
    );
  }

  return (
    <Box minH="screen" bg="gray.50">
      <Flex as="header" bg="white" borderBottom="1px solid" borderColor="gray.100" px={6} py={4} justify="space-between" align="center">
        <Box>
          <Heading size="md">{exam.title}</Heading>
          <Text fontSize="sm" color="gray.500">{exam.subject?.name}</Text>
        </Box>
        <ExamTimer startTime={timerStartTime} duration={exam.duration} overrideEndTime={timerEndTime} onTimeUp={finishExam} />
        <Button colorPalette="red" onClick={finishExam}><LogOut size={16} /> Selesai Ujian</Button>
      </Flex>
      <Flex>
        <Box flex={1} p={8}>
          {currentQuestion && (
            <QuestionCard question={currentQuestion} index={currentQuestionIndex} selectedAnswer={answers[currentQuestion.id]} onAnswer={(answer) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }))} isFlagged={flaggedQuestions.includes(currentQuestion.id)} onToggleFlag={() => toggleFlagQuestion(currentQuestion.id)} />
          )}
        </Box>
        <Box w="360px" p={4}>
          <ExamNav questions={exam.examQuestions} currentIndex={currentQuestionIndex} onSelect={setCurrentQuestionIndex} answeredQuestions={Object.keys(answers).filter((k) => answers[k]?.trim())} flaggedQuestions={flaggedQuestions} />
        </Box>
      </Flex>
      <ViolationWarningModal message={violationMessage} onAcknowledge={() => setShowViolationModal(false)} />
      <TimeAddedDialog open={showTimeAddedDialog} minutes={timeAddedMinutes} onOpenChange={setShowTimeAddedDialog} />
    </Box>
  );
}
