'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, IconButton, Spinner, Stack, useBreakpointValue } from '@chakra-ui/react';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Clock, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    if (isDesktop) {
      setMobileSidebarOpen(false);
    } else {
      setSidebarCollapsed(false);
    }
  }, [isDesktop]);

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
    if (!hasHydrated) return;

    if (!user) {
      router.push('/login');
    } else if (user.role === 'SISWA') {
      router.push('/dashboard');
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <Flex minH="100vh" align="center" justify="center" px={6} bg="bg.canvas">
        <Box
          w="full"
          maxW="lg"
          borderRadius="3xl"
          border="1px solid"
          borderColor="border.default"
          bg="bg.surface"
          p={{ base: 6, md: 8 }}
          shadow="xl"
          textAlign="center"
        >
          <Stack gap={5} align="center">
            <Flex
              w={18}
              h={18}
              align="center"
              justify="center"
              borderRadius="2xl"
              bg="indigo.500/10"
              border="1px solid"
              borderColor="indigo.500/20"
            >
              <Spinner size="lg" color="indigo.600" />
            </Flex>
            <Box>
              <Heading size="lg" color="gray.900" fontWeight="black" mb={2}>
                Menyiapkan sesi aman...
              </Heading>
              <Text color="gray.600" fontSize="sm" lineHeight="relaxed">
                Kami sedang memulihkan status login Anda. Halaman admin akan dibuka kembali dalam beberapa detik tanpa perlu login ulang.
              </Text>
            </Box>
            <Flex
              align="center"
              gap={2}
              px={3}
              py={1.5}
              borderRadius="full"
              bg="indigo.500/8"
              border="1px solid"
              borderColor="indigo.500/15"
            >
              <Clock size={13} className="text-indigo-500 animate-pulse" />
              <Text fontSize="xs" fontWeight="bold" color="indigo.600">
                Memverifikasi hak akses super admin
              </Text>
            </Flex>
          </Stack>
        </Box>
      </Flex>
    );
  }

  if (!user || user.role === 'SISWA') return null;

  const handleSidebarToggle = () => {
    if (isDesktop) {
      setSidebarCollapsed((prev) => !prev);
    } else {
      setMobileSidebarOpen((prev) => !prev);
    }
  };

  return (
    <Flex minH="screen" bg="bg.canvas">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <Box
        as="main"
        flex={1}
        overflowX="visible"
        display="flex"
        flexDirection="column"
        ml={{ base: 0, lg: sidebarCollapsed ? '4rem' : '16rem' }}
        transition="margin-left 0.25s ease"
      >
        <Box
          as="header"
          borderBottom="1px solid"
          borderColor="border.default"
          px={{ base: 4, md: 6, lg: 8 }}
          py={4}
          position="sticky"
          top={0}
          zIndex={10}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={4}
          style={{
            backdropFilter: 'blur(12px)',
            backgroundColor: 'var(--header-bg)',
          }}
        >
          <Flex align="center" gap={3} minW={0}>
            {!isDesktop && (
              <IconButton
                aria-label={mobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                onClick={handleSidebarToggle}
                size="sm"
                variant="ghost"
                color="text.primary"
              >
                <Menu size={18} />
              </IconButton>
            )}
            {isDesktop && (
              <IconButton
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
                onClick={handleSidebarToggle}
                size="sm"
                variant="ghost"
                color="text.primary"
              >
                {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </IconButton>
            )}
          </Flex>
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
            <NotificationBell />
            <ColorModeToggle size="md" />
          </Flex>
        </Box>
        <Box p={{ base: 4, md: 6, lg: 8 }} flex={1}>
          <Box mb={{ base: 4, md: 5, lg: 6 }}>
            <Breadcrumb />
          </Box>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
