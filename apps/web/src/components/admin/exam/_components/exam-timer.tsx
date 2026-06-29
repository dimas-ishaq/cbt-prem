'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { Flex, Text } from '@chakra-ui/react';

interface Props {
  startTime: string;
  duration: number; // in minutes
  overrideEndTime?: string;
  onTimeUp: () => void;
}

export function ExamTimer({ startTime, duration, overrideEndTime, onTimeUp }: Props) {
  const getEndTime = () => {
    if (overrideEndTime) {
      return new Date(overrideEndTime).getTime();
    }
    const start = new Date(startTime).getTime();
    return start + duration * 60 * 1000;
  };

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const end = getEndTime();
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    const end = getEndTime();

    // Initial sync
    setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));

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
  }, [startTime, duration, overrideEndTime, onTimeUp]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  const isCritical = timeLeft < 300; // < 5 mins
  const isWarning = timeLeft >= 300 && timeLeft < 900; // < 15 mins

  // Setup mode responsive styles
  let textColor = { base: '#2D9BF0', _dark: '#2D9BF0' };
  let borderColor = { base: '#E1E4E8', _dark: '#3D3D3D' };
  let bgColor = { base: '#F9FAFC', _dark: '#1B1B1B' };

  if (isCritical) {
    textColor = { base: '#EF4444', _dark: '#EF4444' };
    borderColor = { base: '#EF4444', _dark: '#EF4444' };
    bgColor = { base: 'rgba(239, 68, 68, 0.1)', _dark: 'rgba(239, 68, 68, 0.12)' };
  } else if (isWarning) {
    textColor = { base: '#F5A623', _dark: '#F5A623' };
    borderColor = { base: '#F5A623', _dark: '#F5A623' };
    bgColor = { base: 'rgba(245, 166, 35, 0.08)', _dark: 'rgba(245, 166, 35, 0.12)' };
  }

  return (
    <Flex
      align="center"
      gap={2}
      px={4}
      py={1.5}
      borderRadius="md"
      fontFamily="Courier New, Courier, monospace"
      fontWeight="bold"
      fontSize="14px"
      border="1px solid"
      className={isCritical ? 'animate-pulse' : ''}
      color={textColor}
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="0 1px 4px rgba(0,0,0,0.05)"
      transition="all 0.15s ease"
    >
      <Timer size={14} />
      <Text>
        {format(hours)}:{format(minutes)}:{format(seconds)}
      </Text>
    </Flex>
  );
}
