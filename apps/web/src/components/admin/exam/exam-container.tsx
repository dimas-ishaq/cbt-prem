'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, ShieldAlert, ArrowLeft, User, Clock, BookOpen, Award, CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  SimpleGrid,
  Stack,
  Checkbox,
  Input,
} from '@chakra-ui/react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { parseSessionAnswers, generateSEBConfig } from './exam-utils';
import { QuestionCard } from './_components/question-card';
import { ExamNav } from './_components/exam-nav';
import { ExamTimer } from './_components/exam-timer';
import { ViolationWarningModal } from './_components/violation-warning-modal';
import { ExamLockedOverlay } from './_components/exam-locked-overlay';
import { TimeAddedDialog } from './_components/time-added-dialog';

interface Props {
  examId: string;
}

export function ExamContainer({ examId }: Props) {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionEndTime, setSessionEndTime] = useState<string | undefined>(undefined);
  
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [showTimeAddedDialog, setShowTimeAddedDialog] = useState(false);
  const [timeAddedMinutes, setTimeAddedMinutes] = useState(5);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [checkedTerms, setCheckedTerms] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
  });

  const allChecked = checkedTerms[0] && checkedTerms[1] && checkedTerms[2];
  const user = useAuthStore((state) => state.user);

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error("Gagal masuk mode layar penuh:", err);
      });
    }
  };

  const router = useRouter();
  const socket = useSocket();
  const confirmDialog = useConfirm();
  const { playViolation, stopViolation, playSuccess } = useSound();

  const token = useAuthStore((state) => state.access_token);

  // Fetch exam details — guard dengan token agar tidak 401 saat hydration
  const { data: exam, isLoading: isLoadingExam, error: examError } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}`);
      return response.data;
    },
    enabled: !!token && !!examId,
    retry: false,
  });

  // Fetch settings for timezone
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  // Fetch student profile details (NIS, Jurusan, Rombel)
  const { data: profile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const response = await api.get('/students/me');
      return response.data;
    },
    enabled: user?.role === 'SISWA',
  });

  // Start/Get Session
  const startSessionMutation = useMutation({
    mutationFn: async (token?: string) => {
      const response = await api.post('/exam-sessions/start', { examId, token });
      return response.data;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setSessionEndTime(data.endTime);
      setTokenError('');
      if (data.status === 'LOCKED') {
        setIsLocked(true);
      }
      if (data.answers) {
        const existingAnswers: Record<string, string> = {};
        data.answers.forEach((ans: any) => {
          if (ans.essayAnswer) {
            existingAnswers[ans.questionId] = ans.essayAnswer;
          } else if (ans.selectedOptionId) {
            existingAnswers[ans.questionId] = ans.selectedOptionId;
          } else if (ans.selectedOption) {
            existingAnswers[ans.questionId] = ans.selectedOption;
          }
        });
        setAnswers(existingAnswers);
      }
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.message;
      if (errMsg === 'Invalid exam token' || errMsg === 'Invalid token') {
        setTokenError('Token yang Anda masukkan salah. Silakan coba lagi.');
      } else {
        setTokenError(errMsg || 'Gagal memulai ujian. Silakan coba lagi.');
      }
    }
  });

  useEffect(() => {
    if (!exam || !token || user?.role !== 'SISWA') return;
    if (sessionId) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await api.get(`/exam-sessions/${examId}`);
        if (cancelled) return;

        const data = response.data;
        if (data?.id && data?.status !== 'FINISHED') {
          setSessionId(data.id);
          setSessionEndTime(data.endTime);
          if (data.status === 'LOCKED') setIsLocked(true);
          if (data.answers) {
            const existingAnswers: Record<string, string> = {};
            data.answers.forEach((ans: any) => {
              if (ans.essayAnswer) existingAnswers[ans.questionId] = ans.essayAnswer;
              else if (ans.selectedOptionId) existingAnswers[ans.questionId] = ans.selectedOptionId;
              else if (ans.selectedOption) existingAnswers[ans.questionId] = ans.selectedOption;
            });
            setAnswers(existingAnswers);
          }
        }
      } catch {
        // no active session; stay on rules gate
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exam, token, user?.role, examId, sessionId]);



  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer, type }: { questionId: string, answer: string, type: string }) => {
      const payload: any = { questionId };
      if (type === 'ESSAY') {
        payload.essayAnswer = answer;
      } else {
        payload.selectedOptionId = answer;
      }
      return api.post(`/exam-sessions/${sessionId}/submit-answer`, payload);
    },
    onMutate: ({ questionId, answer }) => {
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
    },
    onSuccess: (_, variables) => {
      if (socket) {
        socket.emit('answer_changed', {
          examId,
          questionId: variables.questionId,
          answer: variables.answer,
        });
      }
    },
  });

  const finishExamMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/exam-sessions/${sessionId}/finish`);
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  // Keep a stable ref so socket listeners don't need finishExamMutation in their dep array
  const finishExamMutationRef = useRef(finishExamMutation);
  useEffect(() => { finishExamMutationRef.current = finishExamMutation; });

  // Hydrate the current session so reconnects/refreshed pages recover the authoritative end time.
  const { data: hydratedSession } = useQuery({
    queryKey: ['exam-session-hydration', sessionId],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const lastAnnouncedExtendedEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hydratedSession?.endTime || !hydratedSession?.startTime || !hydratedSession?.exam?.duration) return;

    const hydratedEndMs = new Date(hydratedSession.endTime).getTime();
    const startMs = new Date(hydratedSession.startTime).getTime();
    const baseEndMs = startMs + hydratedSession.exam.duration * 60 * 1000;

    if (Number.isNaN(hydratedEndMs) || Number.isNaN(startMs)) return;

    const hydratedEndTime = new Date(hydratedEndMs).toISOString();
    if (hydratedEndTime !== sessionEndTime) {
      setSessionEndTime(hydratedEndTime);
    }

    const extendedMinutes = Math.floor((hydratedEndMs - baseEndMs) / 60000);
    const wasExtended = extendedMinutes > 0;
    if (wasExtended && lastAnnouncedExtendedEndTimeRef.current !== hydratedEndMs) {
      lastAnnouncedExtendedEndTimeRef.current = hydratedEndMs;
      setTimeAddedMinutes(Math.max(1, extendedMinutes));
      setShowTimeAddedDialog(true);
    }
  }, [hydratedSession, sessionEndTime]);

  useEffect(() => {
    if (sessionEndTime && !showTimeAddedDialog) {
      lastAnnouncedExtendedEndTimeRef.current = new Date(sessionEndTime).getTime();
    }
  }, [sessionEndTime, showTimeAddedDialog]);

  useEffect(() => {
    if (!sessionId) return;

    let lastViolationTime = 0;
    const VIOLATION_COOLDOWN = 5000;

    const reportViolation = (type: string, description: string) => {
      // Jangan rekam pelanggaran jika semua fitur pengaman dinonaktifkan
      if (!exam?.forceFullscreen && !exam?.blockKeyCopyPaste && !exam?.sebConfigKey && !exam?.sebBrowserKey) {
        return;
      }

      const now = Date.now();
      if (now - lastViolationTime > VIOLATION_COOLDOWN) {
        if (socket) {
          socket.emit('violation_detected', {
            examId,
            type,
            description,
          });
        }
        playViolation();
        
        setViolationCount(prev => {
          const nextCount = prev + 1;
          if (exam?.maxViolations > 0 && nextCount >= exam.maxViolations) {
            setViolationMessage(description + ' Anda telah melebihi batas maksimum pelanggaran. Ujian Anda dikumpulkan otomatis.');
            setShowViolationModal(true);
            setTimeout(() => {
              finishExamMutation.mutate();
            }, 3000);
          } else {
            setViolationMessage(description);
            setShowViolationModal(true);
          }
          return nextCount;
        });
        
        lastViolationTime = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportViolation('TAB_SWITCH', 'Terdeteksi berpindah tab atau meminimalkan browser.');
      }
    };

    const handleBlur = () => {
      reportViolation('WINDOW_BLUR', 'Terdeteksi beralih fokus ke aplikasi atau jendela lain.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // 2. Keyboard & Mouse Protection
    const handleContextMenu = (e: MouseEvent) => {
      if (exam?.blockKeyCopyPaste) {
        e.preventDefault();
        reportViolation('CONTEXT_MENU', 'Terdeteksi klik kanan (membuka menu konteks).');
      }
    };

    const handleSelectStart = (e: Event) => {
      if (exam?.blockKeyCopyPaste) {
        e.preventDefault();
      }
    };

    const handleCopyCutPaste = (e: ClipboardEvent) => {
      if (exam?.blockKeyCopyPaste) {
        e.preventDefault();
        reportViolation('COPY_PASTE', 'Terdeteksi upaya menyalin atau menempel teks.');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!exam?.blockKeyCopyPaste) return;
      const isF12 = e.key === 'F12';
      const isCtrlShiftI = e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i');
      const isCtrlShiftJ = e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j');
      const isCtrlShiftC = e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c');
      const isCtrlC = e.ctrlKey && (e.key === 'C' || e.key === 'c');
      const isCtrlV = e.ctrlKey && (e.key === 'V' || e.key === 'v');
      const isCtrlU = e.ctrlKey && (e.key === 'U' || e.key === 'u');
      const isCtrlF = e.ctrlKey && (e.key === 'F' || e.key === 'f');

      if (isF12 || isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC || isCtrlC || isCtrlV || isCtrlU || isCtrlF) {
        e.preventDefault();
        reportViolation('KEYBOARD_SHORTCUT', 'Terdeteksi upaya menggunakan shortcut keyboard terlarang.');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('keydown', handleKeyDown);

    // 3. Forced Fullscreen Exit Detector
    const handleFullscreenChange = () => {
      if (exam?.forceFullscreen) {
        const isFullscreen = document.fullscreenElement || (document as any).webkitFullscreenElement;
        if (!isFullscreen) {
          reportViolation('FULLSCREEN_EXIT', 'Terdeteksi keluar dari mode layar penuh (Fullscreen).');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);



    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

    };
  }, [examId, socket, playViolation, sessionId, exam]);

  // Dedicated stable useEffect for proctor-driven socket events.
  // Re-registers when sessionId becomes available so time_added can refetch the correct session.
  useEffect(() => {
    if (!socket || !sessionId) return;

    const onSessionLocked = (data: any) => {
      if (data.examId === examId) {
        setIsLocked(true);
      }
    };
    const onSessionUnlocked = (data: any) => {
      if (data.examId === examId) {
        setIsLocked(false);
      }
    };
    const onSessionSubmitted = (data: any) => {
      if (data.examId === examId) {
        finishExamMutationRef.current.mutate();
      }
    };
    const onTimeAdded = async (data: any) => {
      if (data.examId !== examId) return;

      console.info('[exam:time_added] received', {
        examId: data.examId,
        sessionId,
        studentId: data.studentId,
        addedMinutes: data.addedMinutes,
        source: data.newEndTime ? 'socket_payload' : 'refetch',
      });

      let confirmedEndTime: string | null = null;
      try {
        const response = await api.get(`/exam-sessions/${sessionId}`);
        const refreshedEndTime = response.data?.endTime;
        console.info('[exam:time_added] refetch result', {
          examId,
          sessionId,
          hasEndTime: Boolean(refreshedEndTime),
          endTime: refreshedEndTime,
        });
        if (refreshedEndTime) {
          confirmedEndTime = new Date(refreshedEndTime).toISOString();
          setSessionEndTime(confirmedEndTime ?? undefined);
        } else if (data.newEndTime) {
          confirmedEndTime = typeof data.newEndTime === 'string'
            ? data.newEndTime
            : new Date(data.newEndTime).toISOString();
          setSessionEndTime(confirmedEndTime ?? undefined);
        }
      } catch (error) {
        console.error('[exam:time_added] refetch failed', {
          examId,
          sessionId,
          error,
          hasFallback: Boolean(data.newEndTime),
        });
        if (data.newEndTime) {
          confirmedEndTime = typeof data.newEndTime === 'string'
            ? data.newEndTime
            : new Date(data.newEndTime).toISOString();
          setSessionEndTime(confirmedEndTime ?? undefined);
        }
      }

      if (confirmedEndTime) {
        lastAnnouncedExtendedEndTimeRef.current = new Date(confirmedEndTime).getTime();
      }

      console.info('[exam:time_added] applied', {
        examId,
        sessionId,
        confirmedEndTime,
        addedMinutes: data.addedMinutes || 5,
      });

      setTimeAddedMinutes(data.addedMinutes || 5);
      setShowTimeAddedDialog(true);

      toast.success({
        title: 'Waktu Ditambahkan',
        description: `Pengawas telah menambahkan ${data.addedMinutes || 5} menit ke waktu ujian Anda.`,
      });
      playSuccess();
    };

    socket.on('session_locked', onSessionLocked);
    socket.on('session_unlocked', onSessionUnlocked);
    socket.on('session_submitted', onSessionSubmitted);
    socket.on('time_added', onTimeAdded);
    socket.on('student_time_added', onTimeAdded);

    return () => {
      socket.off('session_locked', onSessionLocked);
      socket.off('session_unlocked', onSessionUnlocked);
      socket.off('session_submitted', onSessionSubmitted);
      socket.off('time_added', onTimeAdded);
    };
  }, [socket, examId, playSuccess, sessionId]);

  useEffect(() => {
    if (socket && sessionId) {
      socket.emit('join_exam', { examId });
    }
  }, [socket, sessionId, examId]);

  useEffect(() => {
    if (socket && sessionId) {
      socket.emit('question_changed', {
        examId,
        questionIndex: currentQuestionIndex + 1,
      });
    }
  }, [socket, sessionId, examId, currentQuestionIndex]);



  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId) 
        : [...prev, questionId]
    );
  };

  // Deteksi error SEB: cek status 401 dengan berbagai variasi pesan
  const isSebError = (examError as any)?.response?.status === 401 && (
    (examError as any)?.response?.data?.message?.toLowerCase().includes('safe exam browser') ||
    (examError as any)?.response?.data?.message?.toLowerCase().includes('seb')
  );  if (isSebError) {
    return (
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        minH="100vh"
        w="100vw"
        bg="gray.950" 
        p={0}
        position="fixed"
        top={0}
        left={0}
        overflow="hidden"
        zIndex={9999}
      >
        {/* Animated Background Gradient */}
        <Box 
          position="absolute" 
          top="-20%" 
          left="-20%" 
          w="60vw" 
          h="60vw" 
          bg="red.900/20" 
          borderRadius="full" 
          filter="blur(120px)" 
          zIndex={0} 
          pointerEvents="none"
          animation="pulse 8s ease-in-out infinite"
        />
        <Box 
          position="absolute" 
          bottom="-20%" 
          right="-20%" 
          w="50vw" 
          h="50vw" 
          bg="orange.900/15" 
          borderRadius="full" 
          filter="blur(100px)" 
          zIndex={0} 
          pointerEvents="none"
        />

        {/* Main Content Container */}
        <Box
          bg="gray.900/85"
          backdropFilter="blur(32px)"
          w="full"
          maxW="3xl"
          borderRadius="4xl"
          p={{ base: 6, md: 10 }}
          boxShadow="2xl"
          border="1px solid"
          borderColor="red.500/20"
          zIndex={10}
          display="flex"
          flexDirection="column"
          overflowY="auto"
          textAlign="center"
          m={{ base: 4, md: 8 }}
          flex={1}
        >
          {/* Icon Badge */}
          <Flex 
            w={20} 
            h={20} 
            bg="red.500/15" 
            borderRadius="full" 
            align="center" 
            justify="center" 
            mx="auto" 
            mb={6} 
            border="2px solid" 
            borderColor="red.500/30"
          >
            <ShieldAlert className="text-red-500 animate-pulse" size={48} />
          </Flex>

          {/* Main Heading */}
          <Heading 
            size="2xl" 
            fontWeight="black" 
            color="white"
            mb={3}
            letterSpacing="tight"
          >
            Safe Exam Browser Diperlukan
          </Heading>

          {/* Subtitle */}
          <Text 
            color="gray.300" 
            fontSize="md" 
            mt={2}
            mb={8}
            lineHeight="relaxed"
            fontWeight="medium"
          >
            Ujian ini dikonfigurasi dengan pengamanan tingkat tinggi dan hanya dapat diakses melalui aplikasi <Text as="span" fontWeight="bold" color="red.300">Safe Exam Browser (SEB)</Text>.
          </Text>

          {/* Steps Section */}
          <Box 
            mt={8}
            mb={8}
            p={6} 
            bg="whiteAlpha.50" 
            borderRadius="3xl" 
            border="1px solid" 
            borderColor="whiteAlpha.100"
            textAlign="left"
          >
            <Text 
              fontWeight="bold" 
              color="indigo.300" 
              mb={4}
              fontSize="lg"
            >
              📋 Langkah-Langkah Mengikuti Ujian:
            </Text>
            <Stack gap={3}>
              <Flex gap={3} align="flex-start">
                <Flex 
                  w={8}
                  h={8}
                  bg="indigo.600"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  fontWeight="black"
                  color="white"
                  flexShrink={0}
                >
                  1
                </Flex>
                <Box>
                  <Text fontWeight="bold" color="white" mb={1}>Unduh Safe Exam Browser</Text>
                  <Text color="gray.400" fontSize="sm">Klik tombol download di bawah untuk mengunduh aplikasi SEB untuk platform Anda (Windows, macOS, atau Linux).</Text>
                </Box>
              </Flex>

              <Flex gap={3} align="flex-start">
                <Flex 
                  w={8}
                  h={8}
                  bg="indigo.600"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  fontWeight="black"
                  color="white"
                  flexShrink={0}
                >
                  2
                </Flex>
                <Box>
                  <Text fontWeight="bold" color="white" mb={1}>Unduh Konfigurasi SEB Ujian</Text>
                  <Text color="gray.400" fontSize="sm">Klik tombol download konfigurasi (.seb) untuk mendapatkan file pengaturan khusus ujian ini.</Text>
                </Box>
              </Flex>

              <Flex gap={3} align="flex-start">
                <Flex 
                  w={8}
                  h={8}
                  bg="indigo.600"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  fontWeight="black"
                  color="white"
                  flexShrink={0}
                >
                  3
                </Flex>
                <Box>
                  <Text fontWeight="bold" color="white" mb={1}>Buka Berkas Konfigurasi</Text>
                  <Text color="gray.400" fontSize="sm">Buka/double-click file konfigurasi (.seb) untuk meluncurkan SEB dan otomatis mengarahkan ke halaman ujian ini.</Text>
                </Box>
              </Flex>
            </Stack>
          </Box>

          {/* Download Buttons */}
          <Stack gap={4} mb={8}>
            {/* Download SEB Button */}
            <Button
              as="a"
              {...({
                href: "https://safeexambrowser.org/download_en.html",
                target: "_blank",
                rel: "noopener noreferrer"
              } as any)}
              w="full"
              py={6}
              bg="gradient-to-r from-red-600 to-red-700"
              color="white"
              fontWeight="bold"
              borderRadius="2xl"
              fontSize="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
              boxShadow="0 8px 24px rgba(220, 38, 38, 0.3)"
              _hover={{
                boxShadow: '0 12px 32px rgba(220, 38, 38, 0.5)',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.3s ease"
              cursor="pointer"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
              }}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ display: 'inline-block', flexShrink: 0 }}>
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3.5-9H10.5V5h-1v2H7.5v1h2v2h1v-2h2.5v-1z" />
              </svg>
              Unduh Safe Exam Browser
            </Button>

            {/* Download Config Button */}
            <Button
              onClick={() => {
                // Generate and download SEB config
                const sebConfig = generateSEBConfig(exam);
                const blob = new Blob([sebConfig], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${exam.title.replace(/\s+/g, '_')}_config.seb`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              w="full"
              py={6}
              bg="indigo.600"
              color="white"
              fontWeight="bold"
              borderRadius="2xl"
              fontSize="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
              boxShadow="0 8px 24px rgba(79, 70, 229, 0.3)"
              _hover={{
                bg: 'indigo.700',
                boxShadow: '0 12px 32px rgba(79, 70, 229, 0.5)',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.3s ease"
              cursor="pointer"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ display: 'inline-block', flexShrink: 0 }}>
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0z" />
              </svg>
              Unduh Konfigurasi SEB Ujian ({exam.title})
            </Button>
          </Stack>

          {/* Security Badge */}
          <Box 
            p={4}
            bg="amber.500/10"
            borderRadius="2xl"
            border="1px solid"
            borderColor="amber.500/30"
            mb={6}
          >
            <Flex gap={2} align="flex-start">
              <svg width="20" height="20" fill="currentColor" style={{ color: 'var(--chakra-colors-amber-400)', flexShrink: 0, marginTop: '2px' }} viewBox="0 0 20 20">
                <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
              </svg>
              <Box>
                <Text fontWeight="bold" color="amber.300" fontSize="sm">Sistem Keamanan Tingkat Tinggi</Text>
                <Text color="gray.400" fontSize="xs" mt={1}>SEB akan mendeteksi aktivitas mencurigakan seperti tab switching, screenshot, DevTools, dan upaya copy-paste.</Text>
              </Box>
            </Flex>
          </Box>

          {/* Return Button */}
          <Button
            onClick={() => router.push('/dashboard')}
            w="full"
            py={5}
            bg="gray.800"
            color="white"
            fontWeight="bold"
            borderRadius="2xl"
            _hover={{ bg: 'gray.700' }}
            cursor="pointer"
            fontSize="md"
            transition="all 0.3s ease"
          >
            ← Kembali ke Dashboard
          </Button>
        </Box>
      </Flex>
    );
  }

  if (isLoadingExam || !sessionId) {
    if (exam && !sessionId) {
      const isTokenRequired = !!exam.token;
      return (
        <Flex direction="column" h="screen" bg="gray.950" p={{ base: 4, md: 8 }} overflow="hidden" position="relative">
          {/* Glowing Background Orbs */}
          <Box position="absolute" top="-10%" left="-10%" w="50vw" h="50vw" bg="indigo.900/15" borderRadius="full" filter="blur(120px)" zIndex={0} pointerEvents="none" />
          <Box position="absolute" bottom="-10%" right="-10%" w="40vw" h="40vw" bg="violet.900/10" borderRadius="full" filter="blur(100px)" zIndex={0} pointerEvents="none" />

          {/* Top Bar with Back/Close Button */}
          <Flex align="center" justify="space-between" mb={4} zIndex={1} w="full">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
              borderRadius="xl"
              gap={2.5}
              px={4}
              py={5}
              fontSize="sm"
              fontWeight="bold"
              cursor="pointer"
            >
              <ArrowLeft size={16} />
              Kembali ke Dashboard
            </Button>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" letterSpacing="wider" textTransform="uppercase">
              Lobi Ujian CBT
            </Text>
          </Flex>

          {/* Main Glassmorphic Card Container */}
          <Box
            bg="gray.900/80"
            backdropFilter="blur(24px)"
            w="full"
            h="full"
            borderRadius="3xl"
            p={{ base: 6, md: 8 }}
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7)"
            border="1px solid"
            borderColor="whiteAlpha.100"
            display="flex"
            flexDirection="column"
            overflowY="auto"
            zIndex={1}
          >
            {/* Header */}
            <Flex justify="space-between" align="start" mb={6} borderBottom="1px solid" borderColor="whiteAlpha.100" pb={5} direction={{ base: 'column', sm: 'row' }} gap={4}>
              <Box>
                <Heading size="xl" fontWeight="black" color="white" letterSpacing="tight">
                  {t('confirmExamRules')}
                </Heading>
                <Text color="gray.400" fontSize="sm" mt={1}>
                  Harap periksa informasi peserta dan jadwal ujian dengan teliti sebelum memulai.
                </Text>
              </Box>
              <Box bg="indigo.500/10" border="1px solid" borderColor="indigo.500/30" px={4} py={2} borderRadius="xl">
                <Text fontSize="sm" fontWeight="black" color="indigo.300">
                  {exam.duration} MENIT
                </Text>
              </Box>
            </Flex>

            {/* Warning Banner */}
            <Box bg="amber.500/10" border="1px solid" borderColor="amber.500/30" p={4} borderRadius="2xl" mb={6}>
              <Flex gap={3} align="start">
                <Box bg="amber.500/20" p={2.5} borderRadius="xl" color="amber.300" mt={0.5}>
                  <ShieldAlert size={20} />
                </Box>
                <Box>
                  <Text fontWeight="extrabold" color="amber.300" fontSize="sm">Sistem Keamanan Ujian (Proctoring) Aktif</Text>
                  <Text color="gray.300" fontSize="xs" mt={1} lineHeight="relaxed">
                    Ujian ini mendeteksi aktivitas tab, aplikasi, dan status layar penuh browser Anda. Membuka jendela lain, shortcut devtools, atau meminimalkan browser akan dicatat otomatis sebagai tindakan pelanggaran tata tertib.
                  </Text>
                </Box>
              </Flex>
            </Box>

            {/* Grid for Student Info & Exam Info */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={6}>
              {/* Student Identity Box */}
              <Box p={5} bg="whiteAlpha.50" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" display="flex" flexDirection="column" justifyContent="space-between">
                <Heading size="xs" fontWeight="extrabold" color="indigo.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
                  Identitas Peserta Ujian
                </Heading>
                <Flex gap={4} align="center" mb={4}>
                  <Flex w={14} h={14} bg="indigo.600" borderRadius="full" align="center" justify="center" fontWeight="black" color="white" fontSize="xl" border="2px solid" borderColor="indigo.400">
                    {(profile?.fullName || user?.fullName)?.substring(0, 2).toUpperCase() || 'U'}
                  </Flex>
                  <Box>
                    <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Nama Lengkap</Text>
                    <Text fontSize="md" fontWeight="bold" color="white">{profile?.fullName || user?.fullName || '-'}</Text>
                  </Box>
                </Flex>
                <Stack gap={3}>
                  <Box>
                    <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Nomor Induk Siswa (NIS)</Text>
                    <Text fontSize="sm" fontWeight="bold" color="gray.200">{profile?.nis || user?.username || '-'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Jurusan & Rombel</Text>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.350">
                      {profile?.major?.name || 'Belum Ditentukan'} — {profile?.rombel?.name || 'Belum Ditentukan'}
                    </Text>
                  </Box>
                </Stack>
              </Box>

              {/* Exam Info Box */}
              <Box p={5} bg="whiteAlpha.50" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                <Heading size="xs" fontWeight="extrabold" color="amber.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
                  {t('examInstructions')}
                </Heading>
                <Stack gap={4}>
                  <Box>
                    <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider">Nama Mata Pelajaran</Text>
                    <Text fontSize="md" fontWeight="bold" color="white">{exam.title} ({exam.subject?.name})</Text>
                  </Box>
                  <SimpleGrid columns={3} gap={2}>
                    <Box bg="whiteAlpha.50" p={2.5} borderRadius="xl" textAlign="center" border="1px solid" borderColor="whiteAlpha.50">
                      <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Soal</Text>
                      <Text fontSize="sm" fontWeight="bold" color="white" mt={0.5}>{exam.examQuestions?.length || 0} Butir</Text>
                    </Box>
                    <Box bg="whiteAlpha.50" p={2.5} borderRadius="xl" textAlign="center" border="1px solid" borderColor="whiteAlpha.50">
                      <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Kategori</Text>
                      <Text fontSize="sm" fontWeight="bold" color="white" mt={0.5}>{exam.examGroup?.name || 'Umum'}</Text>
                    </Box>
                    <Box bg="whiteAlpha.50" p={2.5} borderRadius="xl" textAlign="center" border="1px solid" borderColor="whiteAlpha.50">
                      <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Kelulusan</Text>
                      <Text fontSize="sm" fontWeight="bold" color="white" mt={0.5}>{exam.passingGrade || 0} KKM</Text>
                    </Box>
                  </SimpleGrid>
                  <SimpleGrid columns={2} gap={4}>
                    <Box>
                      <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Mulai Ujian</Text>
                      <Text fontSize="xs" fontWeight="bold" color="gray.200" mt={0.5}>
                        {new Date(exam.startTime).toLocaleString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase">{t('stepFinish')}</Text>
                      <Text fontSize="xs" fontWeight="bold" color="gray.200" mt={0.5}>
                        {new Date(exam.endTime).toLocaleString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Box>
            </SimpleGrid>

            {/* Exam Guide Box */}
            <Box mb={6} p={5} bg="whiteAlpha.50" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
              <Heading size="xs" fontWeight="extrabold" color="teal.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
                Panduan Langkah Pengerjaan Ujian
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} fontSize="xs">
                <Box p={3.5} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.50">
                  <Text fontWeight="bold" color="teal.300" mb={1}>1. Masuk Fullscreen</Text>
                  <Text color="gray.400" lineHeight="relaxed">Sistem akan mengunci layar browser Anda ke mode layar penuh. Jangan menekan tombol ESC, Windows, atau beralih fokus.</Text>
                </Box>
                <Box p={3.5} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.50">
                  <Text fontWeight="bold" color="teal.300" mb={1}>2. Kerjakan Soal & Simpan</Text>
                  <Text color="gray.400" lineHeight="relaxed">Pilih opsi atau ketik jawaban Anda. Jawaban Anda secara otomatis tersimpan dan tersinkronisasi ke server secara realtime.</Text>
                </Box>
                <Box p={3.5} bg="whiteAlpha.50" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.50">
                  <Text fontWeight="bold" color="teal.300" mb={1}>{t('stepFinish')}</Text>
                  <Text color="gray.400" lineHeight="relaxed">{t('stepFinishDesc')}</Text>
                </Box>
              </SimpleGrid>
            </Box>

            {/* Checklist */}
            <Heading size="xs" fontWeight="extrabold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
              Syarat & Ketentuan Peserta (Harap Centang Seluruh Persyaratan)
            </Heading>
            <Stack gap={3} mb={6}>
              {[
                {
                  id: 0,
                  title: 'Keamanan & Integritas Ujian',
                  desc: 'Saya menyetujui bahwa selama ujian berlangsung, sistem proctoring akan memantau aktivitas layar saya. Saya bersedia tidak membuka tab baru, mencari jawaban di internet, atau berpindah ke aplikasi lain.'
                },
                {
                  id: 1,
                  title: 'Kemandirian & Kejujuran Akademik',
                  desc: 'Saya menyatakan akan mengerjakan soal-soal ujian ini secara mandiri dan jujur, tanpa bantuan dari orang lain maupun alat bantu yang tidak diizinkan.'
                },
                {
                  id: 2,
                  title: 'Konsekuensi Pelanggaran',
                  desc: 'Saya memahami bahwa pelanggaran berulang terhadap tata tertib ujian dapat mengakibatkan sesi ujian saya dikunci secara otomatis oleh sistem, dan nilai ujian saya dibatalkan.'
                }
              ].map((item) => (
                <Flex
                  key={item.id}
                  align="start"
                  p={4.5}
                  borderRadius="2xl"
                  border="1.5px solid"
                  borderColor={checkedTerms[item.id] ? 'indigo.500' : 'whiteAlpha.100'}
                  bg={checkedTerms[item.id] ? 'indigo.950/20' : 'whiteAlpha.50'}
                  transition="all 0.2s"
                  cursor="pointer"
                  onClick={() => setCheckedTerms(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  _hover={{ borderColor: 'indigo.500/50', bg: 'whiteAlpha.100' }}
                >
                  <Checkbox.Root
                    checked={checkedTerms[item.id] || false}
                    onCheckedChange={() => {}}
                    mr="18px"
                    mt="4px"
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control cursor="pointer" />
                  </Checkbox.Root>
                  <Box>
                    <Text fontWeight="bold" color={checkedTerms[item.id] ? 'white' : 'gray.200'} fontSize="sm">
                      {item.title}
                    </Text>
                    <Text color="gray.400" fontSize="xs" mt={1} lineHeight="relaxed">
                      {item.desc}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Stack>

            {/* Token Section */}
            {isTokenRequired && (
              <Box mb={6} p={5} bg="whiteAlpha.50" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                <Text fontSize="xs" fontWeight="bold" color="indigo.300" mb={3} textTransform="uppercase" letterSpacing="wider">
                  Masukkan Token Ujian
                </Text>
                <Input
                  placeholder={allChecked ? "Masukkan 8 digit token" : "Centang semua persetujuan di atas untuk mengisi token"}
                  value={tokenInput}
                  disabled={!allChecked}
                  onChange={(e) => {
                    setTokenInput(e.target.value.toUpperCase());
                    setTokenError('');
                  }}
                  w="full"
                  h="auto"
                  py={3.5}
                  px={4.5}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={tokenError ? 'red.500' : (allChecked ? 'indigo.500' : 'transparent')}
                  bg={allChecked ? 'gray.950' : 'whiteAlpha.50'}
                  color={allChecked ? 'white' : 'whiteAlpha.400'}
                  fontSize="lg"
                  fontWeight="black"
                  letterSpacing={allChecked ? '4px' : 'normal'}
                  textAlign="center"
                  _focus={{ outline: 'none', borderColor: 'indigo.500' }}
                  cursor={allChecked ? 'text' : 'not-allowed'}
                />
                {!allChecked && (
                  <Text color="gray.500" fontSize="3xs" fontWeight="bold" mt={2.5} textAlign="center">
                    * Input token dikunci hingga seluruh persetujuan di atas dicentang
                  </Text>
                )}
                {tokenError && (
                  <Text color="red.400" fontSize="xs" fontWeight="bold" mt={2.5} textAlign="center">
                    {tokenError}
                  </Text>
                )}
              </Box>
            )}

            {/* Action Button */}
            <Button
              onClick={() => {
                enterFullScreen();
                startSessionMutation.mutate(isTokenRequired ? tokenInput : undefined);
              }}
              disabled={
                startSessionMutation.isPending || 
                !allChecked || 
                (isTokenRequired && tokenInput.trim().length === 0)
              }
              bg={allChecked ? "indigo.600" : "whiteAlpha.100"}
              color={allChecked ? "white" : "whiteAlpha.400"}
              _hover={allChecked ? { bg: 'indigo.700', boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)' } : {}}
              borderRadius="2xl"
              fontWeight="black"
              py={7}
              cursor={allChecked ? "pointer" : "not-allowed"}
              w="full"
              shadow="lg"
              fontSize="md"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {startSessionMutation.isPending ? 'Mempersiapkan Ujian...' : 'Mulai Ujian Sekarang'}
            </Button>
          </Box>
        </Flex>
      );
    }

    return (
      <Flex direction="column" align="center" justify="center" minH="screen" bg="gray.50">
        <Spinner size="xl" color="indigo.600" mb={4} />
        <Text color="gray.600" fontWeight="semibold">Memuat lembar ujian...</Text>
      </Flex>
    );
  }

  const currentQuestion = exam.examQuestions[currentQuestionIndex].question;
  const answeredCount = Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length;
  const totalQuestions = exam.examQuestions.length;

  const timerStartTime = sessionEndTime || startSessionMutation.data?.endTime;
  const timerBaseStartTime = startSessionMutation.data?.startTime || exam.startTime || timerStartTime || new Date().toISOString();

  return (
    <Box display="flex" flexDirection="column" h="screen" bg="gray.50" userSelect="none">
      {/* Header */}
      <Flex as="header" bg="white" borderBottom="1px solid" borderColor="gray.100" px={6} py={4} justify="space-between" align="center" shadow="sm" zIndex={10} w="full">
        <Flex align="center" gap={4}>
          <Box bg="indigo.50" p={2.5} borderRadius="xl" border="1px solid" borderColor="indigo.100">
            <ShieldAlert size={22} className="text-indigo-600 animate-pulse" />
          </Box>
          <Box>
            <Heading size="md" fontWeight="bold" color="gray.850" letterSpacing="tight" lineHeight="tight">
              {exam.title}
            </Heading>
            <Text fontSize="2xs" fontWeight="semibold" color="gray.400" mt={0.5} textTransform="uppercase" letterSpacing="wider">
              {exam.subject.name}
            </Text>
          </Box>
        </Flex>

        {/* Timer */}
        <ExamTimer 
          startTime={timerBaseStartTime} 
          duration={exam.duration} 
          overrideEndTime={timerStartTime}
          onTimeUp={() => finishExamMutation.mutate()} 
        />

        {/* Action Button */}
        <Button
          onClick={async () => {
            const unanswered = totalQuestions - answeredCount;
            let title = t('confirmFinishTitle');
            let description = t('confirmFinishDesc');
            
            if (unanswered > 0) {
              title = t('confirmUnansweredTitle');
              description = t('confirmUnansweredDesc', { unanswered, totalQuestions });
            }

            const confirmed = await confirmDialog({
              title,
              description,
              confirmText: t('yesFinish')
            });
            if (confirmed) {
              finishExamMutation.mutate();
            }
          }}
          colorPalette="red"
          borderRadius="xl"
          fontWeight="bold"
          fontSize="sm"
          px={5}
          py={5}
          cursor="pointer"
        >
          <LogOut size={16} />
          Selesai Ujian
        </Button>
      </Flex>

      {/* Main Workspace */}
      <Flex flex={1} overflow="hidden">
        {/* Left Side: Question View */}
        <Flex flex={1} overflowY="auto" p={8} direction="column" justify="space-between">
          <Box maxW="4xl" mx="auto" w="full">
            <QuestionCard
              question={currentQuestion}
              index={currentQuestionIndex}
              selectedAnswer={answers[currentQuestion.id]}
              onAnswer={(answer) => submitAnswerMutation.mutate({ 
                questionId: currentQuestion.id, 
                answer,
                type: currentQuestion.type
              })}
              isFlagged={flaggedQuestions.includes(currentQuestion.id)}
              onToggleFlag={() => toggleFlagQuestion(currentQuestion.id)}
              isDisabled={isLocked}
            />
          </Box>
          
          {/* Navigation Bar */}
          <Flex maxW="4xl" mx="auto" w="full" mt={8} justify="space-between" align="center" py={4} bg="white" px={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
            <Button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              variant="outline"
              colorPalette="gray"
              borderRadius="xl"
              fontWeight="semibold"
              px={5}
              py={5}
              fontSize="sm"
              cursor="pointer"
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </Button>
            
            <Text fontSize="2xs" fontWeight="semibold" color="gray.400" textTransform="uppercase">
              {t('questionProgress', { current: currentQuestionIndex + 1, total: totalQuestions })}
            </Text>

            <Button
              disabled={currentQuestionIndex === totalQuestions - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              colorPalette="indigo"
              borderRadius="xl"
              fontWeight="semibold"
              px={5}
              py={5}
              fontSize="sm"
              cursor="pointer"
            >
              Selanjutnya
              <ChevronRight size={16} />
            </Button>
          </Flex>
        </Flex>

        {/* Right Side: Sidebar Navigation */}
        <Flex as="aside" w={80} bg="white" borderLeft="1px solid" borderColor="gray.100" direction="column" justify="space-between">
          <Box p={6} overflowY="auto" flex={1}>
            <Heading size="sm" fontWeight="bold" color="gray.850" mb={2} display="flex" alignItems="center" gap={2}>
              <HelpCircle size={17} className="text-indigo-500" />
              {t('questionNavigationLabel')}
            </Heading>
            <Text fontSize="2xs" color="gray.450" fontWeight="medium" mb={6}>
              {t('questionNavigationDesc')}
            </Text>
            
            <ExamNav
              questions={exam.examQuestions}
              currentIndex={currentQuestionIndex}
              onSelect={setCurrentQuestionIndex}
              answeredQuestions={Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '')}
              flaggedQuestions={flaggedQuestions}
            />
          </Box>

          {/* Stats Footer */}
          <Box p={6} borderTop="1px solid" borderColor="gray.50" bg="gray.50/50">
            <SimpleGrid columns={2} gap={3} mb={4}>
              <Box bg="emerald.50/30" p={3.5} borderRadius="2xl" border="1px solid" borderColor="emerald.100" shadow="xs" textAlign="center">
                <Flex justify="center" align="center" gap={1.5} mb={1}>
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <Text fontSize="2xl" fontWeight="black" color="emerald.600">{answeredCount}</Text>
                </Flex>
                <Text fontSize="3xs" fontWeight="extrabold" color="emerald.700" textTransform="uppercase" letterSpacing="wider">Terjawab</Text>
              </Box>
              <Box bg="amber.50/30" p={3.5} borderRadius="2xl" border="1px solid" borderColor="amber.100" shadow="xs" textAlign="center">
                <Flex justify="center" align="center" gap={1.5} mb={1}>
                  <Bookmark size={15} className="text-amber-500 fill-amber-500" />
                  <Text fontSize="2xl" fontWeight="black" color="amber.600">{flaggedQuestions.length}</Text>
                </Flex>
                <Text fontSize="3xs" fontWeight="extrabold" color="amber.700" textTransform="uppercase" letterSpacing="wider">Ragu-Ragu</Text>
              </Box>
            </SimpleGrid>
            
            <Flex justify="space-between" align="center" fontSize="2xs" color="gray.450" px={1}>
              <Text>Sisa Belum Terjawab:</Text>
              <Text fontWeight="bold" color="gray.700">{totalQuestions - answeredCount} soal</Text>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      {showViolationModal && (
        <ViolationWarningModal
          message={violationMessage}
          onAcknowledge={() => {
            if (exam?.forceFullscreen) {
              enterFullScreen();
            }
            stopViolation();
            setShowViolationModal(false);
          }}
        />
      )}

      {isLocked && <ExamLockedOverlay />}

      <TimeAddedDialog
        open={showTimeAddedDialog}
        minutes={timeAddedMinutes}
        onOpenChange={setShowTimeAddedDialog}
      />
    </Box>
  );
}
