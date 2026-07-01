'use client';

import { LoginForm } from '@/components/auth/login-form';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';
import { Shield, Zap, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { Box, Flex, Heading, Text, Stack, Image } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const features = [
  {
    icon: Shield,
    color: '#6ee7b7',
    title: 'Proctoring Cerdas',
    desc: 'Deteksi tab switching & pembatasan fokus secara presisi untuk menjamin integritas ujian.',
  },
  {
    icon: Zap,
    color: '#fcd34d',
    title: 'Monitoring Real-time',
    desc: 'Pengawas memantau status & aktivitas seluruh peserta secara langsung dan terperinci.',
  },
  {
    icon: Clock,
    color: '#93c5fd',
    title: 'Manajemen Waktu Otomatis',
    desc: 'Timer presisi dengan auto-submit untuk memastikan ujian berjalan sesuai jadwal.',
  },
];

const trustBadges = [
  { label: 'SSL Encrypted' },
  { label: 'ISO 27001' },
  { label: 'Zero-Trust Security' },
];

export default function LoginPage() {
  const { user, access_token, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !mounted) return;

    if (access_token && user) {
      if (user.role === 'SISWA') {
        router.push('/dashboard');
      } else {
        router.push('/admin');
      }
    }
  }, [hasHydrated, mounted, user, access_token, router]);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  if (!mounted || !hasHydrated) {
    return null;
  }
  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>

      {/* ── LEFT PANEL: Brand / Showcase ─────────────────────── */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        w="50%"
        position="relative"
        overflow="hidden"
        style={{
          background: 'linear-gradient(155deg, #0f172a 0%, #1a2544 45%, #102a43 100%)',
        }}
      >
        {/* Glowing blobs */}
        <Box
          position="absolute"
          top="-100px"
          left="-100px"
          w="400px"
          h="400px"
          borderRadius="full"
          style={{ background: 'rgba(79,70,229,0.15)', filter: 'blur(80px)' }}
        />
        <Box
          position="absolute"
          bottom="-80px"
          right="-80px"
          w="350px"
          h="350px"
          borderRadius="full"
          style={{ background: 'rgba(37,99,235,0.12)', filter: 'blur(70px)' }}
        />
        <Box
          position="absolute"
          top="35%"
          right="10%"
          w="200px"
          h="200px"
          borderRadius="full"
          style={{ background: 'rgba(245,158,11,0.06)', filter: 'blur(50px)' }}
        />

        {/* Grid pattern overlay */}
        <Box
          position="absolute"
          inset={0}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <Flex
          direction="column"
          justify="space-between"
          p={12}
          position="relative"
          zIndex={1}
          w="full"
        >
          {/* Logo */}
          <Flex align="center" gap={3} pb={5}>
            <Flex
              align="center"
              justify="center"
              w={10}
              h={10}
              borderRadius="xl"
              flexShrink={0}
              overflow="hidden"
              bg={settings?.logoUrl ? 'white' : 'transparent'}
              style={settings?.logoUrl ? {} : {
                background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                boxShadow: '0 4px 14px rgba(79,70,229,0.45)',
              }}
            >
              {settings?.logoUrl ? (
                <Image src={settings.logoUrl} alt="Logo" maxW="80%" maxH="80%" objectFit="contain" />
              ) : (
                <BookOpen size={20} color="white" />
              )}
            </Flex>
            <Box>
              <Text
                color="white"
                fontWeight="extrabold"
                fontSize="md"
                letterSpacing="widest"
                textTransform="uppercase"
                lineHeight="1"
              >
                {settings?.appName || 'Novatech CBT'}
              </Text>
              <Text fontSize="2xs" color="blue.400" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">
                Secure Platform
              </Text>
            </Box>
          </Flex>

          {/* Hero */}
          <Stack gap={7} maxW="420px">
            <Box>
              <Flex align="center" gap={2} mb={4}>
                <Box
                  w={1.5}
                  h={5}
                  borderRadius="full"
                  style={{ background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)' }}
                />
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  color="blue.300"
                >
                  Platform Ujian Digital Terpercaya
                </Text>
              </Flex>

              <Heading
                color="white"
                fontSize={{ lg: '3xl', xl: '4xl' }}
                fontWeight="black"
                lineHeight="1.2"
                letterSpacing="tight"
              >
                Ujian Modern,{' '}
                <Text
                  as="span"
                  style={{
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Terukur &amp; Tepercaya
                </Text>
              </Heading>
            </Box>

            <Text color="blue.200" fontSize="sm" lineHeight="relaxed">
              Sistem CBT berbasis kompetensi dengan teknologi pengawasan mutakhir
              dan analitik hasil ujian secara instan dan transparan.
            </Text>

            {/* Features */}
            <Stack gap={4}>
              {features.map(({ icon: Icon, color, title, desc }) => (
                <Flex key={title} align="start" gap={4} className="animate-fade-up">
                  <Flex
                    align="center"
                    justify="center"
                    w={9}
                    h={9}
                    borderRadius="lg"
                    flexShrink={0}
                    mt={0.5}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Icon size={17} color={color} />
                  </Flex>
                  <Box>
                    <Text color="white" fontWeight="semibold" fontSize="sm">{title}</Text>
                    <Text color="blue.300" fontSize="xs" mt={0.5} lineHeight="relaxed">{desc}</Text>
                  </Box>
                </Flex>
              ))}
            </Stack>

            {/* Stats */}
            <Flex
              gap={6}
              pt={5}
              borderTop="1px solid"
              borderColor="whiteAlpha.100"
            >
              {[
                { value: '10K+', label: 'Peserta' },
                { value: '99.9%', label: 'Uptime' },
                { value: '< 1s', label: 'Response' },
              ].map(({ value, label }) => (
                <Box key={label}>
                  <Text
                    color="white"
                    fontWeight="black"
                    fontSize="xl"
                    style={{
                      background: 'linear-gradient(90deg, #c7d2fe, #818cf8)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {value}
                  </Text>
                  <Text color="blue.400" fontSize="xs" mt={0.5}>{label}</Text>
                </Box>
              ))}
            </Flex>

            {/* Trust badges */}
            <Flex gap={2} flexWrap="wrap">
              {trustBadges.map(({ label }) => (
                <Flex
                  key={label}
                  align="center"
                  gap={1.5}
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <CheckCircle2 size={11} color="#6ee7b7" />
                  <Text fontSize="2xs" color="blue.300" fontWeight="semibold" letterSpacing="wider">
                    {label}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Stack>

          {/* Footer */}
          <Text fontSize="2xs" color="blue.500" fontWeight="medium" letterSpacing="wide">
            &copy; {new Date().getFullYear()} Novatech CBT Platform &mdash; Hak Cipta Dilindungi
          </Text>
        </Flex>
      </Box>

      {/* ── RIGHT PANEL: Login Form ─────────────────────────────── */}
      <Flex
        flex={1}
        align="center"
        justify="center"
        position="relative"
        overflow="hidden"
        bg="bg.canvas"
        p={{ base: 6, md: 12 }}
        minH={{ base: '100vh', lg: 'auto' }}
      >
        {/* Decorative blobs (theme-aware) */}
        <Box
          position="absolute"
          top="-60px"
          right="-60px"
          w="300px"
          h="300px"
          borderRadius="full"
          style={{ filter: 'blur(70px)', opacity: 0.5 }}
          bg="brand.muted"
          zIndex={0}
        />
        <Box
          position="absolute"
          bottom="-60px"
          left="-40px"
          w="260px"
          h="260px"
          borderRadius="full"
          style={{ filter: 'blur(60px)', opacity: 0.35 }}
          bg="brand.muted"
          zIndex={0}
        />

        {/* Color mode toggle – top right */}
        <Box position="absolute" top={5} right={5} zIndex={10}>
          <ColorModeToggle />
        </Box>

        {/* Mobile-only logo */}
        <Box
          display={{ base: 'block', lg: 'none' }}
          position="absolute"
          top={5}
          left={5}
          zIndex={10}
        >
          <Flex align="center" gap={2}>
            <Flex
              align="center"
              justify="center"
              w={7}
              h={7}
              borderRadius="lg"
              overflow="hidden"
              bg={settings?.logoUrl ? 'white' : 'transparent'}
              style={settings?.logoUrl ? {} : {
                background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
              }}
            >
              {settings?.logoUrl ? (
                <Image src={settings.logoUrl} alt="Logo" maxW="80%" maxH="80%" objectFit="contain" />
              ) : (
                <BookOpen size={14} color="white" />
              )}
            </Flex>
            <Text
              fontWeight="extrabold"
              color="brand.text"
              fontSize="sm"
              letterSpacing="wide"
              textTransform="uppercase"
            >
              {settings?.appName || 'Novatech CBT'}
            </Text>
          </Flex>
        </Box>

        <Box position="relative" zIndex={1} w="full" maxW="440px">
          <LoginForm logoUrl={settings?.logoUrl} />
        </Box>
      </Flex>
    </Flex>
  );
}
