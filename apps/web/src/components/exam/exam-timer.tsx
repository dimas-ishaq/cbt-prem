'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { Flex, Text } from '@chakra-ui/react';

interface Props {
  startTime: string;
  duration: number; // in minutes
  onTimeUp: () => void;
}

export function ExamTimer({ startTime, duration, onTimeUp }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const start = new Date(startTime).getTime();
    const end = start + duration * 60 * 1000;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

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

  const isCritical = timeLeft < 300;

  return (
    <Flex
      align="center"
      gap={2}
      px={4}
      py={2}
      borderRadius="full"
      fontFamily="mono"
      fontWeight="bold"
      border="1px solid"
      className={isCritical ? 'animate-pulse' : ''}
      color={isCritical ? 'red.600' : 'gray.700'}
      borderColor={isCritical ? 'red.200' : 'gray.200'}
      bg={isCritical ? 'red.50' : 'gray.50'}
    >
      <Timer size={18} />
      <Text>
        {format(hours)}:{format(minutes)}:{format(seconds)}
      </Text>
    </Flex>
  );
}
