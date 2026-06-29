'use client';

import { useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { EmotionRegistry } from './emotion-registry';
import { useState } from 'react';
import { system } from '@/lib/theme';
import '@/lib/i18n';
import i18n from '@/lib/i18n';
import api from '@/lib/api';

import { Toaster } from './ui/toaster';
import { ConfirmationProvider } from './ui/confirmation-dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings/public');
        queryClient.setQueryData(['settings/public'], data);
        if (data?.appName) localStorage.setItem('cbt-app-name', data.appName);
        if (data?.logoUrl) localStorage.setItem('cbt-logo-url', data.logoUrl);
        if (data?.faviconUrl) localStorage.setItem('cbt-favicon-url', data.faviconUrl);
        document.cookie = `cbt-app-name=${encodeURIComponent(data?.appName || 'Nama Sekolah')}; path=/; max-age=31536000; samesite=lax`;
        document.cookie = `cbt-logo-url=${encodeURIComponent(data?.logoUrl || '/images/logo.png')}; path=/; max-age=31536000; samesite=lax`;
        const language = data?.language;
        if (language && language !== i18n.language) {
          i18n.changeLanguage(language);
        }
      } catch (e) {
        // Ignore errors, keep default language
      }
    };
    fetchSettings();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <EmotionRegistry>
        <ChakraProvider value={system}>
          <ConfirmationProvider>
            {children}
          </ConfirmationProvider>
          <Toaster />
        </ChakraProvider>
      </EmotionRegistry>
    </QueryClientProvider>
  );
}
