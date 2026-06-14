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
} from '@chakra-ui/react';

const menuItems = [
  { name: 'Dashboard',      href: '/admin',                icon: LayoutDashboard },
  { name: 'Mata Pelajaran', href: '/admin/subjects',       icon: BookOpen },
  { name: 'Bank Soal',      href: '/admin/question-banks', icon: FileText },
  { name: 'Ujian',          href: '/admin/exams',          icon: GraduationCap },
  { name: 'Monitoring',     href: '/admin/monitoring',     icon: Activity },
  { name: 'Pengguna',       href: '/admin/users',          icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
              boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
            }}
          >
            <BookOpen size={17} color="white" />
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
              CBT Enterprise
            </Text>
            <Text fontSize="2xs" color="blue.500" fontWeight="bold" letterSpacing="widest" textTransform="uppercase" mt={0.5}>
              Admin Panel
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* ── Navigation ─────────────────────────────── */}
      <Stack flex={1} px={3} pt={4} gap={0.5} as="nav" overflowY="auto">
        {menuItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link key={item.name} href={item.href} passHref style={{ width: '100%' }}>
              <Flex
                as="span"
                align="center"
                gap={3}
                px={3}
                py={2.5}
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.15s"
                position="relative"
                style={
                  isActive
                    ? {
                        background: 'rgba(99,102,241,0.18)',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid transparent',
                      }
                }
                _hover={
                  !isActive
                    ? {
                        bg: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }
                    : {}
                }
              >
                {/* Active indicator */}
                {isActive && (
                  <Box
                    position="absolute"
                    left={0}
                    top="20%"
                    bottom="20%"
                    w={0.5}
                    borderRadius="full"
                    style={{
                      background: 'linear-gradient(to bottom, #6366f1, #818cf8)',
                    }}
                  />
                )}

                <Box
                  color={isActive ? '#818cf8' : '#6b7fa0'}
                  transition="color 0.15s"
                >
                  <item.icon size={18} />
                </Box>

                <Text
                  fontSize="sm"
                  fontWeight={isActive ? 'bold' : 'medium'}
                  color={isActive ? '#c7d2fe' : '#7a8fab'}
                  transition="color 0.15s"
                >
                  {item.name}
                </Text>
              </Flex>
            </Link>
          );
        })}
      </Stack>

      {/* ── Bottom: User + Controls ─────────────────── */}
      <Box px={3} py={4} borderTop="1px solid" style={{ borderColor: 'rgba(28,45,74,0.6)' }}>
        {/* User info */}
        <HStack gap={3} px={3} py={2.5} borderRadius="xl" mb={1}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
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
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
            }}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
          </Flex>
          <Box overflow="hidden" flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="white" truncate lineHeight="1.2">
              {user?.fullName}
            </Text>
            <Text fontSize="2xs" color="blue.500" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" truncate mt={0.5}>
              {user?.role}
            </Text>
          </Box>
        </HStack>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          w="full"
          justifyContent="start"
          px={3}
          py={2}
          borderRadius="xl"
          cursor="pointer"
          color="#6b7fa0"
          _hover={{
            bg: 'rgba(244,63,94,0.08)',
            color: '#fb7185',
            borderColor: 'rgba(244,63,94,0.15)',
          }}
          border="1px solid transparent"
          transition="all 0.15s"
          size="sm"
        >
          <LogOut size={16} />
          <Text fontWeight="semibold" ml={2.5} fontSize="sm">Keluar</Text>
        </Button>
      </Box>
    </Box>
  );
}
