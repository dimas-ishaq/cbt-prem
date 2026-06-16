'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { system } from '@/lib/theme';
import '@/lib/i18n';
import { Toaster } from 'react-hot-toast';
import { ConfirmationProvider } from './ui/confirmation-dialog';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
      >
        <ChakraProvider value={system}>
          <ConfirmationProvider>
            {children}
            <Toaster position="top-right" />
          </ConfirmationProvider>
        </ChakraProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
