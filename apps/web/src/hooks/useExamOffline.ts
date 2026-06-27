import { get, set, del } from 'idb-keyval';
import { useState, useEffect } from 'react';

type ExamAnswer = string | number | boolean | null | Array<string | number> | Record<string, unknown>;

export const useExamOffline = (examId: string) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveAnswerLocally = async (questionId: string, answer: ExamAnswer) => {
    const key = `exam_${examId}_ans_${questionId}`;
    await set(key, {
      answer,
      timestamp: Date.now(),
      synced: false,
    });
  };

  const getUnsyncedAnswers = async () => {
    return [];
  };

  return { isOffline, saveAnswerLocally, getUnsyncedAnswers };
};
