'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface Props {
  startTime: string;
  duration: number; // in minutes
  onTimeUp: () => void;
}

export function ExamTimer({ startTime, duration, onTimeUp }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const end = start + duration * 60 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, duration, onTimeUp]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-mono font-bold border ${
      timeLeft < 300 ? 'text-red-600 border-red-200 bg-red-50 animate-pulse' : 'text-gray-700 border-gray-200 bg-gray-50'
    }`}>
      <Timer size={18} />
      <span>
        {format(hours)}:{format(minutes)}:{format(seconds)}
      </span>
    </div>
  );
}
