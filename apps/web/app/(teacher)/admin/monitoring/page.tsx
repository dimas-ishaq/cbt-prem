'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Activity,
  ChevronRight,
  Users,
  Calendar,
  Search,
  Clock,
  RefreshCw,
  History,
  CalendarClock,
  Radio,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  HStack,
} from '@chakra-ui/react';

interface Exam {
  id: string;
  title: string;
  subject: { name: string };
  startTime: string;
  endTime: string;
  status: string;
  _count: { examSessions: number };
}

const isOngoingExam = (exam: Exam, now: number) => {
  const start = new Date(exam.startTime).getTime();
  const end = new Date(exam.endTime).getTime();
  return start <= now && now < end;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export default function MonitoringListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data: exams, isLoading, refetch, isFetching } = useQuery<Exam[]>({
    queryKey: ['exams-monitoring-live'],
    queryFn: async () => {
      const res = await api.get('/exams');
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      return list.filter((exam: Exam) => exam.status !== 'DRAFT');
    },
    refetchInterval: 15_000,
  });

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    const now = Date.now();
    return exams
      .filter((exam) => isOngoingExam(exam, now))
      .filter((exam) => !dateFilter || exam.startTime.slice(0, 10) === dateFilter)
      .filter(
        (exam) =>
          !searchQuery ||
          exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          exam.subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime());
  }, [dateFilter, exams, searchQuery]);

  const remaining = (end: string) => {
    const diff = new Date(end).getTime() - Date.now();
    if (diff <= 0) return 'Selesai';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}j ${m}m` : `${m}m`;
  };

  return (
    <Stack gap={8} w="full">
      {/* ─── Hero Header ─── */}
      <Box
        borderRadius="3xl"
        overflow="hidden"
        position="relative"
        bg="bg.surface"
        border="1px solid"
        borderColor="border.default"
        px={{ base: 6, md: 8 }}
        py={{ base: 8, md: 10 }}
        shadow="card-dark"
      >
        {/* Decorative soft orbs */}
        <Box
          position="absolute"
          top="-70px"
          right="-50px"
          w="220px"
          h="220px"
          borderRadius="full"
          bg="brand.subtle"
          opacity={0.35}
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-60px"
          left="30%"
          w="180px"
          h="180px"
          borderRadius="full"
          bg="bg.elevated"
          opacity={0.25}
          pointerEvents="none"
        />
        <Stack gap={6} position="relative">
          <Flex direction={{ base: 'column', lg: 'row' }} justify="space-between" gap={5}>
            <Box maxW="2xl">
              <HStack
                display="inline-flex"
                px={3}
                py={1.5}
                borderRadius="full"
                bg="brand.solid"
                color="text.inverted"
                mb={4}
                gap={1.5}
              >
                <Radio size={12} />
                <Text fontSize="xs" fontWeight="bold" letterSpacing="0.2em" textTransform="uppercase">
                  Live Proctor Feed
                </Text>
              </HStack>

              <Heading as="h1" size="2xl" lineHeight="1.08" letterSpacing="tight" color="text.primary">
                Monitoring Ujian Aktif
              </Heading>
              <Text mt={3} color="text.secondary" maxW="lg" fontSize="sm" lineHeight="tall">
                Halaman ini hanya menampilkan ujian aktif. Riwayat dan jadwal mendatang dipisah agar pengawasan lebih fokus.
              </Text>
            </Box>

            <HStack alignSelf="start" gap={2.5} flexWrap="wrap">
              <Link href="/admin/monitoring/history">
                <Button
                  size="sm"
                  borderRadius="xl"
                  variant="outline"
                  borderColor="border.default"
                  color="text.secondary"
                  bg="bg.surface"
                  _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }}
                  fontWeight="medium"
                >
                  <History size={14} />
                  History
                </Button>
              </Link>
              <Link href="/admin/monitoring/upcoming">
                <Button
                  size="sm"
                  borderRadius="xl"
                  variant="outline"
                  borderColor="border.default"
                  color="text.secondary"
                  bg="bg.surface"
                  _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }}
                  fontWeight="medium"
                >
                  <CalendarClock size={14} />
                  Upcoming
                </Button>
              </Link>
            </HStack>
          </Flex>

          {/* ─── Search / Filter Inset Panel ─── */}
          <Box
            bg="bg.elevated"
            borderRadius="2xl"
            border="1px solid"
            borderColor="border.default"
            p={4}
            shadow="card-dark"
          >
            <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
              <Box position="relative" flex="1">
                <Box
                  position="absolute"
                  left="13px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  color="text.muted"
                  pointerEvents="none"
                >
                  <Search size={16} />
                </Box>
                <Input
                  id="live-monitoring-search"
                  placeholder="Cari ujian atau mata pelajaran…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  pl="38px"
                  bg="input.bg"
                  borderColor="input.border"
                  color="text.primary"
                  _placeholder={{ color: 'text.muted' }}
                  borderRadius="xl"
                  _focus={{ borderColor: 'input.focus.border', bg: 'bg.surface', boxShadow: '0 0 0 3px var(--chakra-colors-brand-subtle)' }}
                />
              </Box>
              <Input
                id="live-monitoring-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                borderRadius="xl"
                bg="input.bg"
                borderColor="input.border"
                color="text.primary"
                w={{ base: 'full', md: '200px' }}
                _focus={{ borderColor: 'input.focus.border', bg: 'bg.surface' }}
              />
              <Button
                id="live-monitoring-refresh"
                onClick={() => refetch()}
                disabled={isFetching}
                borderRadius="xl"
                bg="brand.solid"
                color="text.inverted"
                fontWeight="semibold"
                _hover={{ bg: 'brand.text' }}
                flexShrink={0}
              >
                <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </Flex>
          </Box>
        </Stack>
      </Box>

      {/* ─── Loading ─── */}
      {isLoading && (
        <Flex justify="center" align="center" direction="column" py={20} gap={3}>
          <Spinner size="lg" color="brand.solid" />
          <Text fontSize="sm" color="text.secondary" fontWeight="medium">Memuat data ujian…</Text>
        </Flex>
      )}

      {/* ─── Live count bar ─── */}
      {!isLoading && filteredExams.length > 0 && (
        <Flex align="center" justify="space-between" px={1}>
          <Text fontSize="sm" fontWeight="semibold" color="text.primary">
            {filteredExams.length} ujian sedang berlangsung
          </Text>
          <Flex align="center" gap={1.5}>
            <Box w="7px" h="7px" borderRadius="full" bg="status.success.text" className="animate-pulse" />
            <Text fontSize="xs" color="text.muted" fontWeight="medium">Refresh otomatis tiap 15 detik</Text>
          </Flex>
        </Flex>
      )}

      {/* ─── Cards Grid ─── */}
      {!isLoading && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
          {filteredExams.map((exam) => (
            <Box
              key={exam.id}
              position="relative"
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.default"
              borderRadius="card"
              shadow="card-dark"
              overflow="hidden"
              transition="all 0.2s ease"
              _hover={{
                transform: 'translateY(-2px)',
                shadow: '0 8px 24px rgba(0,0,0,0.15)',
                borderColor: 'brand.solid',
              }}
            >
              {/* Gradient accent top bar */}
              <Box h="4px" bg="dd.brand.gradient" />

              {/* Animated LIVE badge */}
              <Box position="absolute" top="16px" right="12px">
                <Flex
                  align="center"
                  gap={1}
                  px={2}
                  py={0.5}
                  borderRadius="pill"
                  bg="status.success.bg"
                  border="1px solid"
                  borderColor="status.success.text"
                >
                  <Box w="5px" h="5px" borderRadius="full" bg="status.success.text" className="animate-pulse" />
                  <Text fontSize="10px" fontWeight="bold" color="status.success.text" letterSpacing="0.08em">
                    LIVE
                  </Text>
                </Flex>
              </Box>

              <Flex p={4} direction="column" gap={3} h="100%">
                {/* Title & Subject */}
                <Box pr={14}>
                  <Heading size="sm" color="text.primary" lineClamp={2} fontWeight="bold" letterSpacing="tight">
                    {exam.title}
                  </Heading>
                  <Text fontSize="xs" color="brand.text" fontWeight="semibold" mt={1}>
                    {exam.subject.name}
                  </Text>
                </Box>

                {/* Info rows padat */}
                <Stack gap={2} flex="1">
                  <Flex align="center" gap={2}>
                    <Users size={13} color="var(--chakra-colors-text-muted)" />
                    <Text fontSize="xs" color="text.secondary">
                      <Text as="span" fontWeight="semibold" color="text.primary">
                        {exam._count?.examSessions ?? 0}
                      </Text>{' '}
                      peserta terdaftar
                    </Text>
                  </Flex>

                  <Flex align="center" gap={2}>
                    <Calendar size={13} color="var(--chakra-colors-text-muted)" />
                    <Text fontSize="xs" color="text.secondary">
                      {formatDateTime(exam.startTime)}
                    </Text>
                  </Flex>

                  <Flex align="center" gap={2}>
                    <Clock size={13} color="var(--chakra-colors-status-warning-text)" />
                    <Text fontSize="xs" color="status.warning.text" fontWeight="semibold">
                      {remaining(exam.endTime)} tersisa
                    </Text>
                  </Flex>
                </Stack>

                {/* CTA Button */}
                <Link href={`/admin/monitoring/${exam.id}`} style={{ width: '100%' }}>
                  <Button
                    w="full"
                    bg="brand.solid"
                    color="text.inverted"
                    borderRadius="card"
                    fontWeight="semibold"
                    fontSize="sm"
                    _hover={{ bg: 'brand.text' }}
                  >
                    Masuk Proktor
                    <ChevronRight size={16} />
                  </Button>
                </Link>
              </Flex>
            </Box>
          ))}

          {/* ─── Empty State ─── */}
          {filteredExams.length === 0 && (
            <Box gridColumn="1 / -1">
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={16}
                px={6}
                textAlign="center"
                borderRadius="card"
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="border.default"
                bg="bg.surface"
              >
                <Box p={4} borderRadius="2xl" bg="bg.subtle" color="text.muted" mb={4}>
                  <Activity size={28} />
                </Box>
                <Heading size="md" color="text.primary" mb={2}>
                  Tidak ada ujian aktif
                </Heading>
                <Text fontSize="sm" color="text.secondary" maxW="sm">
                  {searchQuery || dateFilter
                    ? 'Tidak ada ujian berlangsung yang cocok dengan filter yang dipilih.'
                    : 'Ujian yang sedang berjalan akan muncul secara otomatis di sini.'}
                </Text>
              </Flex>
            </Box>
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
}