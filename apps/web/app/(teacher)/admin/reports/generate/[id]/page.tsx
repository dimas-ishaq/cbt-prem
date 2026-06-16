'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Box, Flex, Heading, Text, Spinner, Button, Stack } from '@chakra-ui/react';
import Link from 'next/link';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  criteria: string;
  generateUrl: string;
}

export default function ReportGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading } = useQuery<ReportItem>({
    queryKey: ['report-item', id],
    queryFn: async () => {
      const res = await api.get('/reports/recommendations');
      const all = res.data;
      const segments = all.exam ?? [];
      const fallback = all.student ?? all.monitoring ?? all.operational ?? all.premium ?? [];
      const list = segments.length > 0 ? segments : fallback;
      const found = list.find((r: any) => r.id === id);
      if (!found) throw new Error('Laporan tidak ditemukan');
      return found;
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <Spinner size="lg" color="indigo.600" />
      </Flex>
    );
  }

  if (!data) {
    return (
      <Flex justify="center" minH="40vh" align="center">
        <Box p={4} bg="red.50" color="red.700" borderRadius="xl" w="full" textAlign="center" fontWeight="semibold">
          Laporan tidak ditemukan.
        </Box>
      </Flex>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={12}>
      <Heading size="lg" fontWeight="bold" color="gray.900" mb={2}>
        {data.title}
      </Heading>
      <Text color="gray.600" mb={6}>{data.description}</Text>
      <Box p={4} bg="blue.50" color="blue.700" mb={6} borderRadius="xl" fontSize="sm">
        {data.criteria}
      </Box>
      <Stack gap={3} direction="row">
        <a href={data.generateUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <Button colorPalette="green" borderRadius="xl" cursor="pointer">
            Unduh Laporan
          </Button>
        </a>
        <Link href="/admin/reports" style={{ textDecoration: 'none' }}>
          <Button variant="outline" colorPalette="gray" borderRadius="xl" cursor="pointer">
            Kembali ke Rekomendasi Laporan
          </Button>
        </Link>
      </Stack>
    </Box>
  );
}
