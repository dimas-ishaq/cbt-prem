'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Calendar, CalendarClock, ChevronLeft, ChevronRight, Clock3, RefreshCw, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, Heading, HStack, Icon, Input, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react';

interface UpcomingExam {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  subject?: { name: string } | null;
  _count?: { examSessions: number };
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const isUpcomingExam = (exam: UpcomingExam, now: number) => {
  const start = new Date(exam.startTime).getTime();
  return exam.status === 'PUBLISHED' && start > now;
};

export default function UpcomingMonitoringPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery<UpcomingExam[]>({
    queryKey: ['monitoring-upcoming'],
    queryFn: async () => {
      const response = await api.get('/exam-sessions/monitoring/upcoming');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
    refetchInterval: 60_000,
  });

  const filteredExams = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const now = Date.now();
    return list
      .filter((exam) => isUpcomingExam(exam, now))
      .filter((exam) => !dateFilter || exam.startTime.slice(0, 10) === dateFilter)
      .filter((exam) => !searchQuery || exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || exam.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [data, dateFilter, searchQuery]);

  return (
    <Stack gap={8} w="full">
      {/* ─── Header Panel ─── */}
      <Box borderRadius="card" overflow="hidden" bg="bg.surface" borderWidth="1px" borderColor="border.default" px={{ base: 6, md: 8 }} py={{ base: 7, md: 9 }} shadow="card-dark">
        <Stack gap={6}>
          <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" gap={5}>
            <Box maxW="2xl">
              <Link href="/admin/monitoring">
                <Button mb={4} size="sm" borderRadius="xl" bg="bg.subtle" color="text.primary" borderWidth="1px" borderColor="border.default" _hover={{ bg: 'bg.elevated' }}>
                  <ChevronLeft size={16} /> Kembali ke Live Monitoring
                </Button>
              </Link>
              <Heading as="h1" size="2xl" lineHeight="1.05" letterSpacing="tight" color="text.primary">Jadwal monitoring mendatang</Heading>
              <Text mt={3} color="text.secondary" maxW="xl" fontSize="sm">Menampilkan ujian berstatus published yang belum masuk jadwal berjalan.</Text>
            </Box>
            <HStack alignSelf="start" gap={3} flexWrap="wrap">
              <Link href="/admin/monitoring/history">
                <Button size="sm" borderRadius="xl" bg="bg.subtle" color="text.primary" borderWidth="1px" borderColor="border.default" _hover={{ bg: 'bg.elevated' }}>
                  <CalendarClock size={16} /> History
                </Button>
              </Link>
            </HStack>
          </Flex>
          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box position="relative" flex="1">
              <Box position="absolute" left="14px" top="50%" transform="translateY(-50%)" zIndex={2} color="text.secondary"><Search size={18} /></Box>
              <Input
                id="upcoming-monitoring-search"
                placeholder="Cari ujian atau mata pelajaran…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl="40px"
                bg="input.bg"
                borderColor="input.border"
                color="text.primary"
                _placeholder={{ color: 'text.muted' }}
                borderRadius="xl"
              />
            </Box>
            <Input
              id="upcoming-monitoring-date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              borderRadius="xl"
              bg="input.bg"
              borderColor="input.border"
              color="text.primary"
              w={{ base: 'full', md: '220px' }}
            />
            <Button
              id="upcoming-monitoring-refresh"
              onClick={() => refetch()}
              disabled={isFetching}
              borderRadius="xl"
              bg="brand.solid"
              color="text.inverted"
              _hover={{ bg: 'brand.text' }}
              fontWeight="semibold"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Refresh
            </Button>
          </Flex>
        </Stack>
      </Box>

      {isLoading && (
        <Flex justify="center" py={20}>
          <Spinner size="xl" color="brand.solid" />
        </Flex>
      )}

      {!isLoading && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
          {filteredExams.map((exam) => (
            <Box key={exam.id} bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" shadow="card-dark" overflow="hidden">
              <Box h="5px" bg="brand.solid" />
              <Flex p={6} direction="column" justify="space-between" gap={6} h="100%">
                <Box>
                  <Flex align="center" justify="space-between" mb={5}>
                    <Badge bg="brand.subtle" color="brand.text" size="sm" px={3} py={1.5} borderRadius="badge" fontWeight="bold">UPCOMING</Badge>
                    <Badge bg="bg.subtle" color="text.secondary" variant="subtle" px={3} py={1.5} borderRadius="badge">{exam.status}</Badge>
                  </Flex>
                  <Heading size="md" color="text.primary" lineClamp={2} fontWeight="bold">{exam.title}</Heading>
                  <Text fontSize="sm" color="text.secondary" mt={1.5}>{exam.subject?.name || 'Tanpa mata pelajaran'}</Text>
                  <Stack mt={5} gap={3}>
                    <Flex align="center" gap={2.5} fontSize="sm" color="text.secondary">
                      <Icon as={Calendar} color="text.muted" />
                      <Text>{formatDateTime(exam.startTime)}</Text>
                    </Flex>
                    <Flex align="center" gap={2.5} fontSize="sm" color="text.secondary">
                      <Icon as={Clock3} color="text.muted" />
                      <Text>Selesai {formatDateTime(exam.endTime)}</Text>
                    </Flex>
                    <Flex align="center" gap={2.5} fontSize="sm" color="text.secondary">
                      <Icon as={Users} color="text.muted" />
                      <Text>{exam._count?.examSessions ?? 0} session terhubung</Text>
                    </Flex>
                  </Stack>
                </Box>
                <Link href={`/admin/monitoring/${exam.id}`} style={{ width: '100%' }}>
                  <Button w="full" bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="xl">
                    <Text>Lihat Detail Ujian</Text>
                    <ChevronRight size={18} />
                  </Button>
                </Link>
              </Flex>
            </Box>
          ))}

          {filteredExams.length === 0 && (
            <Box gridColumn="1 / -1">
              <Flex direction="column" align="center" justify="center" py={16} px={6} textAlign="center" borderRadius="card" borderWidth="1px" borderColor="border.default" bg="bg.surface">
                <Box p={4} borderRadius="2xl" bg="bg.subtle" color="text.muted" mb={4}><CalendarClock size={28} /></Box>
                <Heading size="md" color="text.primary">Tidak ada jadwal mendatang</Heading>
                <Text fontSize="sm" color="text.secondary" mt={2} maxW="md">
                  {searchQuery || dateFilter ? 'Tidak ada ujian upcoming yang cocok dengan filter saat ini.' : 'Ujian published yang belum masuk jadwal akan muncul di sini.'}
                </Text>
              </Flex>
            </Box>
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
}