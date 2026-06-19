'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Volume2,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  HStack,
  Image,
  IconButton,
} from '@chakra-ui/react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

import { useTranslation } from 'react-i18next';

const menuGroups = [
  {
    titleKey: 'groupGeneral',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, key: 'dashboard' },
    ],
  },
  {
    titleKey: 'groupAcademic',
    items: [
      { name: 'Mata Pelajaran', href: '/admin/subjects', icon: BookOpen, key: 'subjects' },
      { name: 'Konsentrasi Keahlian', href: '/admin/majors', icon: Award, key: 'majors' },
      { name: 'Rombongan Belajar', href: '/admin/rombels', icon: Users, key: 'rombels' },
      { name: 'Pengguna', href: '/admin/users', icon: Users, key: 'users' },
      { name: 'Kartu Ujian', href: '/admin/exam-cards', icon: FileText, key: 'examCards' },
    ],
  },
  {
    titleKey: 'groupCbt',
    items: [
      { name: 'Event Ujian', href: '/admin/exam-groups', icon: Bookmark, key: 'examGroups' },
      { name: 'Bank Soal', href: '/admin/question-banks', icon: FileText, key: 'questionBanks' },
      { name: 'Ujian', href: '/admin/exams', icon: GraduationCap, key: 'exams' },
      { name: 'Monitoring', href: '/admin/monitoring', icon: Activity, key: 'monitoring' },
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

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleMenuGroups = menuGroups.map((group) => {
    const visibleItems = group.items.filter((item) => {
      if (
        item.href === '/admin/settings' ||
        item.href === '/admin/roles' ||
        item.href === '/admin/logs' ||
        item.href === '/admin/majors' ||
        item.href === '/admin/subjects' ||
        item.href === '/admin/rombels' ||
        item.href === '/admin/exam-cards' ||
        item.href === '/admin/monitoring' ||
        item.href === '/admin/reports'
      ) {
        return user?.role === 'SUPER_ADMIN';
      }
      return true;
    });
    return { ...group, items: visibleItems };
  }).filter((group) => group.items.length > 0);

  return (
    <Box
      w={64}
      display="flex"
      flexDirection="column"
      h="100vh"
      position="sticky"
      top={0}
      flexShrink={0}
      style={{
        background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1526 100%)',
        borderRight: '1px solid rgba(28,45,74,0.8)',
      }}
    >
      {/* ── Logo ────────────────────────────────────── */}
      <Box px={5} py={5} borderBottom="1px solid" borderColor="sidebar.border">
        <Flex align="center" gap={3}>
          <Flex
            align="center"
            justify="center"
            w={9}
            h={9}
            borderRadius="xl"
            flexShrink={0}
            overflow="hidden"
            bg={settings?.logoUrl ? 'white' : 'transparent'}
            style={settings?.logoUrl ? {} : {
              background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
            }}
          >
            {settings?.logoUrl ? (
              <Image src={settings.logoUrl} alt="Logo" maxW="80%" maxH="80%" objectFit="contain" />
            ) : (
              <BookOpen size={17} color="white" />
            )}
          </Flex>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="extrabold"
              color="white"
              letterSpacing="wide"
              textTransform="uppercase"
              lineHeight="1"
            >
              {settings?.appName || 'CBT Enterprise'}
            </Text>
            <Flex align="center" gap={1.5} mt={0.5} wrap="wrap">
              <Text fontSize="2xs" color="blue.500" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                Admin Panel
              </Text>
              {settings?.academicYear && (
                <Box
                  fontSize="9px"
                  bg="indigo.600"
                  color="indigo.100"
                  fontWeight="black"
                  px={1.5}
                  py={0.2}
                  borderRadius="md"
                  textTransform="none"
                  letterSpacing="normal"
                >
                  {settings.academicYear}
                </Box>
              )}
            </Flex>
          </Box>
        </Flex>
      </Box>

      <Stack flex={1} px={3} pt={4} gap={4} as="nav" overflowY="auto" pb={4}>
        {visibleMenuGroups.map((group) => (
          <Stack key={group.titleKey} gap={1}>
            <Text fontSize="2xs" fontWeight="semibold" color="#526484" letterSpacing="wider" textTransform="uppercase" px={3} mb={1}>
              {t(group.titleKey)}
            </Text>
            {group.items.map((item) => {
              const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href} passHref style={{ width: '100%' }}>
                  <Flex
                    as="span"
                    align="center"
                    gap={3}
                    px={3}
                    py={2}
                    borderRadius="xl"
                    cursor="pointer"
                    transition="all 0.15s"
                    position="relative"
                    style={isActive ? { background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.25)' } : { background: 'transparent', border: '1px solid transparent' }}
                    _hover={!isActive ? { bg: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' } : {}}
                  >
                    {isActive && (
                      <Box position="absolute" left={0} top="20%" bottom="20%" w={0.5} borderRadius="full" style={{ background: 'linear-gradient(to bottom, #6366f1, #818cf8)' }} />
                    )}
                    <Box color={isActive ? '#818cf8' : '#6b7fa0'} transition="color 0.15s">
                      <item.icon size={17} />
                    </Box>
                    <Text fontSize="xs" fontWeight={isActive ? 'bold' : 'medium'} color={isActive ? '#c7d2fe' : '#7a8fab'} transition="color 0.15s">
                      {t(item.key)}
                    </Text>
                  </Flex>
                </Link>
              );
            })}
          </Stack>
        ))}

        <Box px={3} pt={4} borderTop="1px solid" borderColor="rgba(255,255,255,0.1)">
          <Flex align="center" justify="space-between" py={2}>
            <HStack gap={2} color="#7a8fab">
              <Bell size={16} />
              <Text fontSize="xs" fontWeight="medium">{t('notifications')}</Text>
            </HStack>
          </Flex>
        </Box>
      </Stack>

      <Box px={3} py={4} borderTop="1px solid" style={{ borderColor: 'rgba(28,45,74,0.6)' }}>
        <HStack gap={3} px={3} py={2.5} borderRadius="xl" mb={1} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Flex w={8} h={8} borderRadius="full" align="center" justify="center" color="white" fontWeight="black" fontSize="sm" flexShrink={0} style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 2px 8px rgba(79,70,229,0.4)' }}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
          </Flex>
          <Box overflow="hidden" flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="white" truncate lineHeight="1.2">{user?.fullName}</Text>
            <Text fontSize="2xs" color="blue.500" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" truncate mt={0.5}>{user?.role}</Text>
          </Box>
        </HStack>
        <Button onClick={handleLogout} variant="ghost" w="full" justifyContent="start" px={3} py={2} borderRadius="xl" cursor="pointer" color="#6b7fa0" _hover={{ bg: 'rgba(244,63,94,0.08)', color: '#fb7185', borderColor: 'rgba(244,63,94,0.15)' }} border="1px solid transparent" transition="all 0.15s" size="sm">
          <LogOut size={16} />
          <Text fontWeight="semibold" ml={2.5} fontSize="sm">{t('logout')}</Text>
        </Button>
      </Box>
    </Box>
  );
}
