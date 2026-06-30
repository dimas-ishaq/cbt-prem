'use client';

import { useEffect, useRef } from 'react';
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

type UnlockRejectedEvent = SessionEvent & {
  message?: string;
};

const isSessionEvent = (data: unknown): data is SessionEvent => !!data && typeof data === 'object' && 'examId' in data;
const isTimeAddedEvent = (data: unknown): data is TimeAddedEvent => isSessionEvent(data);
const isUnlockRejectedEvent = (data: unknown): data is UnlockRejectedEvent => isSessionEvent(data) && 'message' in data;

export function useExamRealtime({ socket, examId, sessionId, userId, playSuccess, setIsLocked, finishExam, setSessionEndTime, setTimeAddedMinutes, setShowTimeAddedDialog, setUnlockError }: {
  socket: SocketLike | null;
  examId: string;
  sessionId: string | null;
  userId: string | null | undefined;
  playSuccess: () => void;
  setIsLocked: (v: boolean) => void;
  finishExam: () => void;
  setSessionEndTime: (v: string) => void;
  setTimeAddedMinutes: (v: number) => void;
  setShowTimeAddedDialog: (v: boolean) => void;
  setUnlockError?: (v: string) => void;
}) {
  // Guard: cegah playSuccess false positive dari broadcast berlebih
  const lastPlayedRef = useRef(0);

  useEffect(() => {
    if (!socket || !sessionId) return;
    const onSessionLocked = (data: unknown) => { if (isSessionEvent(data) && data.examId === examId) setIsLocked(true); };
    const onSessionUnlocked = (data: unknown) => { if (isSessionEvent(data) && data.examId === examId) { setIsLocked(false); setUnlockError?.(''); } };
    const onSessionSubmitted = (data: unknown) => { if (isSessionEvent(data) && data.examId === examId) finishExam(); };
    const onTimeAdded = async (data: unknown) => {
      if (!isTimeAddedEvent(data) || data.examId !== examId) return;
      if (userId && 'studentId' in data && data.studentId && data.studentId !== userId) return;
      // Hanya bunyi kalo beneran ada tambahan waktu (addedMinutes > 0)
      const added = data.addedMinutes ?? 0;
      if (added <= 0) return;
      // Cooldown biar gak repetitif
      const now = Date.now();
      if (now - lastPlayedRef.current < 3000) return;
      lastPlayedRef.current = now;
      try {
        const response = await api.get(`/exam-sessions/${sessionId}`);
        const refreshedEndTime = response.data?.endTime;
        const confirmedEndTime = refreshedEndTime ? new Date(refreshedEndTime).toISOString() : (data.newEndTime ? (typeof data.newEndTime === 'string' ? data.newEndTime : new Date(data.newEndTime).toISOString()) : null);
        if (confirmedEndTime) {
          setSessionEndTime(confirmedEndTime);
          setTimeAddedMinutes(added);
          setShowTimeAddedDialog(true);
          playSuccess();
        }
      } catch {
        if (data.newEndTime) {
          const confirmedEndTime = typeof data.newEndTime === 'string' ? data.newEndTime : new Date(data.newEndTime).toISOString();
          setSessionEndTime(confirmedEndTime);
          setTimeAddedMinutes(added);
          setShowTimeAddedDialog(true);
          playSuccess();
        }
      }
    };
    // Tambah auto-lock listener
    const onAutoLocked = (data: unknown) => {
      if (isSessionEvent(data) && data.examId === examId) {
        setIsLocked(true);
        // Bisa juga set token info di sini jika perlu
        console.log('Auto-locked for exam', examId, data);
      }
    };
    // Tambah unlock reject listener
    const onUnlockRejected = (data: unknown) => {
      if (isUnlockRejectedEvent(data) && data.examId === examId && setUnlockError) {
        setUnlockError(data.message ?? 'Token invalid');
      }
    };
    const onReconnect = () => socket.emit('join_exam', { examId });
    socket.on('session_locked', onSessionLocked);
    socket.on('session_unlocked', onSessionUnlocked);
    socket.on('session_submitted', onSessionSubmitted);
    socket.on('time_added', onTimeAdded);
    socket.on('student_time_added', onTimeAdded);
    socket.on('session_auto_locked', onAutoLocked);
    socket.on('unlock_rejected', onUnlockRejected);
    socket.on('connect', onReconnect);
    socket.emit('join_exam', { examId });
    return () => {
      socket.off('session_locked', onSessionLocked);
      socket.off('session_unlocked', onSessionUnlocked);
      socket.off('session_submitted', onSessionSubmitted);
      socket.off('time_added', onTimeAdded);
      socket.off('student_time_added', onTimeAdded);
      socket.off('session_auto_locked', onAutoLocked);
      socket.off('unlock_rejected', onUnlockRejected);
      socket.off('connect', onReconnect);
    };
  }, [socket, sessionId, examId, finishExam, playSuccess, setIsLocked, setSessionEndTime, setShowTimeAddedDialog, setTimeAddedMinutes, setUnlockError]);
}

