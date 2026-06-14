'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  const { i18n } = useTranslation();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language, i18n]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'SISWA') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.role === 'SISWA') return null;

  return (
    <Flex minH="screen" bg="bg.canvas">
      <AdminSidebar />
      <Box as="main" flex={1} overflowX="hidden" display="flex" flexDirection="column">
        <Box
          as="header"
          borderBottom="1px solid"
          borderColor="border.default"
          px={8}
          py={4}
          position="sticky"
          top={0}
          zIndex={10}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          style={{
            backdropFilter: 'blur(12px)',
            backgroundColor: 'var(--header-bg)',
          }}
        >
          <Heading size="md" fontWeight="bold" color="text.primary" textTransform="capitalize">
            Admin Management
          </Heading>
          <ColorModeToggle size="md" />
        </Box>
        <Box p={8} flex={1}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
