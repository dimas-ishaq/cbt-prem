'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useState, useEffect } from 'react';
import { ChevronLeft, FileDown, Award, Users, CheckCircle, BarChart3, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Stack,
  Table,
  HStack,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface AnalyticsData {
  exam: {
    id: string;
    title: string;
    passingGrade: number;
    subject: { name: string };
  };
  summary: {
    passed: number;
    failed: number;
    highest: number;
    lowest: number;
    average: number;
  };
  distribution: Array<{ label: string; count: number }>;
  itemAnalysis: Array<{
    questionId: string;
    content: string;
    correct: number;
    total: number;
    difficulty: number;
  }>;
}

export default function ExamAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['exam-analytics', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}/analytics`);
      return response.data;
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/exams/${id}/analytics/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analisis-${analytics?.exam?.title || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    onSuccess: () => {
      toast.success('Laporan PDF berhasil diunduh.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat file PDF laporan.');
    },
  });

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="60vh" gap={3}>
        <Spinner size="xl" color="indigo.600" />
        <Text color="gray.500" fontWeight="bold">Memuat Analitik Ujian...</Text>
      </Flex>
    );
  }

  if (error || !analytics) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh" p={6}>
        <AlertCircle size={48} className="text-red-500 mb-3" />
        <Heading size="md" color="gray.800" mb={1}>Gagal Memuat Analitik</Heading>
        <Text color="gray.500" mb={4}>Data ujian tidak ditemukan atau belum memiliki lembar jawaban masuk.</Text>
        <Link href={`/admin/results/${id}`} passHref>
          <Button colorPalette="indigo" borderRadius="xl">Kembali ke Sesi Hasil</Button>
        </Link>
      </Flex>
    );
  }

  const { summary, distribution, itemAnalysis, exam } = analytics;
  const totalStudents = summary.passed + summary.failed;
  const passingRate = totalStudents > 0 ? (summary.passed / totalStudents) * 100 : 0;

  // Chart data configurations
  const passedFailedData = [
    { name: 'Tuntas KKM', value: summary.passed, color: '#10b981' }, // emerald.500
    { name: 'Belum Tuntas', value: summary.failed, color: '#ef4444' }, // red.500
  ];

  return (
    <Stack gap={8} maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={6} position="relative">
      {/* Decorative background blur */}
      <Box
        position="absolute"
        top="-10px"
        right="-50px"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="indigo.400"
        style={{ filter: 'blur(130px)', opacity: 0.05, zIndex: 0 }}
      />

      {/* Header Section */}
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4} position="relative" zIndex={1}>
        <Flex align="center" gap={4}>
          <Link href={`/admin/results/${id}`} passHref>
            <Button variant="ghost" p={2.5} borderRadius="full" cursor="pointer">
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <Box>
            <Heading size="xl" fontWeight="900" letterSpacing="tight" color="gray.900">
              Analisis Hasil Ujian
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={0.5}>
              {exam.title} ({exam.subject?.name}) • Standar KKM: {exam.passingGrade}
            </Text>
          </Box>
        </Flex>

        <Button
          onClick={() => exportPdfMutation.mutate()}
          loading={exportPdfMutation.isPending}
          colorPalette="indigo"
          borderRadius="xl"
          fontWeight="bold"
          fontSize="sm"
          px={5}
          py={5.5}
          cursor="pointer"
          shadow="md"
          _hover={{ shadow: 'lg' }}
        >
          <FileDown size={18} />
          <Text ml={2}>Ekspor Laporan PDF</Text>
        </Button>
      </Flex>

      {/* Summary Aggregate Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5} position="relative" zIndex={1}>
        {/* Total Participants */}
        <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
          <HStack gap={4} align="center">
            <Box p={3} bg="indigo.50" color="indigo.600" borderRadius="xl">
              <Users size={20} />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.450" fontWeight="bold" textTransform="uppercase">Total Peserta</Text>
              <Text fontSize="2xl" fontWeight="extrabold" color="gray.850" mt={0.5}>{totalStudents} Siswa</Text>
            </Box>
          </HStack>
        </Box>

        {/* Passing Rate */}
        <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
          <HStack gap={4} align="center">
            <Box p={3} bg="emerald.50" color="emerald.600" borderRadius="xl">
              <CheckCircle size={20} />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.450" fontWeight="bold" textTransform="uppercase">Kelulusan (KKM)</Text>
              <Text fontSize="2xl" fontWeight="extrabold" color="emerald.600" mt={0.5}>{passingRate.toFixed(1)}%</Text>
            </Box>
          </HStack>
        </Box>

        {/* Average Class Score */}
        <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
          <HStack gap={4} align="center">
            <Box p={3} bg="amber.50" color="amber.600" borderRadius="xl">
              <Award size={20} />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.450" fontWeight="bold" textTransform="uppercase">Rata-rata Nilai</Text>
              <Text fontSize="2xl" fontWeight="extrabold" color="gray.850" mt={0.5}>{analytics.summary.average.toFixed(1)}</Text>
            </Box>
          </HStack>
        </Box>

        {/* Highest & Lowest Score */}
        <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
          <HStack gap={4} align="center">
            <Box p={3} bg="teal.50" color="teal.600" borderRadius="xl">
              <BarChart3 size={20} />
            </Box>
            <Box>
              <Text fontSize="xs" color="gray.450" fontWeight="bold" textTransform="uppercase">Tertinggi / Terendah</Text>
              <Text fontSize="md" fontWeight="extrabold" color="gray.850" mt={1}>
                <Text as="span" color="green.600">{analytics.summary.highest}</Text>
                <Text as="span" color="gray.400"> / </Text>
                <Text as="span" color="red.600">{analytics.summary.lowest}</Text>
              </Text>
            </Box>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* Visual Charts section */}
      {isMounted && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6} position="relative" zIndex={1}>
          {/* Score Distribution Chart */}
          <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
            <Heading size="md" fontWeight="bold" color="gray.800" mb={6} display="flex" alignItems="center" gap={2}>
              <BarChart3 size={18} className="text-indigo-500" />
              Distribusi Kelompok Nilai Siswa
            </Heading>
            <Box h={72}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#10b981' : index === 0 ? '#ef4444' : '#4f46e5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* Passing Rate Pie Chart */}
          <Box bg="white" p={6} borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm">
            <Heading size="md" fontWeight="bold" color="gray.800" mb={6} display="flex" alignItems="center" gap={2}>
              <CheckCircle size={18} className="text-emerald-500" />
              Rasio Ketuntasan Peserta (KKM)
            </Heading>
            <Flex align="center" justify="center" direction={{ base: 'column', sm: 'row' }} gap={8} h={72}>
              <Box w={48} h={48}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={passedFailedData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {passedFailedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} Siswa`} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack gap={3.5} minW="150px">
                {passedFailedData.map((item, index) => (
                  <HStack key={index} gap={3} align="center">
                    <Box w={3.5} h={3.5} borderRadius="full" bg={item.color} />
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.500">{item.name}</Text>
                      <Text fontSize="sm" fontWeight="bold" color="gray.800">
                        {item.value} Siswa ({totalStudents > 0 ? ((item.value / totalStudents) * 100).toFixed(0) : 0}%)
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </Stack>
            </Flex>
          </Box>
        </SimpleGrid>
      )}

      {/* Item Analysis Table */}
      <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" shadow="sm" overflow="hidden" position="relative" zIndex={1}>
        <Box p={6} borderBottom="1px solid" borderColor="gray.100">
          <Heading size="md" fontWeight="bold" color="gray.800" display="flex" alignItems="center" gap={2}>
            <BookOpen size={18} className="text-indigo-500" />
            Analisis Kualitas & Tingkat Kesukaran Soal
          </Heading>
          <Text fontSize="xs" color="gray.450" mt={1}>
            Mengukur persentase jawaban benar per butir soal untuk menganalisis tingkat kesulitan soal secara riil.
          </Text>
        </Box>
        
        <Box overflowX="auto">
          <Table.Root interactive>
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">No</Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Butir Pertanyaan Soal</Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" textAlign="center">Tingkat Kesukaran</Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" textAlign="center">Rasio Benar</Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" textAlign="right">Status Kualitas</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body color="gray.700">
              {itemAnalysis.map((item, index) => {
                const diffPercent = item.difficulty * 100;
                let difficultyLabel = 'Sedang';
                let difficultyColor = 'orange';
                
                if (diffPercent >= 75) {
                  difficultyLabel = 'Mudah';
                  difficultyColor = 'green';
                } else if (diffPercent < 40) {
                  difficultyLabel = 'Sulit';
                  difficultyColor = 'red';
                }

                return (
                  <Table.Row key={item.questionId} _hover={{ bg: 'gray.50/40' }} transition="all 0.15s">
                    <Table.Cell px={6} py={4.5} fontWeight="bold" color="gray.500">{index + 1}</Table.Cell>
                    <Table.Cell px={6} py={4.5} maxW="md">
                      <Text lineClamp={2} fontSize="sm" fontWeight="medium" color="gray.800" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </Table.Cell>
                    <Table.Cell px={6} py={4.5} textAlign="center" fontSize="sm" fontWeight="bold">
                      {diffPercent.toFixed(0)}%
                    </Table.Cell>
                    <Table.Cell px={6} py={4.5} textAlign="center" fontSize="sm" color="gray.500" fontWeight="medium">
                      {item.correct} / {item.total} Siswa
                    </Table.Cell>
                    <Table.Cell px={6} py={4.5} textAlign="right">
                      <Badge colorPalette={difficultyColor} px={2.5} py={0.5} borderRadius="md" fontWeight="bold" fontSize="3xs" textTransform="uppercase">
                        {difficultyLabel}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Stack>
  );
}
