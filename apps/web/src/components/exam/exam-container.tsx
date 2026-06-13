'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { QuestionCard } from './question-card';
import { ExamNav } from './exam-nav';
import { ExamTimer } from './exam-timer';
import { useRouter } from 'next/navigation';

interface Props {
  examId: string;
}

export function ExamContainer({ examId }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
      // Initialize answers from existing session
      if (data.answers) {
        const existingAnswers: Record<string, string> = {};
        data.answers.forEach((ans: any) => {
          if (ans.essayAnswer) {
            existingAnswers[ans.questionId] = ans.essayAnswer;
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

    // Violation detection: Tab switching and Focus loss
    let lastViolationTime = 0;
    const VIOLATION_COOLDOWN = 5000; // 5 seconds cooldown

    const reportViolation = (type: string, description: string) => {
      const now = Date.now();
      if (now - lastViolationTime > VIOLATION_COOLDOWN && socket) {
        socket.emit('violation_detected', {
          examId,
          type,
          description,
        });
        lastViolationTime = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportViolation('TAB_SWITCH', 'Student left the exam page/switched tabs');
      }
    };

    const handleBlur = () => {
      reportViolation('WINDOW_BLUR', 'Student switched to another application/window');
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
      // Optimistic update
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

  if (isLoadingExam || !sessionId) return <div>Loading exam...</div>;

  const currentQuestion = exam.examQuestions[currentQuestionIndex].question;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-sm text-gray-500">{exam.subject.name}</p>
        </div>
        <ExamTimer 
          startTime={startSessionMutation.data?.startTime} 
          duration={exam.duration} 
          onTimeUp={() => finishExamMutation.mutate()} 
        />
        <button
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin menyelesaikan ujian?')) {
              finishExamMutation.mutate();
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
        >
          Selesai Ujian
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <QuestionCard
            question={currentQuestion}
            index={currentQuestionIndex}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswer={(answer) => submitAnswerMutation.mutate({ 
              questionId: currentQuestion.id, 
              answer,
              type: currentQuestion.type
            })}
          />
          
          <div className="mt-8 flex justify-between">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              className="px-6 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              disabled={currentQuestionIndex === exam.examQuestions.length - 1}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </div>
        </div>

        <aside className="w-80 bg-white border-l overflow-y-auto p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Navigasi Soal</h2>
          <ExamNav
            questions={exam.examQuestions}
            currentIndex={currentQuestionIndex}
            onSelect={setCurrentQuestionIndex}
            answeredQuestions={Object.keys(answers)}
          />
        </aside>
      </main>
    </div>
  );
}
