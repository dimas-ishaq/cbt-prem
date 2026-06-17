'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { useState } from 'react';
import { system } from '@/lib/theme';
import '@/lib/i18n';

import { Toaster } from './ui/toaster';
import { ConfirmationProvider } from './ui/confirmation-dialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

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
