import { get, set, del } from 'idb-keyval';
import { useState, useEffect } from 'react';

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

  const saveAnswerLocally = async (questionId: string, answer: any) => {
    const key = `exam_${examId}_ans_${questionId}`;
    await set(key, {
      answer,
      timestamp: Date.now(),
      synced: false,
    });
  };

  const getUnsyncedAnswers = async () => {
    // Basic implementation: in real app, use a more structured store
    // or iterate through IndexedDB keys
    return [];
  };

  return { isOffline, saveAnswerLocally, getUnsyncedAnswers };
};
