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
import { BookOpen, LogOut, Clock, Hash, Award, Users, History } from 'lucide-react';
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
      if (res.data?.photo) {
        useAuthStore.getState().updateUser({ photo: res.data.photo });
      }
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      if (data?.photoUrl) {
        useAuthStore.getState().updateUser({ photo: data.photoUrl });
      }
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
    <Box minH="100vh" bg={{ base: '#F4F5F7', _dark: '#1B1B1B' }} fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
      {/* ── Navbar ─────────────────────────────────────── */}
      <Box
        as="nav"
        bg={{ base: '#FFFFFF', _dark: '#242424' }}
        borderBottom="1px solid"
        borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
        position="sticky"
        top={0}
        zIndex={10}
        style={{ backdropFilter: 'blur(10px)' }}
        boxShadow="0 1px 4px rgba(0,0,0,0.02)"
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
                borderRadius="md"
                overflow="hidden"
                bg={settings?.logoUrl ? 'white' : 'transparent'}
                style={
                  settings?.logoUrl
                    ? {}
                    : {
                        background:
                          'linear-gradient(135deg, #774AA4, #9C55E8)',
                        boxShadow:
                          '0 4px 12px rgba(156,85,232,0.25)',
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
                  <BookOpen size={16} color="white" />
                )}
              </Flex>
              <Box>
                <Text
                  fontWeight="bold"
                  color={{ base: '#1F2328', _dark: '#E0E0E0' }}
                  fontSize="13px"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  lineHeight="1"
                >
                  {settings?.appName || 'Novatech CBT'}
                </Text>
                <Text
                  fontSize="10px"
                  color={{ base: '#57606A', _dark: '#8A8A8A' }}
                  fontWeight="semibold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  mt={0.5}
                >
                  Portal Siswa
                </Text>
              </Box>
            </Flex>

            {/* Right controls */}
            <HStack gap={3}>
              {/* Server time */}
              <HStack gap={1.5} color={{ base: '#57606A', _dark: '#8A8A8A' }} display={{ base: 'none', md: 'flex' }} whiteSpace="nowrap">
                <Clock size={12} className="text-purple-500" />
                <Text fontSize="11px" fontWeight="semibold" fontFamily="Courier New, Courier, monospace">
                  {formattedServerTime}
                </Text>
              </HStack>

              {/* User badge */}
              <Flex
                align="center"
                gap={2.5}
                px={3}
                py={1.5}
                borderRadius="md"
                border="1px solid"
                borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
                bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }}
                display={{ base: 'none', sm: 'flex' }}
              >
                <Flex
                  w={5}
                  h={5}
                  borderRadius="md"
                  align="center"
                  justify="center"
                  style={{
                    background:
                      'linear-gradient(135deg, #774AA4, #9C55E8)',
                  }}
                >
                  <Text
                    fontSize="10px"
                    color="white"
                    fontWeight="black"
                  >
                    {user.fullName?.charAt(0)?.toUpperCase()}
                  </Text>
                </Flex>
                <Text
                  fontSize="12px"
                  fontWeight="semibold"
                  color={{ base: '#1F2328', _dark: '#E0E0E0' }}
                >
                  {user.fullName}
                </Text>
              </Flex>
              <ColorModeToggle size="md" />
              <Button
                size="sm"
                variant="ghost"
                color="#EF4444"
                borderRadius="md"
                _hover={{ bg: { base: 'rgba(239, 68, 68, 0.08)', _dark: 'rgba(239, 68, 68, 0.15)' } }}
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                cursor="pointer"
                gap={1.5}
                height="32px"
              >
                <LogOut size={13} />
                <Text fontSize="12px" fontWeight="bold">
                  Keluar
                </Text>
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ── Main Content ────────────────────────────────── */}
      <Container as="main" maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={6}>
        {/* ── Student Profile & Welcome Header ──────────────────── */}
        <Box
          mb={6}
          p={5}
          borderRadius="md"
          border="1px solid"
          borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
          bg={{ base: '#FFFFFF', _dark: '#242424' }}
          boxShadow="0 1px 4px rgba(0,0,0,0.05)"
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
            bg="rgba(156, 85, 232, 0.08)"
            style={{ filter: 'blur(30px)', pointerEvents: 'none' }}
          />

          {isLoadingProfile ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="#9C55E8" />
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
                w="100px"
                h="100px"
                borderRadius="md"
                overflow="hidden"
                bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }}
                border="1px solid"
                borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
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
                  <Flex align="center" justify="center" w="full" h="full" direction="column" bg={{ base: '#F4F5F7', _dark: '#1B1B1B' }}>
                    <BookOpen size={24} className="text-gray-400" />
                    <Text fontSize="10px" color={{ base: '#57606A', _dark: '#8A8A8A' }} mt={1}>Tidak Ada Foto</Text>
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
                  fontSize="9px"
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
                    fontSize="10px"
                    color="#9C55E8"
                    fontWeight="black"
                    textTransform="uppercase"
                    letterSpacing="widest"
                  >
                    Selamat Datang Kembali
                  </Text>
                  <Heading
                    size="md"
                    fontWeight="bold"
                    color={{ base: '#1F2328', _dark: '#E0E0E0' }}
                    letterSpacing="tight"
                    mt={0.5}
                  >
                    {profile?.fullName}
                  </Heading>
                  <Text fontSize="12px" color={{ base: '#57606A', _dark: '#8A8A8A' }} mt={0.5}>
                    {profile?.email}
                  </Text>
                </Box>

                <HStack gap={3} mt={2} flexWrap="wrap">
                  <HStack gap={1.5} bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} px={3} py={1} borderRadius="md" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}>
                    <Hash size={11} className="text-blue-500" />
                    <Text fontWeight="bold" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="10px">NIS:</Text>
                    <Badge bg="rgba(45, 155, 240, 0.15)" color="#2D9BF0" border="1px solid" borderColor="rgba(45, 155, 240, 0.25)" px={1.5} py={0.2} borderRadius="md" fontSize="9px" fontWeight="bold">
                      {profile?.nis ?? '-'}
                    </Badge>
                  </HStack>
                  <HStack gap={1.5} bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} px={3} py={1} borderRadius="md" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}>
                    <Award size={11} className="text-purple-500" />
                    <Text fontWeight="bold" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="10px">JURUSAN:</Text>
                    <Badge bg="rgba(156, 85, 232, 0.15)" color="#9C55E8" border="1px solid" borderColor="rgba(156, 85, 232, 0.25)" px={1.5} py={0.2} borderRadius="md" fontSize="9px" fontWeight="bold">
                      {profile?.major?.name ?? 'Belum Ditentukan'}
                    </Badge>
                  </HStack>
                  <HStack gap={1.5} bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} px={3} py={1} borderRadius="md" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}>
                    <Users size={11} className="text-green-500" />
                    <Text fontWeight="bold" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="10px">ROMBEL:</Text>
                    <Badge bg="rgba(26, 190, 113, 0.15)" color="#1ABE71" border="1px solid" borderColor="rgba(26, 190, 113, 0.25)" px={1.5} py={0.2} borderRadius="md" fontSize="9px" fontWeight="bold">
                      {profile?.rombel?.name ?? 'Belum Ditentukan'}
                    </Badge>
                  </HStack>
                </HStack>
              </VStack>
            </Flex>
          )}
        </Box>

        {/* ── Navigation Tabs ────────────────────────────────── */}
        <Flex gap={2} mb={6} borderBottom="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} pb={3} wrap="wrap">
          <Button
            size="sm"
            variant="ghost"
            bg={activeTab === 'exams' ? '#9C55E8' : 'transparent'}
            color={activeTab === 'exams' ? 'white' : { base: '#57606A', _dark: '#8A8A8A' }}
            _hover={activeTab === 'exams' ? { bg: '#a86bf5' } : { bg: { base: '#F9FAFC', _dark: '#2D2D2D' } }}
            borderRadius="md"
            fontWeight="bold"
            px={4}
            height="36px"
            onClick={() => setActiveTab('exams')}
            cursor="pointer"
            gap={2}
          >
            <BookOpen size={14} />
            Ujian Tersedia
          </Button>
          <Button
            size="sm"
            variant="ghost"
            bg={activeTab === 'history' ? '#9C55E8' : 'transparent'}
            color={activeTab === 'history' ? 'white' : { base: '#57606A', _dark: '#8A8A8A' }}
            _hover={activeTab === 'history' ? { bg: '#a86bf5' } : { bg: { base: '#F9FAFC', _dark: '#2D2D2D' } }}
            borderRadius="md"
            fontWeight="bold"
            px={4}
            height="36px"
            onClick={() => setActiveTab('history')}
            cursor="pointer"
            gap={2}
          >
            <History size={14} />
            Riwayat Pengerjaan
          </Button>
        </Flex>

        {/* ── Tab Content Panel ────────────────────────────────── */}
        {activeTab === 'exams' ? (
          <Stack gap={5}>
            <Stack gap={1} mb={2}>
              <Heading size="sm" fontWeight="bold" color={{ base: '#1F2328', _dark: '#E0E0E0' }}>
                Daftar Ujian Tersedia
              </Heading>
              <Text color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="12px">
                Pilih ujian aktif yang ingin Anda ikuti untuk memulai pengerjaan.
              </Text>
            </Stack>
            <ExamList />
          </Stack>
        ) : (
          <Stack gap={5}>
            <ExamHistory />
          </Stack>
        )}
      </Container>
    </Box>
  );
}
