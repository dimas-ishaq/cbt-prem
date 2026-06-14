'use client';

import { ExamList } from '@/components/dashboard/exam-list';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Container,
  HStack,
  Stack,
  Image,
} from '@chakra-ui/react';
import { BookOpen, LogOut, GraduationCap } from 'lucide-react';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* ── Navbar ─────────────────────────────────────── */}
      <Box
        as="nav"
        bg="bg.surface"
        borderBottom="1px solid"
        borderColor="border.default"
        position="sticky"
        top={0}
        zIndex={10}
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={3.5}>
          <Flex justify="space-between" align="center">
            {/* Logo */}
            <Flex align="center" gap={3}>
              <Flex
                align="center"
                justify="center"
                w={9}
                h={9}
                borderRadius="xl"
                overflow="hidden"
                bg={settings?.logoUrl ? 'white' : 'transparent'}
                style={settings?.logoUrl ? {} : {
                  background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                  boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
                }}
              >
                {settings?.logoUrl ? (
                  <Image src={settings.logoUrl} alt="Logo" maxW="80%" maxH="80%" objectFit="contain" />
                ) : (
                  <BookOpen size={18} color="white" />
                )}
              </Flex>
              <Box>
                <Text
                  fontWeight="extrabold"
                  color="brand.text"
                  fontSize="sm"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  lineHeight="1"
                >
                  {settings?.appName || 'CBT Enterprise'}
                </Text>
                <Text fontSize="2xs" color="text.muted" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase">
                  Portal Siswa
                </Text>
              </Box>
            </Flex>

            {/* Right controls */}
            <HStack gap={3}>
              {/* User badge */}
              <Flex
                align="center"
                gap={2.5}
                px={3}
                py={1.5}
                borderRadius="full"
                border="1px solid"
                borderColor="border.default"
                bg="bg.elevated"
                display={{ base: 'none', sm: 'flex' }}
              >
                <Flex
                  w={6}
                  h={6}
                  borderRadius="full"
                  align="center"
                  justify="center"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  <Text fontSize="2xs" color="white" fontWeight="black">
                    {user.fullName?.charAt(0)?.toUpperCase()}
                  </Text>
                </Flex>
                <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                  {user.fullName}
                </Text>
              </Flex>

              <ColorModeToggle size="md" />

              <Button
                size="sm"
                variant="ghost"
                color="status.danger.text"
                borderRadius="lg"
                _hover={{ bg: 'status.danger.bg' }}
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                cursor="pointer"
                gap={1.5}
              >
                <LogOut size={15} />
                <Text fontSize="sm" fontWeight="semibold">Keluar</Text>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ── Main Content ────────────────────────────────── */}
      <Container as="main" maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        {/* Welcome banner */}
        <Box
          mb={8}
          p={6}
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.brand"
          overflow="hidden"
          position="relative"
          bg="brand.subtle"
        >
          <Box
            position="absolute"
            right="-20px"
            top="-20px"
            w="140px"
            h="140px"
            borderRadius="full"
            bg="brand.muted"
            style={{ filter: 'blur(30px)', opacity: 0.4 }}
          />
          <Flex align="center" gap={4} position="relative" zIndex={1}>
            <Flex
              align="center"
              justify="center"
              w={12}
              h={12}
              borderRadius="2xl"
              flexShrink={0}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
                boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
              }}
            >
              <GraduationCap size={24} color="white" />
            </Flex>
            <Box>
              <Text fontSize="xs" color="brand.text" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                Selamat Datang Kembali
              </Text>
              <Heading
                size="lg"
                fontWeight="black"
                color="text.primary"
                letterSpacing="tight"
                mt={0.5}
              >
                {user.fullName}
              </Heading>
              <Text fontSize="sm" color="text.secondary" mt={0.5}>
                Pilih ujian yang tersedia dan mulai kerjakan dengan penuh semangat.
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Exam section header */}
        <Stack gap={1} mb={5}>
          <Heading size="md" fontWeight="bold" color="text.primary">
            Daftar Ujian Tersedia
          </Heading>
          <Text color="text.secondary" fontSize="sm">
            Pilih ujian yang ingin Anda ikuti.
          </Text>
        </Stack>

        <ExamList />
      </Container>
    </Box>
  );
}
