'use client';

import { useEffect } from 'react';
import api from '@/lib/api';

type SocketLike = {
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
  emit: (event: string, payload?: unknown) => void;
};

type SessionEvent = {
  examId: string;
};

type TimeAddedEvent = SessionEvent & {
  newEndTime?: string | Date | null;
  addedMinutes?: number;
};

const isSessionEvent = (data: unknown): data is SessionEvent => !!data && typeof data === 'object' && 'examId' in data;
const isTimeAddedEvent = (data: unknown): data is TimeAddedEvent => isSessionEvent(data);

export function useExamRealtime({ socket, examId, sessionId, playSuccess, setIsLocked, finishExam, setSessionEndTime, setTimeAddedMinutes, setShowTimeAddedDialog }: {
  socket: SocketLike | null;
  examId: string;
  sessionId: string | null;
  playSuccess: () => void;
  setIsLocked: (v: boolean) => void;
  finishExam: () => void;
  setSessionEndTime: (v: string) => void;
  setTimeAddedMinutes: (v: number) => void;
  setShowTimeAddedDialog: (v: boolean) => void;
}) {
  useEffect(() => {
    if (!socket || !sessionId) return;
    const onSessionLocked = (data: unknown) => { if (isSessionEvent(data) && data.examId === examId) setIsLocked(true); };
    const onSessionUnlocked = (data: unknown) => { if (isSessionEvent(data) && data.examId === examId) setIsLocked(false); };
    const onSessionSubmitted = (data: unknown) => { if (isSessionEvent(data) && data.examId === examId) finishExam(); };
    const onTimeAdded = async (data: unknown) => {
      if (!isTimeAddedEvent(data) || data.examId !== examId) return;
      try {
        const response = await api.get(`/exam-sessions/${sessionId}`);
        const refreshedEndTime = response.data?.endTime;
        const confirmedEndTime = refreshedEndTime ? new Date(refreshedEndTime).toISOString() : (data.newEndTime ? (typeof data.newEndTime === 'string' ? data.newEndTime : new Date(data.newEndTime).toISOString()) : null);
        if (confirmedEndTime) {
          setSessionEndTime(confirmedEndTime);
          setTimeAddedMinutes(data.addedMinutes || 5);
          setShowTimeAddedDialog(true);
          playSuccess();
        }
      } catch {
        if (data.newEndTime) {
          const confirmedEndTime = typeof data.newEndTime === 'string' ? data.newEndTime : new Date(data.newEndTime).toISOString();
          setSessionEndTime(confirmedEndTime);
          setTimeAddedMinutes(data.addedMinutes || 5);
          setShowTimeAddedDialog(true);
          playSuccess();
        }
      }
    };
    socket.on('session_locked', onSessionLocked);
    socket.on('session_unlocked', onSessionUnlocked);
    socket.on('session_submitted', onSessionSubmitted);
    socket.on('time_added', onTimeAdded);
    socket.on('student_time_added', onTimeAdded);
    socket.emit('join_exam', { examId });
    return () => {
      socket.off('session_locked', onSessionLocked);
      socket.off('session_unlocked', onSessionUnlocked);
      socket.off('session_submitted', onSessionSubmitted);
      socket.off('time_added', onTimeAdded);
      socket.off('student_time_added', onTimeAdded);
    };
  }, [socket, sessionId, examId, finishExam, playSuccess, setIsLocked, setSessionEndTime, setShowTimeAddedDialog, setTimeAddedMinutes]);
}

