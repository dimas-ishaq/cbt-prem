'use client';

import { useEffect } from 'react';

type ExamFlags = {
  forceFullscreen?: boolean;
  blockKeyCopyPaste?: boolean;
  sebConfigKey?: string | null;
  sebBrowserKey?: string | null;
  maxViolations?: number;
};

type SocketLike = {
  emit: (event: string, payload?: unknown) => void;
};

export function useExamViolation({ enabled, exam, examId, socket, sessionId, playViolation, setViolationCount, setViolationMessage, setShowViolationModal }: {
  enabled: boolean;
  exam: ExamFlags;
  examId: string;
  socket: SocketLike | null;
  sessionId: string | null;
  playViolation: () => void;
  finishExam: () => void;
  setViolationCount: React.Dispatch<React.SetStateAction<number>>;
  setViolationMessage: (v: string) => void;
  setShowViolationModal: (v: boolean) => void;
}) {
  useEffect(() => {
    if (!enabled || !sessionId) return;
    let lastViolationTime = 0;
    const VIOLATION_COOLDOWN = 5000;
    const reportViolation = (type: string, description: string) => {
      if (!exam?.forceFullscreen && !exam?.blockKeyCopyPaste && !exam?.sebConfigKey && !exam?.sebBrowserKey) return;
      const now = Date.now();
      if (now - lastViolationTime <= VIOLATION_COOLDOWN) return;
      socket?.emit('violation_detected', { examId, type, description });
      playViolation();
      setViolationCount(prev => {
        const nextCount = prev + 1;
        setViolationMessage(description);
        setShowViolationModal(true);
        return nextCount;
      });

      lastViolationTime = now;
    };
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') reportViolation('TAB_SWITCH', 'Terdeteksi berpindah tab atau meminimalkan browser.'); };
    const handleBlur = () => reportViolation('WINDOW_BLUR', 'Terdeteksi beralih fokus ke aplikasi atau jendela lain.');
    const handleContextMenu = (e: MouseEvent) => { if (exam?.blockKeyCopyPaste) { e.preventDefault(); reportViolation('CONTEXT_MENU', 'Terdeteksi klik kanan (membuka menu konteks).'); } };
    const handleSelectStart = (e: Event) => { if (exam?.blockKeyCopyPaste) e.preventDefault(); };
    const handleCopyCutPaste = (e: ClipboardEvent) => { if (exam?.blockKeyCopyPaste) { e.preventDefault(); reportViolation('COPY_PASTE', 'Terdeteksi upaya menyalin atau menempel teks.'); } };
    const handleKeyDown = (e: KeyboardEvent) => { if (!exam?.blockKeyCopyPaste) return; const blocked = e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C','i','j','c'].includes(e.key)) || (e.ctrlKey && ['C','V','U','F','c','v','u','f'].includes(e.key)); if (blocked) { e.preventDefault(); reportViolation('KEYBOARD_SHORTCUT', 'Terdeteksi upaya menggunakan shortcut keyboard terlarang.'); } };
    const handleFullscreenChange = () => { if (exam?.forceFullscreen && !document.fullscreenElement) reportViolation('FULLSCREEN_EXIT', 'Terdeteksi keluar dari mode layar penuh (Fullscreen).'); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
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
    };
  }, [enabled, exam, examId, playViolation, sessionId, setShowViolationModal, setViolationCount, setViolationMessage, socket]);
}


