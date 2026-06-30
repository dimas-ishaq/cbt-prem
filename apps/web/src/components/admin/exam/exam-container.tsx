'use client';

import { Box, Flex, Spinner, Text, Heading, Button } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';
import { useAuthStore } from '@/store/auth.store';
import { classifyExamMutationError, parsePendingExamAnswers } from './exam-utils';
import { ExamCompletion } from './_components/exam-completion';
import { ExamConfirmDialog } from './_components/exam-confirm-dialog';
import { ExamLockedOverlay } from './_components/exam-locked-overlay';
import { ExamNotFound } from './_components/exam-not-found';
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

  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Guard to prevent finishExam from running concurrently (e.g. violation auto-submit + timer)
  const isFinishingRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    setIsFullscreen(!!document.fullscreenElement);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const [showTimeAddedDialog, setShowTimeAddedDialog] = useState(false);
  const [timeAddedMinutes, setTimeAddedMinutes] = useState(5);
  const [checkedTerms, setCheckedTerms] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');

  const { data: serverTime } = useQuery({
    queryKey: ['server-time'],
    queryFn: async () => {
      const res = await api.get('/server-time');
      return res.data.serverTime as string;
    },
    refetchInterval: 30000,
  });

  const { data: exam, isLoading: isLoadingExam, error: examError } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => (await api.get(`/exams/${examId}`)).data,
    enabled: !!token && !!examId,
    retry: false,
  });

  const {
    sessionId,
    sessionStartTime,
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

  const pendingSyncLockRef = useRef(false);
  const answerRevisionRef = useRef(0);
  const finishReasonRef = useRef<'manual' | 'timer' | 'violation' | 'system' | null>(null);

  const readPendingAnswers = () => {
    if (!sessionId) return {};
    try {
      return parsePendingExamAnswers(localStorage.getItem(`exam_pending_sync_${examId}_${sessionId}`) ? JSON.parse(localStorage.getItem(`exam_pending_sync_${examId}_${sessionId}`) || '{}') : {});
    } catch (error) {
      console.error('Failed to parse pending sync answers:', error);
      return {};
    }
  };

  const writePendingAnswers = (pending: Record<string, unknown>) => {
    if (!sessionId) return;
    localStorage.setItem(`exam_pending_sync_${examId}_${sessionId}`, JSON.stringify(pending));
  };

  // Sync function to upload pending answers
  // NOTE: defined before finishExam so finishExam can call it
  const syncPendingAnswers = async () => {
    if (!sessionId || !exam) return;
    if (pendingSyncLockRef.current) return;

    pendingSyncLockRef.current = true;
    try {
      const pending = readPendingAnswers();
      const keys = Object.keys(pending);
      if (keys.length === 0) return;

      for (const qId of keys) {
        const item = pending[qId];
        if (!item || !item.questionObjId) continue;

        const payload: any = { questionId: item.questionObjId };
        if (item.type === 'ESSAY') {
          payload.essayAnswer = item.answer;
        } else {
          payload.selectedOptionId = item.answer;
        }

        try {
          await api.post(`/exam-sessions/${sessionId}/submit-answer`, payload);
          const currentPending = readPendingAnswers();
          delete currentPending[qId];
          writePendingAnswers(currentPending);
        } catch (err) {
          const classified = classifyExamMutationError(err);
          if (classified.kind === 'already-completed' || classified.kind === 'not-found') {
            console.warn(`Skip sync for ${qId}: session completed or missing (${classified.status ?? 'n/a'}).`);
            return;
          }
          console.error(`Failed to sync answer for question ${qId}:`, classified.message || err);
          throw err;
        }
      }
    } finally {
      pendingSyncLockRef.current = false;
    }
  };

  const finishExam = async (reason: 'manual' | 'timer' | 'violation' | 'system' = 'system') => {
    if (!sessionId) return;
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    finishReasonRef.current = reason;

    try {
      try {
        await syncPendingAnswers();
      } catch (error) {
        const classified = classifyExamMutationError(error);
        if (classified.kind !== 'already-completed' && classified.kind !== 'not-found') {
          console.error('Failed to sync pending answers before finishing:', classified.message || error);
        }
      }

      try {
        await api.post(`/exam-sessions/${sessionId}/finish`, { reason });
      } catch (err) {
        const classified = classifyExamMutationError(err);
        if (classified.kind === 'already-completed') {
          console.warn('Session already completed - treating as finished.');
        } else if (classified.kind === 'not-found') {
          console.warn('Session missing - treating as finished to avoid duplicate state.');
        } else {
          throw err;
        }
      }

      try {
        localStorage.removeItem(`exam_backup_${examId}_${sessionId}`);
        localStorage.removeItem(`exam_pending_sync_${examId}_${sessionId}`);
        localStorage.removeItem(`exam_finish_reason_${examId}_${sessionId}`);
      } catch (e) {
        console.error('Failed to clear local storage on finish:', e);
      }
      setIsCompleted(true);
    } finally {
      isFinishingRef.current = false;
      finishReasonRef.current = null;
    }
  };

  const totalQuestions = exam?.examQuestions?.length || 0;
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const flaggedCount = flaggedQuestions.length;
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  const handleManualFinishTrigger = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmFinish = async () => {
    setShowConfirmDialog(false);
    setIsFinishing(true);
    try {
      await finishExam();
    } finally {
      setIsFinishing(false);
    }
  };

  // Load local backup and merge with server answers when sessionId/exam changes
  useEffect(() => {
    if (!sessionId || !exam) return;
    try {
      const backupStr = localStorage.getItem(`exam_backup_${examId}_${sessionId}`);
      if (backupStr) {
        const backup = JSON.parse(backupStr);
        const validQuestionIds = new Set(exam.examQuestions.map((q: any) => q.question.id));

        // Filter out legacy relation IDs
        const filteredBackup: Record<string, string> = {};
        Object.keys(backup).forEach((key) => {
          if (validQuestionIds.has(key)) {
            filteredBackup[key] = backup[key];
          }
        });

        // Save sanitized backup back to localStorage
        localStorage.setItem(`exam_backup_${examId}_${sessionId}`, JSON.stringify(filteredBackup));

        setAnswers((prev) => {
          const merged = { ...prev, ...filteredBackup };
          const pendingStr = localStorage.getItem(`exam_pending_sync_${examId}_${sessionId}`);
          if (pendingStr) {
            const pending = JSON.parse(pendingStr);
            const filteredPending: Record<string, any> = {};
            
            Object.keys(pending).forEach((qId) => {
              if (validQuestionIds.has(qId)) {
                filteredPending[qId] = pending[qId];
                merged[qId] = pending[qId].answer;
              }
            });
            localStorage.setItem(`exam_pending_sync_${examId}_${sessionId}`, JSON.stringify(filteredPending));
          }
          return merged;
        });
      }
    } catch (e) {
      console.error('Failed to restore local exam backup:', e);
    }
  }, [sessionId, exam, examId, setAnswers]);

  // Sync on online status restoration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      syncPendingAnswers();
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [sessionId, exam]);

  // Also sync pending answers periodically or on load
  useEffect(() => {
    if (sessionId && exam) {
      syncPendingAnswers();
    }
  }, [sessionId, exam]);

  // Emit current question index when navigating questions
  useEffect(() => {
    if (socket && sessionId && exam) {
      socket.emit('question_changed', { examId, questionIndex: currentQuestionIndex });
    }
  }, [currentQuestionIndex, socket, sessionId, examId, exam]);

  useExamRealtime({ socket, examId, sessionId, userId: user?.id, playSuccess, setIsLocked, finishExam, setSessionEndTime, setTimeAddedMinutes, setShowTimeAddedDialog });
  useExamViolation({ enabled: true, exam, examId, socket, sessionId, playViolation, finishExam, setViolationCount, setViolationMessage, setShowViolationModal });

  const isTokenRequired = !!exam?.token;
  const allTermsChecked = REQUIRED_TERM_IDS.every((id) => checkedTerms[id]);
  const disableStart = isStartingSession || !allTermsChecked || (isTokenRequired && !tokenInput.trim());
  const currentQuestion = exam?.examQuestions?.[currentQuestionIndex] ?? null;
  // timerEndTime: gunakan sessionEndTime (override dari proktor/tambah waktu) jika ada,
  // jika tidak, hitung dari waktu siswa mulai sesi + durasi ujian.
  // JANGAN gunakan exam.endTime karena itu adalah batas waktu ujian dibuka, bukan durasi per siswa.
  const sessionDurationEndTime = sessionStartTime
    ? new Date(new Date(sessionStartTime).getTime() + (exam?.duration ?? 0) * 60 * 1000).toISOString()
    : undefined;
  const timerEndTime = sessionEndTime || sessionDurationEndTime;
  const timerServerTime = serverTime || undefined;
  // timerStartTime: gunakan waktu siswa mulai sesi (bukan waktu ujian dibuka).
  // Fallback ke exam.startTime hanya jika belum ada sesi (misal: sebelum mulai).
  const timerStartTime = sessionStartTime || exam?.startTime || new Date().toISOString();

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
      if (exam?.forceFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error('Failed to enter fullscreen:', err);
        });
      }
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || error.response?.data?.error || error.message
        : 'Gagal memulai ujian. Silakan coba lagi.';
      setTokenError(Array.isArray(message) ? message[0] : String(message));
    }
  };

  if (isLoadingExam) {
    return (
      <Flex minH="100dvh" bg="dd.canvas" align="center" justify="center" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
        <Box textAlign="center">
          <Spinner size="xl" color="dd.brand" mb={4} />
          <Text color="dd.text.muted" fontSize="13px">Memuat ujian...</Text>
        </Box>
      </Flex>
    );
  }

  if (examError) {
    const axiosErr = examError as AxiosError;
    const status = axiosErr.response?.status;
    if (status === 403) return <ExamNotFound status="forbidden" />;
    if (status === 404) return <ExamNotFound status="not-found" />;
    return <ExamNotFound status="error" message={axiosErr.message} />;
  }

  if (!exam) return <ExamNotFound status="not-found" />;
  if (isCompleted) return <ExamCompletion subjectName={exam?.subject?.name} examTitle={exam?.title} />;
  if (isLocked) return <ExamLockedOverlay />;

  // Enforce fullscreen if active session and forceFullscreen is enabled
  if (sessionId && exam?.forceFullscreen && !isFullscreen) {
    return (
      <Flex position="fixed" inset={0} zIndex={99999} bg="dd.canvas" align="center" justify="center" p={6} textAlign="center" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
        <Box maxW="md" bg="dd.surface" borderRadius="md" p={8} border="1px solid" borderColor="dd.border" boxShadow="0 1px 4px rgba(0,0,0,0.05)">
          <Flex w={16} h={16} bg="dd.brand.subtle" borderRadius="full" align="center" justify="center" mx="auto" mb={6} border="2px solid" borderColor="dd.brand">
            <Maximize color="dd.brand" className="animate-pulse" size={32} />
          </Flex>
          <Heading size="md" fontWeight="bold" color="dd.text" mb={3}>Wajib Mode Layar Penuh</Heading>
          <Text color="dd.text.muted" fontSize="13px" lineHeight="1.4" mb={8}>
            Untuk menjaga integritas dan keamanan ujian, Anda wajib menggunakan mode layar penuh. Pengerjaan ujian akan ditangguhkan sampai Anda masuk ke mode ini.
          </Text>
          <Button
            bg="dd.brand"
            color="white"
            size="lg"
            borderRadius="md"
            w="full"
            fontSize="14px"
            fontWeight="bold"
            _hover={{ bg: 'dd.brand.hover' }}
            onClick={() => {
              document.documentElement.requestFullscreen().catch((err) => {
                console.error('Failed to enter fullscreen:', err);
              });
            }}
          >
            Aktifkan Layar Penuh
          </Button>
        </Box>
      </Flex>
    );
  }

  if (isRestoringSession) return <Flex align="center" justify="center" minH="screen" bg="dd.canvas"><Spinner size="xl" color="dd.brand" /></Flex>;
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
    <Box minH="screen" bg="dd.canvas">
      <ExamHeader title={exam.title} subjectName={exam.subject?.name} startTime={timerStartTime} duration={exam.duration} overrideEndTime={timerEndTime} serverTime={timerServerTime} onTimeUp={finishExam} onFinish={handleManualFinishTrigger} disableFinish={unansweredCount > 0} />
      <Box flex={1} p={6}>
        <ExamWorkspace
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          onAnswer={async (questionId, answer) => {
            // 1. Update React state immediately & save local backup
            setAnswers((prev) => {
              const nextAnswers = { ...prev, [questionId]: answer };
              if (sessionId) {
                localStorage.setItem(`exam_backup_${examId}_${sessionId}`, JSON.stringify(nextAnswers));
              }
              return nextAnswers;
            });

            if (!sessionId) return;
            const currentQuestionObj = exam.examQuestions.find((q: any) => q.question.id === questionId)?.question;

            // 2. Queue into pending sync in localStorage
            try {
              const pending = JSON.parse(localStorage.getItem(`exam_pending_sync_${examId}_${sessionId}`) || '{}');
              pending[questionId] = {
                answer,
                type: currentQuestionObj?.type,
                questionObjId: currentQuestionObj?.id
              };
              localStorage.setItem(`exam_pending_sync_${examId}_${sessionId}`, JSON.stringify(pending));
            } catch (e) {
              console.error('Failed to queue pending answer:', e);
            }

            // 3. Try syncing immediately
            await syncPendingAnswers();

            // 4. Emit socket event
            if (socket && sessionId) {
              socket.emit('answer_changed', { examId, questionId, answer });
            }
          }}
          onToggleFlag={(questionId) => setFlaggedQuestions((prev) => prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId])}
          questions={exam.examQuestions}
          onSelectQuestion={setCurrentQuestionIndex}
          onPrevious={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
          onNext={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, exam.examQuestions.length - 1))}
          onFinish={handleManualFinishTrigger}
          disableFinish={unansweredCount > 0}
        />
      </Box>
      <ViolationWarningModal open={showViolationModal} message={violationMessage} onAcknowledge={() => setShowViolationModal(false)} />
      <TimeAddedDialog open={showTimeAddedDialog} minutes={timeAddedMinutes} onOpenChange={setShowTimeAddedDialog} />
      <ExamConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmFinish}
        totalQuestions={totalQuestions}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        flaggedCount={flaggedCount}
        isSubmitting={isFinishing}
      />
    </Box>
  );
}

