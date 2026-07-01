'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Activity,
  LogOut,
  GraduationCap,
  Settings,
  Key,
  Award,
  Bookmark,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  X,
  QrCode,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  HStack,
  Image,
  IconButton,
  Input,
  Spinner,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toaster';
import { assetUrl } from '@/lib/env';

const menuGroups = [
  {
    titleKey: 'groupGeneral',
    items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard, key: 'dashboard' }],
  },
  {
    titleKey: 'groupAcademic',
    items: [
      { name: 'Mata Pelajaran', href: '/admin/subjects', icon: BookOpen, key: 'subjects' },
      { name: 'Konsentrasi Keahlian', href: '/admin/majors', icon: Award, key: 'majors' },
      { name: 'Rombongan Belajar', href: '/admin/rombels', icon: Users, key: 'rombels' },
      { name: 'Pengguna', href: '/admin/users', icon: Users, key: 'users' },
      { name: 'Kartu Ujian', href: '/admin/exam-cards', icon: FileText, key: 'examCards' },
      { name: 'Daftar Hadir', href: '/admin/exam-attendance', icon: QrCode, key: 'examAttendance' },
    ],
  },
  {
    titleKey: 'groupCbt',
    items: [
      { name: 'Event Ujian', href: '/admin/exam-groups', icon: Bookmark, key: 'examGroups' },
      { name: 'Bank Soal', href: '/admin/question-banks', icon: FileText, key: 'questionBanks' },
      { name: 'Ujian', href: '/admin/exams', icon: GraduationCap, key: 'exams' },
      { name: 'Monitoring', href: '/admin/monitoring', icon: Activity, key: 'monitoring' },
      { name: 'Notifikasi', href: '/admin/notifications', icon: Bell, key: 'notifications' },
      { name: 'Laporan', href: '/admin/reports', icon: BarChart3, key: 'reports' },
    ],
  },
  {
    titleKey: 'groupSystem',
    items: [
      { name: 'Manajemen Akses', href: '/admin/roles', icon: Key, key: 'roles' },
      { name: 'Pengaturan', href: '/admin/settings', icon: Settings, key: 'settings' },
      { name: 'Log Sistem', href: '/admin/logs', icon: Activity, key: 'logs' },
    ],
  },
];

type AdminSidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout, user, updateUser } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false;

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
    enabled: !!useAuthStore.getState().access_token,
  });

  const handleLogout = () => {
    document.cookie = 'auth_access_token=; Path=/; Max-Age=0; SameSite=Lax';
    logout();
    router.push('/login');
  };

  const visibleMenuGroups = menuGroups
    .map((group) => {
      const visibleItems = group.items.filter((item) => {
        if (
          item.href === '/admin/settings' ||
          item.href === '/admin/roles' ||
          item.href === '/admin/logs' ||
          item.href === '/admin/users' ||
          item.href === '/admin/majors' ||
          item.href === '/admin/subjects' ||
          item.href === '/admin/rombels' ||
          item.href === '/admin/exam-cards' ||
          item.href === '/admin/monitoring' ||
          item.href === '/admin/notifications' ||
          item.href === '/admin/reports'
        ) {
          return user?.role === 'SUPER_ADMIN';
        }
        if (item.href === '/admin/exam-attendance') {
          return ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU', 'PENGAWAS'].includes(user?.role || '');
        }
        return true;
      });
      return { ...group, items: visibleItems };
    })
    .filter((group) => group.items.length > 0);

  const sidebarWidth = collapsed ? 16 : 64;
  const sidebarWidthValue = `${sidebarWidth / 4}rem`;

  return (
    <>
      {!isDesktop && mobileOpen && (
        <Box position="fixed" inset={0} bg="blackAlpha.700" backdropFilter="blur(2px)" zIndex={1400} onClick={onMobileClose} />
      )}

      <Box
        as="aside"
        w={{ base: 'full', lg: sidebarWidthValue }}
        maxW={{ base: '18rem', lg: sidebarWidthValue }}
        display="flex"
        flexDirection="column"
        h={{ base: '100dvh', lg: '100vh' }}
        position={{ base: 'fixed', lg: 'fixed' }}
        top={0}
        left={{ base: mobileOpen ? 0 : '-18rem', lg: 0 }}
        zIndex={{ base: 1500, lg: 30 }}
        flexShrink={0}
        transition="left 0.25s ease, width 0.25s ease"
        overflow="hidden"
        bg="bg.surface"
        boxShadow={{ base: '2xl', lg: 'none' }}
        borderRight="1px solid"
        borderColor="border.default"
      >
        <Box px={collapsed ? 3 : 5} py={5} borderBottom="1px solid" borderColor="sidebar.border">
          <Flex align="center" justify="space-between" gap={3}>
            <Flex align="center" gap={3} minW={0}>
              <Flex
                align="center"
                justify="center"
                w={9}
                h={9}
                borderRadius="xl"
                flexShrink={0}
                overflow="hidden"
                bg={(settings?.logoUrl && settings.logoUrl.trim() !== '') ? 'bg.surface' : 'brand.subtle'}
                border="1px solid"
                borderColor="border.default"
              >
                {(settings?.logoUrl && settings.logoUrl.trim() !== '') ? (
                  <Image src={settings.logoUrl} alt="Logo" maxW="80%" maxH="80%" objectFit="contain" />
                ) : (
                  <BookOpen size={17} color="var(--chakra-colors-brand-solid)" />
                )}
              </Flex>
              {!collapsed && (
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="extrabold" color="sidebar.text.active" letterSpacing="wide" textTransform="uppercase" lineHeight="1" lineClamp={1}>
                    {settings?.appName || 'Nama Sekolah'}
                  </Text>
                  <Flex align="center" gap={1.5} mt={0.5} wrap="wrap">
                    <Text fontSize="2xs" color="brand.text" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                      Admin Panel
                    </Text>
                    {settings?.academicYear && (
                      <Box fontSize="9px" bg="brand.subtle" color="brand.text" fontWeight="black" px={1.5} py={0.2} borderRadius="md" border="1px solid" borderColor="border.brand">
                        {settings.academicYear}
                      </Box>
                    )}
                  </Flex>
                </Box>
              )}
            </Flex>
          </Flex>
        </Box>

        <Stack flex={1} px={collapsed ? 2 : 3} pt={4} gap={5} as="nav" overflowY="auto" pb={4}>
          {visibleMenuGroups.map((group) => (
            <Stack key={group.titleKey} gap={1} flexShrink={0}>
              {!collapsed && (
                <Text fontSize="2xs" fontWeight="semibold" color="sidebar.text" letterSpacing="wider" textTransform="uppercase" px={3} mb={1}>
                  {t(group.titleKey)}
                </Text>
              )}
              {group.items.map((item) => {
                const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                return (
                  <Flex
                    key={item.name}
                    as="button"
                    {...({ type: 'button' } as any)}
                    onClick={() => {
                      router.push(item.href);
                      if (!isDesktop) onMobileClose();
                    }}
                    align="center"
                    justify={collapsed ? 'center' : 'flex-start'}
                    gap={collapsed ? 0 : 3}
                    px={collapsed ? 2.5 : 3}
                    py={2.5}
                    borderRadius="xl"
                    cursor="pointer"
                    transition="all 0.15s"
                    position="relative"
                    w="full"
                    title={collapsed ? t(item.key) : undefined}
                    bg={isActive ? 'sidebar.item.active.bg' : 'transparent'}
                    _hover={{ bg: !isActive ? 'sidebar.item.hover.bg' : 'sidebar.item.active.bg' }}
                    color={isActive ? 'brand.text' : 'text.secondary'}
                  >
                    {isActive && (
                      <Box position="absolute" left={0} top="20%" bottom="20%" w={0.5} borderRadius="full" bg="brand.solid" />
                    )}
                    <item.icon size={17} />
                    {!collapsed && (
                      <Text fontSize="xs" fontWeight={isActive ? 'bold' : 'medium'} color={isActive ? 'brand.text' : 'text.secondary'}>
                        {t(item.key)}
                      </Text>
                    )}
                  </Flex>
                );
              })}
            </Stack>
          ))}

          <Box px={collapsed ? 2 : 3} py={4} borderTop="1px solid" borderColor="border.default">
            <Link href="/admin/profile" passHref style={{ width: '100%', textDecoration: 'none' }}>
              <Flex
                direction={collapsed ? 'column' : 'row'}
                align="center"
                gap={3}
                px={collapsed ? 0 : 3}
                py={2.5}
                borderRadius="xl"
                bg="bg.elevated"
                borderWidth="1px"
                borderColor="border.default"
                _hover={{ borderColor: 'border.active' }}
                transition="all 0.15s"
              >
                <Flex
                  w={8}
                  h={8}
                  borderRadius="full"
                  align="center"
                  justify="center"
                  color="white"
                  fontWeight="black"
                  fontSize="sm"
                  flexShrink={0}
                  overflow="hidden"
                  style={user?.photo ? {} : { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}
                >
                  {user?.photo ? (
                    <Image
                      src={assetUrl(user.photo)}
                      alt="Avatar"
                      objectFit="cover"
                      w="full"
                      h="full"
                    />
                  ) : (
                    user?.fullName?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </Flex>
                {!collapsed && (
                  <Box overflow="hidden" flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="bold" color="text.primary" lineClamp={1} lineHeight="1.2">{user?.fullName}</Text>
                    <Text fontSize="2xs" color="sidebar.text.active" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" lineClamp={1} mt={0.5}>{user?.role}</Text>
                  </Box>
                )}
              </Flex>
            </Link>
            <Button
              onClick={handleLogout}
              data-testid="logout-button"
              variant="ghost"
              w="full"
              justifyContent={collapsed ? 'center' : 'start'}
              px={3}
              py={2}
              borderRadius="xl"
              cursor="pointer"
              _hover={{ bg: 'status.danger.bg', color: 'status.danger.text', borderColor: 'danger.200' }}
              border="1px solid transparent"
              transition="all 0.15s"
              size="sm"
            >
              <LogOut size={16} />
              {!collapsed && <Text fontWeight="semibold" ml={2.5} fontSize="sm" color="inherit">{t('logout')}</Text>}
            </Button>
          </Box>
        </Stack>
      </Box>
    </>
  );
}
