'use client';

import { ExamList } from '@/components/dashboard/exam-list';
import { ExamHistory } from '@/components/dashboard/exam-history';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  VStack,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { BookOpen, LogOut, GraduationCap, Clock, Hash, Award, Users, History } from 'lucide-react';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { assetUrl } from '@/lib/env';

const getAssetUrl = assetUrl;

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState<'exams' | 'history'>('exams');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const res = await api.get('/students/me');
      return res.data;
    },
  });

  const { data: serverTime } = useQuery({
    queryKey: ['server-time'],
    queryFn: async () => {
      const res = await api.get('/server-time');
      return res.data.serverTime;
    },
    refetchInterval: 1000,
  });

  const formattedServerTime = serverTime
    ? new Date(serverTime).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : 'Memuat...';

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.put('/students/profile/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
  });

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      await uploadPhotoMutation.mutateAsync(file);
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

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
                style={
                  settings?.logoUrl
                    ? {}
                    : {
                        background:
                          'linear-gradient(135deg, #4f46e5, #2563eb)',
                        boxShadow:
                          '0 4px 12px rgba(79,70,229,0.35)',
                      }
                }
              >
                {settings?.logoUrl ? (
                  <Image
                    src={getAssetUrl(settings.logoUrl)}
                    alt="Logo"
                    maxW="80%"
                    maxH="80%"
                    objectFit="contain"
                  />
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
                  {settings?.appName || 'Novatech CBT'}
                </Text>
                <Text
                  fontSize="2xs"
                  color="text.muted"
                  fontWeight="semibold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  Portal Siswa
                </Text>
                <Breadcrumb />
              </Box>
            </Flex>

            {/* Right controls */}
            <HStack gap={3}>
              {/* Server time */}
              <HStack gap={1.5} color="text.secondary" display={{ base: 'none', md: 'flex' }} whiteSpace="nowrap">
                <Clock size={14} className="text-indigo-500" />
                <Text fontSize="xs" fontWeight="semibold">
                  {formattedServerTime}
                </Text>
              </HStack>

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
                  style={{
                    background:
                      'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  }}
                >
                  <Text
                    fontSize="2xs"
                    color="white"
                    fontWeight="black"
                  >
                    {user.fullName?.charAt(0)?.toUpperCase()}
                  </Text>
                </Flex>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="text.primary"
                >
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
                <Text fontSize="sm" fontWeight="semibold">
                  Keluar
                </Text>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ── Main Content ────────────────────────────────── */}
      <Container as="main" maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        {/* ── Student Profile & Welcome Header ──────────────────── */}
        <Box
          mb={8}
          p={6}
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.brand"
          bg="brand.subtle"
          boxShadow="sm"
          position="relative"
          overflow="hidden"
        >
          {/* Decorative ambient gradient backdrop */}
          <Box
            position="absolute"
            right="-20px"
            top="-20px"
            w="140px"
            h="140px"
            borderRadius="full"
            bg="brand.muted"
            style={{ filter: 'blur(30px)', opacity: 0.4, pointerEvents: 'none' }}
          />

          {isLoadingProfile ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="indigo.600" />
            </Flex>
          ) : (
            <Flex
              gap={6}
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'center', md: 'center' }}
              position="relative"
              zIndex={1}
            >
              {/* Photo component */}
              <Box
                position="relative"
                w="120px"
                h="120px"
                borderRadius="2xl"
                overflow="hidden"
                bg="bg.surface"
                border="2px solid"
                borderColor="border.default"
                flexShrink={0}
                boxShadow="sm"
              >
                {profile?.photo ? (
                  <Image
                    src={getAssetUrl(profile.photo)}
                    alt="Foto Siswa"
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                ) : (
                  <Flex align="center" justify="center" w="full" h="full" direction="column" bg="gray.150" _dark={{ bg: 'gray.800' }}>
                    <BookOpen size={28} className="text-gray-400" />
                    <Text fontSize="3xs" color="gray.500" mt={1}>Tidak Ada Foto</Text>
                  </Flex>
                )}
                <Button
                  size="2xs"
                  position="absolute"
                  insetX={0}
                  bottom={0}
                  w="full"
                  h="6"
                  borderRadius="none"
                  bg="blackAlpha.700"
                  color="white"
                  fontSize="3xs"
                  _hover={{ bg: 'blackAlpha.900' }}
                  cursor="pointer"
                  onClick={() => photoInputRef.current?.click()}
                  loading={isUploadingPhoto}
                >
                  Ubah Foto
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleUploadPhoto}
                />
              </Box>

              {/* Identity Info */}
              <VStack align="flex-start" gap={1.5} flex={1} w="full">
                <Box>
                  <Text
                    fontSize="2xs"
                    color="brand.text"
                    fontWeight="black"
                    textTransform="uppercase"
                    letterSpacing="widest"
                  >
                    Selamat Datang Kembali
                  </Text>
                  <Heading
                    size="lg"
                    fontWeight="black"
                    color="text.primary"
                    letterSpacing="tight"
                    mt={0.5}
                  >
                    {profile?.fullName}
                  </Heading>
                  <Text fontSize="xs" color="text.secondary" mt={0.5}>
                    {profile?.email}
                  </Text>
                </Box>

                <HStack gap={3} mt={2.5} flexWrap="wrap">
                  <HStack gap={1.5} bg="bg.surface" px={3} py={1} borderRadius="lg" border="1px solid" borderColor="border.default">
                    <Hash size={12} className="text-blue-500" />
                    <Text fontWeight="bold" color="text.secondary" fontSize="2xs">NIS:</Text>
                    <Badge colorScheme="blue" variant="subtle" px={1.5} py={0.2} borderRadius="md" fontSize="3xs">
                      {profile?.nis ?? '-'}
                    </Badge>
                  </HStack>
                  <HStack gap={1.5} bg="bg.surface" px={3} py={1} borderRadius="lg" border="1px solid" borderColor="border.default">
                    <Award size={12} className="text-purple-500" />
                    <Text fontWeight="bold" color="text.secondary" fontSize="2xs">JURUSAN:</Text>
                    <Badge colorScheme="purple" variant="subtle" px={1.5} py={0.2} borderRadius="md" fontSize="3xs">
                      {profile?.major?.name ?? 'Belum Ditentukan'}
                    </Badge>
                  </HStack>
                  <HStack gap={1.5} bg="bg.surface" px={3} py={1} borderRadius="lg" border="1px solid" borderColor="border.default">
                    <Users size={12} className="text-green-500" />
                    <Text fontWeight="bold" color="text.secondary" fontSize="2xs">ROMBEL:</Text>
                    <Badge colorScheme="green" variant="subtle" px={1.5} py={0.2} borderRadius="md" fontSize="3xs">
                      {profile?.rombel?.name ?? 'Belum Ditentukan'}
                    </Badge>
                  </HStack>
                </HStack>
              </VStack>
            </Flex>
          )}
        </Box>

        {/* ── Navigation Tabs ────────────────────────────────── */}
        <Flex gap={2} mb={6} borderBottom="1px solid" borderColor="border.default" pb={3} wrap="wrap">
          <Button
            size="sm"
            variant={activeTab === 'exams' ? 'solid' : 'ghost'}
            bg={activeTab === 'exams' ? 'indigo.600' : 'transparent'}
            color={activeTab === 'exams' ? 'white' : 'text.secondary'}
            _hover={activeTab === 'exams' ? { bg: 'indigo.700' } : { bg: 'bg.hover' }}
            borderRadius="xl"
            fontWeight="bold"
            px={4}
            py={4.5}
            onClick={() => setActiveTab('exams')}
            cursor="pointer"
            gap={2}
          >
            <BookOpen size={15} />
            Ujian Tersedia
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'history' ? 'solid' : 'ghost'}
            bg={activeTab === 'history' ? 'indigo.600' : 'transparent'}
            color={activeTab === 'history' ? 'white' : 'text.secondary'}
            _hover={activeTab === 'history' ? { bg: 'indigo.700' } : { bg: 'bg.hover' }}
            borderRadius="xl"
            fontWeight="bold"
            px={4}
            py={4.5}
            onClick={() => setActiveTab('history')}
            cursor="pointer"
            gap={2}
          >
            <History size={15} />
            Riwayat Pengerjaan
          </Button>
        </Flex>

        {/* ── Tab Content Panel ────────────────────────────────── */}
        {activeTab === 'exams' ? (
          <Stack gap={6}>
            <Stack gap={1} mb={2}>
              <Heading size="md" fontWeight="bold" color="text.primary">
                Daftar Ujian Tersedia
              </Heading>
              <Text color="text.secondary" fontSize="sm">
                Pilih ujian aktif yang ingin Anda ikuti untuk memulai pengerjaan.
              </Text>
            </Stack>
            <ExamList />
          </Stack>
        ) : (
          <Stack gap={6}>
            <ExamHistory />
          </Stack>
        )}
      </Container>
    </Box>
  );
}
