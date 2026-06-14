'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { QuestionCard } from './question-card';
import { ExamNav } from './exam-nav';
import { ExamTimer } from './exam-timer';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  SimpleGrid,
  Stack,
} from '@chakra-ui/react';

interface Props {
  examId: string;
}

export function ExamContainer({ examId }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  
  const router = useRouter();
  const socket = useSocket();

  // Fetch exam details
  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}`);
      return response.data;
    },
  });

  // Start/Get Session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/exam-sessions/start', { examId });
      return response.data;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
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
      if (socket) {
        socket.emit('join_exam', { examId });
      }
    },
  });

  useEffect(() => {
    startSessionMutation.mutate();

    let lastViolationTime = 0;
    const VIOLATION_COOLDOWN = 5000;

    const reportViolation = (type: string, description: string) => {
      const now = Date.now();
      if (now - lastViolationTime > VIOLATION_COOLDOWN) {
        if (socket) {
          socket.emit('violation_detected', {
            examId,
            type,
            description,
          });
        }
        setViolationMessage(description);
        setShowViolationModal(true);
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

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [examId, socket]);

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

  const toggleFlagQuestion = (questionId: string) => {
    setFlaggedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId) 
        : [...prev, questionId]
    );
  };

  if (isLoadingExam || !sessionId) {
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
          startTime={startSessionMutation.data?.startTime || new Date().toISOString()} 
          duration={exam.duration} 
          onTimeUp={() => finishExamMutation.mutate()} 
        />

        {/* Action Button */}
        <Button
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin menyelesaikan ujian? Nilai Anda akan langsung diproses.')) {
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
              Soal {currentQuestionIndex + 1} dari {totalQuestions}
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
            <Heading size="sm" fontWeight="bold" color="gray.850" mb={2}>
              Navigasi Soal
            </Heading>
            <Text fontSize="2xs" color="gray.450" fontWeight="medium" mb={6}>
              Pilih nomor untuk langsung melompat ke soal terkait.
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
              <Box bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="xs" textAlign="center">
                <Text fontSize="2xl" fontWeight="black" color="indigo.600">{answeredCount}</Text>
                <Text fontSize="3xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mt={1}>Terjawab</Text>
              </Box>
              <Box bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="xs" textAlign="center">
                <Text fontSize="2xl" fontWeight="black" color="amber.500">{flaggedQuestions.length}</Text>
                <Text fontSize="3xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mt={1}>Ragu-Ragu</Text>
              </Box>
            </SimpleGrid>
            
            <Flex justify="space-between" align="center" fontSize="2xs" color="gray.450" px={1}>
              <Text>Sisa Belum Terjawab:</Text>
              <Text fontWeight="bold" color="gray.700">{totalQuestions - answeredCount} soal</Text>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      {/* Proctoring Warning Modal */}
      {showViolationModal && (
        <Flex position="fixed" inset={0} zIndex={50} bg="black/60" backdropFilter="blur(4px)" align="center" justify="center" p={4}>
          <Box bg="white" w="full" maxW="md" borderRadius="2xl" p={6} boxShadow="2xl" border="1px solid" borderColor="red.50" textAlign="center" className="animate-bounce-short">
            <Flex w={14} h={14} bg="red-50" borderRadius="full" align="center" justify="center" mx="auto" mb={4} border="1px solid" borderColor="red.100">
              <AlertTriangle className="text-red-600" size={28} />
            </Flex>
            <Heading size="md" fontWeight="bold" color="gray.850">Peringatan Keamanan Ujian</Heading>
            <Text color="gray.500" fontSize="sm" mt={2} lineHeight="relaxed">
              {violationMessage}
            </Text>
            <Box mt={4} p={3} bg="amber-50" border="1px solid" borderColor="amber-100" borderRadius="xl" fontSize="xs" color="amber-700" fontWeight="medium">
              Aktivitas perpindahan layar dicatat oleh sistem pengawas (proctoring). Pelanggaran berulang dapat membatalkan sesi ujian Anda.
            </Box>
            <Button
              onClick={() => setShowViolationModal(false)}
              mt={6}
              w="full"
              py={5}
              bg="gray.850"
              color="white"
              fontWeight="bold"
              borderRadius="xl"
              _hover={{ bg: 'gray.900' }}
              cursor="pointer"
              fontSize="sm"
            >
              Saya Mengerti & Kembali ke Ujian
            </Button>
          </Box>
        </Flex>
      )}
    </Box>
  );
}
