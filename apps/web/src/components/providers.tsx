'use client';

import { useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { useState } from 'react';
import { system } from '@/lib/theme';
import '@/lib/i18n';
import i18n from '@/lib/i18n';
import api from '@/lib/api';

import { Toaster } from './ui/toaster';
import { ConfirmationProvider } from './ui/confirmation-dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationBell } from '@/components/ui/notification-bell';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings/public');
        const language = data?.language;
        if (language && language !== i18n.language) {
          i18n.changeLanguage(language);
        }
      } catch (e) {
        // Ignore errors, keep default language
      }
    };
    fetchSettings();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={system}>
        <ConfirmationProvider>
          {children}
        </ConfirmationProvider>
        <Toaster />
      </ChakraProvider>
    </QueryClientProvider>
  );
}
