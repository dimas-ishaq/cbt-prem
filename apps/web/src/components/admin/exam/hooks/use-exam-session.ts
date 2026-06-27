'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { parseSessionAnswers } from '../exam-utils';

type StartSessionResponse = {
  id: string;
  endTime?: string;
  status?: string;
  answers?: Array<{
    questionId: string;
    essayAnswer?: string | null;
    selectedOptionId?: string | null;
    selectedOption?: string | null;
  }>;
};

export function useExamSession(examId: string, token: string | null, userRole?: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionEndTime, setSessionEndTime] = useState<string | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  const startSessionMutation = useMutation<StartSessionResponse, unknown, string | undefined>({
    mutationFn: async (examToken?: string) => (await api.post('/exam-sessions/start', { examId, token: examToken })).data,
    onSuccess: (data) => {
      setSessionId(data.id);
      setSessionEndTime(data.endTime);
      setIsLocked(data.status === 'LOCKED');
      setAnswers(parseSessionAnswers(data));
    },
  });

  useEffect(() => {
    if (!token || userRole !== 'SISWA') {
      setIsRestoringSession(false);
      return;
    }

    if (sessionId) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;
    setIsRestoringSession(true);

    (async () => {
      try {
        const response = await api.get(`/exam-sessions/active/${examId}`);
        if (cancelled) return;
        const data = response.data;
        if (data?.id && data?.status !== 'FINISHED' && data?.status !== 'SUBMITTED') {
          setSessionId(data.id);
          setSessionEndTime(data.endTime);
          setIsLocked(data.status === 'LOCKED');
          setAnswers(parseSessionAnswers(data));
        }
      } catch {
        // no active session
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, sessionId, token, userRole]);

  const { data: hydratedSession } = useQuery({
    queryKey: ['exam-session-hydration', sessionId],
    queryFn: async () => (await api.get(`/exam-sessions/${sessionId}`)).data,
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
    if (hydratedEndTime !== sessionEndTime) setSessionEndTime(hydratedEndTime);
    if (hydratedEndMs > baseEndMs) lastAnnouncedExtendedEndTimeRef.current = hydratedEndMs;
  }, [hydratedSession, sessionEndTime]);

  return {
    sessionId,
    sessionEndTime,
    isLocked,
    answers,
    isRestoringSession,
    isStartingSession: startSessionMutation.isPending,
    startSessionError: startSessionMutation.error,
    startSession: startSessionMutation.mutateAsync,
    setSessionId,
    setSessionEndTime,
    setIsLocked,
    setAnswers,
    setIsRestoringSession,
    hydratedSession,
    lastAnnouncedExtendedEndTimeRef,
  };
}

