'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';

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
  new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

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
      .filter(
        (exam) =>
          !searchQuery ||
          exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exam.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [data, dateFilter, searchQuery]);

  return (
    <Stack gap={8} w="full">
      <Box
        borderRadius="3xl"
        overflow="hidden"
        bg="linear-gradient(135deg, rgba(15,23,42,0.98), rgba(91,33,182,0.96) 52%, rgba(14,116,144,0.9))"
        color="white"
        px={{ base: 6, md: 8 }}
        py={{ base: 7, md: 9 }}
        boxShadow="0 28px 80px rgba(15, 23, 42, 0.24)"
      >
        <Stack gap={6}>
          <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" gap={5}>
            <Box maxW="2xl">
              <Link href="/admin/monitoring">
                <Button mb={4} size="sm" borderRadius="xl" bg="whiteAlpha.160" color="white" _hover={{ bg: 'whiteAlpha.220' }}>
                  <ChevronLeft size={16} />
                  Kembali ke Live Monitoring
                </Button>
              </Link>
              <Heading as="h1" size="2xl" lineHeight="1.05" letterSpacing="tight">
                Jadwal monitoring mendatang
              </Heading>
              <Text mt={3} color="whiteAlpha.820" maxW="xl" fontSize="sm">
                Menampilkan ujian berstatus published yang belum masuk jadwal berjalan.
              </Text>
            </Box>

            <HStack alignSelf="start" gap={3} flexWrap="wrap">
              <Link href="/admin/monitoring/history">
                <Button size="sm" borderRadius="xl" bg="whiteAlpha.170" color="white" _hover={{ bg: 'whiteAlpha.240' }}>
                  <CalendarClock size={16} />
                  History
                </Button>
              </Link>
            </HStack>
          </Flex>

          <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box position="relative" flex="1">
              <Box position="absolute" left="14px" top="50%" transform="translateY(-50%)" zIndex={2} color="whiteAlpha.700">
                <Search size={18} />
              </Box>
              <Input
                id="upcoming-monitoring-search"
                placeholder="Cari ujian atau mata pelajaran�"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl="40px"
                bg="whiteAlpha.140"
                borderColor="whiteAlpha.260"
                color="white"
                _placeholder={{ color: 'whiteAlpha.700' }}
                borderRadius="xl"
              />
            </Box>
            <Input
              id="upcoming-monitoring-date"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              borderRadius="xl"
              bg="whiteAlpha.140"
              borderColor="whiteAlpha.260"
              color="white"
              w={{ base: 'full', md: '220px' }}
            />
            <Button
              id="upcoming-monitoring-refresh"
              onClick={() => refetch()}
              disabled={isFetching}
              borderRadius="xl"
              bg="white"
              color="gray.900"
              fontWeight="semibold"
            >
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </Flex>
        </Stack>
      </Box>

      {isLoading && (
        <Flex justify="center" py={20}>
          <Spinner size="xl" color="indigo.500" />
        </Flex>
      )}

      {!isLoading && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
          {filteredExams.map((exam) => (
            <Box
              key={exam.id}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="3xl"
              boxShadow="0 18px 48px rgba(15, 23, 42, 0.08)"
              overflow="hidden"
            >
              <Box h="5px" bg="linear-gradient(90deg, #8b5cf6, #06b6d4)" />
              <Flex p={6} direction="column" justify="space-between" gap={6} h="100%">
                <Box>
                  <Flex align="center" justify="space-between" mb={5}>
                    <Badge colorPalette="purple" size="sm" px={3} py={1.5} borderRadius="full" fontWeight="bold">
                      UPCOMING
                    </Badge>
                    <Badge colorPalette="blue" variant="subtle" px={3} py={1.5} borderRadius="full">
                      {exam.status}
                    </Badge>
                  </Flex>

                  <Heading size="md" color="gray.800" lineClamp={2} fontWeight="bold">
                    {exam.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mt={1.5}>
                    {exam.subject?.name || 'Tanpa mata pelajaran'}
                  </Text>

                  <Stack mt={5} gap={3}>
                    <Flex align="center" gap={2.5} fontSize="sm" color="gray.600">
                      <Icon as={Calendar} color="gray.400" />
                      <Text>{formatDateTime(exam.startTime)}</Text>
                    </Flex>
                    <Flex align="center" gap={2.5} fontSize="sm" color="gray.600">
                      <Icon as={Clock3} color="gray.400" />
                      <Text>Selesai {formatDateTime(exam.endTime)}</Text>
                    </Flex>
                    <Flex align="center" gap={2.5} fontSize="sm" color="gray.600">
                      <Icon as={Users} color="gray.400" />
                      <Text>{exam._count?.examSessions ?? 0} session terhubung</Text>
                    </Flex>
                  </Stack>
                </Box>

                <Link href={`/admin/monitoring/${exam.id}`} style={{ width: '100%' }}>
                  <Button w="full" bg="gray.900" color="white" borderRadius="xl">
                    <Text>Lihat Detail Ujian</Text>
                    <ChevronRight size={18} />
                  </Button>
                </Link>
              </Flex>
            </Box>
          ))}

          {filteredExams.length === 0 && (
            <Box gridColumn="1 / -1">
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={16}
                px={6}
                textAlign="center"
                borderRadius="3xl"
                borderWidth="1px"
                borderColor="gray.200"
                bg="white"
              >
                <Box p={4} borderRadius="2xl" bg="gray.50" color="gray.500" mb={4}>
                  <CalendarClock size={28} />
                </Box>
                <Heading size="md" color="gray.800">
                  Tidak ada jadwal mendatang
                </Heading>
                <Text fontSize="sm" color="gray.500" mt={2} maxW="md">
                  {searchQuery || dateFilter
                    ? 'Tidak ada ujian upcoming yang cocok dengan filter saat ini.'
                    : 'Ujian published yang belum masuk jadwal akan muncul di sini.'}
                </Text>
              </Flex>
            </Box>
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
}
