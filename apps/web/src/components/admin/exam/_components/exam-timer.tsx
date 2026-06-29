'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { Flex, Text } from '@chakra-ui/react';

interface Props {
  startTime: string;
  duration: number; // in minutes
  overrideEndTime?: string;
  onTimeUp: () => void;
  serverTime?: string;
}

export function ExamTimer({ startTime, duration, overrideEndTime, onTimeUp, serverTime }: Props) {
  const getEndTime = () => {
    if (overrideEndTime) {
      return new Date(overrideEndTime).getTime();
    }
    const start = new Date(startTime).getTime();
    return start + duration * 60 * 1000;
  };

  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const end = getEndTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  });

  useEffect(() => {
    if (!serverTime) {
      setServerOffsetMs(0);
      return;
    }

    const syncClock = () => {
      setServerOffsetMs(new Date(serverTime).getTime() - Date.now());
    };

    syncClock();
    const syncTimer = setInterval(syncClock, 30000);
    return () => clearInterval(syncTimer);
  }, [serverTime]);

  useEffect(() => {
    const end = getEndTime();
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const now = Date.now() + serverOffsetMs;
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timer) clearInterval(timer);
        onTimeUp();
      }
    };

    tick();
    timer = setInterval(tick, 1000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startTime, duration, overrideEndTime, onTimeUp, serverOffsetMs]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  const isCritical = timeLeft < 300; // < 5 mins
  const isWarning = timeLeft >= 300 && timeLeft < 900; // < 15 mins

  // Setup mode responsive styles
  let textColor = 'dd.status.info.text';
  let borderColor = 'dd.border';
  let bgColor = 'dd.canvas';

  if (isCritical) {
    textColor = 'dd.status.danger.text';
    borderColor = 'dd.status.danger.text';
    bgColor = 'dd.status.danger.bg';
  } else if (isWarning) {
    textColor = 'dd.status.warning.text';
    borderColor = 'dd.status.warning.text';
    bgColor = 'dd.status.warning.bg';
  }

  return (
    <Flex
      align="center"
      gap={2}
      px={4}
      py={1.5}
      borderRadius="badge"
      fontFamily="Courier New, Courier, monospace"
      fontWeight="bold"
      fontSize="14px"
      border="1px solid"
      className={isCritical ? 'animate-pulse' : ''}
      color={textColor}
      borderColor={borderColor}
      bg={bgColor}
      boxShadow={{ base: 'card-light', _dark: 'card-dark' }}
      transition="all 0.15s ease"
    >
      <Timer size={14} />
      <Text>
        {format(hours)}:{format(minutes)}:{format(seconds)}
      </Text>
    </Flex>
  );
}
