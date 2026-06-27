'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  Clock3,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
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
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';

interface MonitoringSession {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  answers: Array<{ id: string }>;
  violations: Array<{ id: string; type: string; description: string; timestamp: string }>;
  student: {
    user?: {
      fullName?: string | null;
      username?: string | null;
    } | null;
    rombel?: {
      name?: string | null;
    } | null;
  };
  exam: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    subject?: {
      name?: string | null;
    } | null;
  };
}

interface HistoryGroup {
  examId: string;
  title: string;
  subjectName: string;
  examStartTime: string;
  examEndTime: string;
  sessions: MonitoringSession[];
  violationCount: number;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function MonitoringHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery<MonitoringSession[]>({
    queryKey: ['monitoring-history'],
    queryFn: async () => {
      const response = await api.get('/exam-sessions/monitoring/history');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
    refetchInterval: 60_000,
  });

  const groupedHistory = useMemo(() => {
    const sessions = Array.isArray(data) ? data : [];
    const grouped = new Map<string, HistoryGroup>();

    sessions.forEach((session) => {
      const exam = session.exam;
      if (!exam) return;

      const current = grouped.get(exam.id);
      if (!current) {
        grouped.set(exam.id, {
          examId: exam.id,
          title: exam.title,
          subjectName: exam.subject?.name || 'Tanpa mata pelajaran',
          examStartTime: exam.startTime,
          examEndTime: exam.endTime,
          sessions: [session],
          violationCount: session.violations?.length || 0,
        });
        return;
      }

      current.sessions.push(session);
      current.violationCount += session.violations?.length || 0;
    });

    return Array.from(grouped.values())
      .filter((group) => !dateFilter || group.examStartTime.slice(0, 10) === dateFilter)
      .filter((group) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          group.title.toLowerCase().includes(q) ||
          group.subjectName.toLowerCase().includes(q) ||
          group.sessions.some((session) => {
            const fullName = session.student?.user?.fullName?.toLowerCase() || '';
            const username = session.student?.user?.username?.toLowerCase() || '';
            return fullName.includes(q) || username.includes(q);
          })
        );
      })
      .sort((a, b) => new Date(b.examEndTime).getTime() - new Date(a.examEndTime).getTime());
  }, [data, dateFilter, searchQuery]);

  return (
    <Stack gap={8} w="full">
      <Box
        borderRadius="3xl"
        overflow="hidden"
        bg="linear-gradient(135deg, rgba(15,23,42,0.98), rgba(127,29,29,0.96) 52%, rgba(194,65,12,0.92))"
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
                History monitoring per mapel ujian
              </Heading>
              <Text mt={3} color="whiteAlpha.820" maxW="2xl" fontSize="sm">
                Setiap grup menampilkan mapel dan ujian, lalu di dalamnya ada session siswa sebelumnya beserta pelanggaran yang pernah terjadi.
              </Text>
            </Box>

            <HStack alignSelf="start" gap={3} flexWrap="wrap">
              <Link href="/admin/monitoring/upcoming">
                <Button size="sm" borderRadius="xl" bg="whiteAlpha.170" color="white" _hover={{ bg: 'whiteAlpha.240' }}>
                  <CalendarClock size={16} />
                  Upcoming
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
                id="history-monitoring-search"
                placeholder="Cari ujian, mapel, atau siswa�"
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
              id="history-monitoring-date"
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
              id="history-monitoring-refresh"
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
        <Stack gap={6}>
          {groupedHistory.map((group) => (
            <Box
              key={group.examId}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="3xl"
              boxShadow="0 18px 48px rgba(15, 23, 42, 0.08)"
              overflow="hidden"
            >
              <Box h="6px" bg="linear-gradient(90deg, #f97316, #ef4444)" />
              <Stack gap={5} p={{ base: 5, md: 6 }}>
                <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" gap={4}>
                  <Box>
                    <HStack gap={2} mb={2} flexWrap="wrap">
                      <Badge colorPalette="orange" borderRadius="full" px={3} py={1}>
                        {group.subjectName}
                      </Badge>
                      <Badge colorPalette="red" variant="subtle" borderRadius="full" px={3} py={1}>
                        {group.violationCount} pelanggaran
                      </Badge>
                      <Badge colorPalette="gray" variant="subtle" borderRadius="full" px={3} py={1}>
                        {group.sessions.length} session
                      </Badge>
                    </HStack>
                    <Heading size="lg" color="gray.800">
                      {group.title}
                    </Heading>
                    <HStack mt={2} gap={4} flexWrap="wrap" color="gray.500">
                      <HStack gap={2}>
                        <Icon as={Clock3} color="gray.400" />
                        <Text fontSize="sm">Mulai {formatDateTime(group.examStartTime)}</Text>
                      </HStack>
                      <HStack gap={2}>
                        <Icon as={CalendarClock} color="gray.400" />
                        <Text fontSize="sm">Selesai {formatDateTime(group.examEndTime)}</Text>
                      </HStack>
                    </HStack>
                  </Box>

                  <Link href={`/admin/monitoring/${group.examId}`}>
                    <Button borderRadius="xl" bg="gray.900" color="white">
                      Buka Detail Monitoring
                    </Button>
                  </Link>
                </Flex>

                <Stack gap={3}>
                  {group.sessions.map((session) => (
                    <Box
                      key={session.id}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="2xl"
                      p={4}
                      bg="gray.50"
                    >
                      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
                        <Stack gap={2}>
                          <HStack gap={2}>
                            <Icon as={UserRound} color="gray.500" />
                            <Text fontWeight="semibold" color="gray.800">
                              {session.student?.user?.fullName || session.student?.user?.username || 'Siswa'}
                            </Text>
                            <Badge colorPalette={session.status === 'LOCKED' ? 'red' : 'green'} borderRadius="full">
                              {session.status}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.500">
                            {session.student?.rombel?.name || 'Tanpa rombel'} � {session.student?.user?.username || '-'}
                          </Text>
                          <HStack gap={4} flexWrap="wrap" color="gray.600">
                            <Text fontSize="sm">Mulai: {formatDateTime(session.startTime)}</Text>
                            <Text fontSize="sm">Selesai: {formatDateTime(session.endTime)}</Text>
                            <Text fontSize="sm">Jawaban: {session.answers?.length || 0}</Text>
                          </HStack>
                        </Stack>

                        <Stack gap={2} minW={{ md: '260px' }}>
                          <HStack gap={2} color="orange.600">
                            <Icon as={ShieldAlert} />
                            <Text fontSize="sm" fontWeight="semibold">
                              {session.violations?.length || 0} pelanggaran tercatat
                            </Text>
                          </HStack>
                          {session.violations?.length ? (
                            session.violations.slice(0, 3).map((violation) => (
                              <Box key={violation.id} borderRadius="xl" bg="white" borderWidth="1px" borderColor="orange.100" p={3}>
                                <HStack justify="space-between" align="start" gap={3}>
                                  <HStack align="start" gap={2}>
                                    <Icon as={AlertTriangle} color="orange.500" mt={0.5} />
                                    <Stack gap={0.5}>
                                      <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                                        {violation.type}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {violation.description || 'Pelanggaran terdeteksi saat ujian berlangsung.'}
                                      </Text>
                                    </Stack>
                                  </HStack>
                                  <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                                    {formatDateTime(violation.timestamp)}
                                  </Text>
                                </HStack>
                              </Box>
                            ))
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              Tidak ada pelanggaran pada session ini.
                            </Text>
                          )}
                        </Stack>
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Box>
          ))}

          {groupedHistory.length === 0 && (
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
                Belum ada history monitoring
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={2} maxW="md">
                {searchQuery || dateFilter
                  ? 'Tidak ada riwayat monitoring yang cocok dengan filter saat ini.'
                  : 'Riwayat ujian selesai akan muncul di sini setelah session siswa terekam.'}
              </Text>
            </Flex>
          )}
        </Stack>
      )}
    </Stack>
  );
}
