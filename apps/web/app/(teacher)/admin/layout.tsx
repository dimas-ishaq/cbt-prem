'use client';

import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  const pathname = usePathname();
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { i18n } = useTranslation();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    return document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1] ?? null;
  };
  const cachedAppName = typeof window !== 'undefined' ? decodeURIComponent(getCookie('cbt-app-name') || localStorage.getItem('cbt-app-name') || '') : null;
  const cachedLogoUrl = typeof window !== 'undefined' ? decodeURIComponent(getCookie('cbt-logo-url') || localStorage.getItem('cbt-logo-url') || '') : null;
  const { data: publicSettings } = useQuery({
    queryKey: ['settings/public'],
    queryFn: async () => (await api.get('/settings/public')).data,
    staleTime: 1000 * 60 * 5,
    initialData: cachedAppName || cachedLogoUrl ? { appName: cachedAppName, logoUrl: cachedLogoUrl } : undefined,
  });

  const displayAppName = mounted ? (cachedAppName || publicSettings?.appName || 'Loding ...') : 'Loding ...';
  const displayLogoUrl = mounted ? (cachedLogoUrl || publicSettings?.logoUrl || '/images/logo.png') : '/images/logo.png';
  const displayLogoAlt = mounted ? (cachedAppName || publicSettings?.appName || 'Logo sekolah') : 'Logo sekolah';

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <Flex minH="100vh" direction="column" align="center" justify="center" gap={4} px={6} bg="bg.canvas">
        <Flex
          w={20}
          h={20}
          align="center"
          justify="center"
          borderRadius="full"
          position="relative"
        >
          <Spinner size="xl" color="brand.solid" />
          <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
            <Image
              src={displayLogoUrl}
              alt={displayLogoAlt}
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </Box>
        </Flex>
        <Box textAlign="center">
          <Heading size="sm" color="text.primary" fontWeight="bold" letterSpacing="-0.02em">
            {displayAppName}
          </Heading>
          <Text color="text.muted" fontSize="xs" mt={1}>
            Mohon tunggu sebentar...
          </Text>
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
          bg="bg.surface"
          style={{ backdropFilter: 'blur(12px)' }}
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
                bg="brand.subtle"
                border="1px solid"
                borderColor="brand.muted"
                borderRadius="full"
                fontSize="xs"
                fontWeight="black"
                color="brand.text"
              >
                <Clock size={13} />
                <Text fontFamily="mono" fontSize="2xs">{timeStr}</Text>
              </Flex>
            )}
            <NotificationBell />
            <ColorModeToggle size="md" />
          </Flex>
        </Box>
        <Box p={{ base: 4, md: 6, lg: 8 }} flex={1}>
          {pathname !== '/admin' && (
            <Box mb={{ base: 4, md: 5, lg: 6 }}>
              <Breadcrumb />
            </Box>
          )}
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
