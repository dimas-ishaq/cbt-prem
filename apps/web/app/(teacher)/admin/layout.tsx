'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Clock } from 'lucide-react';
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

  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const tz = settings?.timezone || 'Asia/Jakarta';
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: tz,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      const tzLabel = tz.includes('Jakarta') ? 'WIB' : tz.includes('Makassar') ? 'WITA' : tz.includes('Jayapura') ? 'WIT' : 'UTC';
      setTimeStr(`${dateFormatter.format(now)} • ${timeFormatter.format(now)} ${tzLabel}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings?.timezone]);

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
          alignItems="flex-start"
          justifyContent="space-between"
          gap={4}
          style={{
            backdropFilter: 'blur(12px)',
            backgroundColor: 'var(--header-bg)',
          }}
        >
          <Box>
            <Heading size="md" fontWeight="bold" color="text.primary" textTransform="capitalize">
              Admin Management
            </Heading>
            <Breadcrumb />
          </Box>
          <Flex align="center" gap={4}>
            {timeStr && (
              <Flex
                align="center"
                gap={2}
                px={3.5}
                py={1.5}
                bg="indigo.500/10"
                border="1px solid"
                borderColor="indigo.500/20"
                borderRadius="full"
                fontSize="xs"
                fontWeight="black"
                color="indigo.600"
                _dark={{ color: 'indigo.300', bg: 'indigo.950/30' }}
              >
                <Clock size={13} className="animate-pulse text-indigo-500" />
                <Text fontFamily="mono" fontSize="2xs">{timeStr}</Text>
              </Flex>
            )}
            <ColorModeToggle size="md" />
          </Flex>
        </Box>
        <Box p={8} flex={1}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
