'use client';

import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExamNotFoundProps {
  status?: 'not-found' | 'forbidden' | 'error';
  message?: string;
}

export function ExamNotFound({ status = 'not-found', message }: ExamNotFoundProps) {
  const router = useRouter();

  const config = {
    'not-found': {
      icon: FileQuestion,
      title: 'Ujian Tidak Ditemukan',
      desc: 'Ujian yang Anda cari tidak tersedia atau telah dihapus. Periksa kembali jadwal ujian Anda.',
      primaryLabel: 'Kembali ke Dashboard',
      primaryAction: () => router.push('/dashboard'),
    },
    'forbidden': {
      icon: FileQuestion,
      title: 'Akses Ditolak',
      desc: 'Anda tidak memiliki akses ke ujian ini. Hubungi pengawas jika ini adalah kesalahan.',
      primaryLabel: 'Kembali ke Dashboard',
      primaryAction: () => router.push('/dashboard'),
    },
    'error': {
      icon: FileQuestion,
      title: 'Terjadi Kesalahan',
      desc: message || 'Gagal memuat data ujian. Silakan coba lagi.',
      primaryLabel: 'Coba Lagi',
      primaryAction: () => router.refresh(),
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <Flex minH="100dvh" bg="dd.canvas" align="center" justify="center" p={6} fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
      <Box maxW="md" w="full" textAlign="center">
        {/* Icon */}
        <Flex
          w={20}
          h={20}
          mx="auto"
          mb={6}
          borderRadius="full"
          bg="dd.surface.alt"
          border="1px solid"
          borderColor="dd.border"
          align="center"
          justify="center"
        >
          <Icon size={36} color="var(--chakra-colors-dd-text-muted)" strokeWidth={1.5} />
        </Flex>

        <Heading size="lg" fontWeight="700" color="dd.text" mb={3}>
          {c.title}
        </Heading>
        <Text fontSize="14px" color="dd.text.muted" lineHeight="1.5" mb={8}>
          {c.desc}
        </Text>

        <Flex gap={3} justify="center">
          <Button
            variant="outline"
            borderColor="dd.border"
            color="dd.text"
            borderRadius="md"
            fontSize="13px"
            fontWeight="bold"
            height="38px"
            px={5}
            _hover={{ bg: 'dd.surface.alt' }}
            onClick={() => router.back()}
          >
            <ArrowLeft size={14} style={{ marginRight: 6 }} />
            Kembali
          </Button>
          <Button
            bg="dd.brand"
            color="white"
            borderRadius="md"
            fontSize="13px"
            fontWeight="bold"
            height="38px"
            px={5}
            _hover={{ bg: 'dd.brand.hover' }}
            onClick={c.primaryAction}
          >
            <Home size={14} style={{ marginRight: 6 }} />
            {c.primaryLabel}
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
