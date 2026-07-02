'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Box, Flex, Heading, Text, Spinner, Button, Stack, HStack } from '@chakra-ui/react';
import { ArrowLeft, Download, FileText, Filter } from 'lucide-react';
import Link from 'next/link';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  criteria: string;
  generateUrl: string;
}

const API_BASE = (api.defaults.baseURL ?? '').replace(/\/+$/, '');

export default function ReportGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading } = useQuery<ReportItem>({
    queryKey: ['report-item', id],
    queryFn: async () => {
      const res = await api.get('/reports');
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
    return <Flex justify="center" align="center" minH="50vh" bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="card" shadow="card-dark"><Spinner size="lg" color="brand.solid" /></Flex>;
  }

  if (!data) {
    return <Flex justify="center" minH="40vh" align="center"><Box p={4} bg="status.danger.bg" color="status.danger.text" borderRadius="xl" w="full" textAlign="center" fontWeight="semibold">Laporan tidak ditemukan.</Box></Flex>;
  }

  return (
    <Box maxW="md" mx="auto" mt={12} bg="bg.surface" p={8} borderRadius="card" border="1px solid" borderColor="border.default" shadow="card-dark">
      <HStack gap={3} mb={3}>
        <Box boxSize={10} borderRadius="lg" bg="brand.subtle" color="brand.text" display="flex" alignItems="center" justifyContent="center"><FileText size={18} /></Box>
        <Heading size="lg" fontWeight="bold" color="text.primary">{data.title}</Heading>
      </HStack>
      <Text color="text.secondary" mb={6}>{data.description}</Text>
      <Box p={4} bg="brand.subtle" color="brand.text" mb={6} borderRadius="xl" fontSize="sm" border="1px solid" borderColor="border.default"><HStack gap={2}><Filter size={14} /><Text>{data.criteria}</Text></HStack></Box>
      <Stack gap={3} direction="row">
        <a href={`${API_BASE}${data.generateUrl.startsWith('/') ? '' : '/'}${data.generateUrl}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><Button bg="status.success.bg" color="status.success.text" borderRadius="xl" cursor="pointer" _hover={{ bg: 'status.success.text', color: 'text.primary' }}><Download size={14} /> Unduh Laporan</Button></a>
        <Link href="/admin/reports" style={{ textDecoration: 'none' }}><Button variant="outline" bg="bg.subtle" color="text.primary" borderColor="border.default" borderRadius="xl" cursor="pointer"><ArrowLeft size={14} /> Kembali</Button></Link>
      </Stack>
    </Box>
  );
}
