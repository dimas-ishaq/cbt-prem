'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';

interface ColorModeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'switch';
}

const STORAGE_KEY = 'cbt-color-mode';

function applyMode(mode: 'light' | 'dark', persist = false) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
  if (persist) localStorage.setItem(STORAGE_KEY, mode);
}

export function ColorModeToggle({ size = 'md', variant = 'icon' }: ColorModeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return stored === 'dark' || (!stored && prefersDark);
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextMode = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';
    setIsDark(nextMode === 'dark');
    applyMode(nextMode);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const nextMode = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    applyMode(nextMode, true);
  };

  if (variant === 'switch') {
    return (
      <Box
        as="button"
        onClick={toggle}
        aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        cursor="pointer"
        display="flex"
        alignItems="center"
        gap={2}
        px={3}
        py={1.5}
        borderRadius="full"
        border="1px solid"
        borderColor="border.default"
        bg="bg.elevated"
        color="text.secondary"
        fontSize="xs"
        fontWeight="semibold"
        transition="all 0.2s"
        _hover={{
          bg: 'brand.subtle',
          borderColor: 'brand.solid',
          color: 'brand.solid',
        }}
      >
        <Box
          w={8}
          h={4}
          borderRadius="full"
          position="relative"
          transition="all 0.2s"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
              : 'linear-gradient(135deg, #94a3b8, #64748b)',
          }}
        >
          <Box
            position="absolute"
            top="2px"
            left={isDark ? '18px' : '2px'}
            w={3}
            h={3}
            borderRadius="full"
            bg="white"
            transition="left 0.2s"
            boxShadow="sm"
          />
        </Box>
      </Box>
    );
  }

  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 20 : 17;
  const btnSize = size === 'sm' ? 7 : size === 'lg' ? 10 : 9;

  return (
    <Flex
      as="button"
      onClick={toggle}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      cursor="pointer"
      align="center"
      justify="center"
      w={btnSize}
      h={btnSize}
      borderRadius="xl"
      border="1px solid"
      borderColor="border.default"
      bg="bg.elevated"
      color="text.secondary"
      transition="all 0.2s"
      _hover={{
        bg: 'brand.subtle',
        borderColor: 'brand.muted',
        color: 'brand.solid',
        transform: 'rotate(12deg)',
      }}
      style={{ outline: 'none' }}
    >
      {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </Flex>
  );
}
