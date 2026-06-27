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
        bg="linear-gradient(135deg, #eef2ff 0%, #e0f2fe 55%, #ecfdf5 100%)"
        border="1px solid"
        borderColor="indigo.100"
        px={{ base: 6, md: 8 }}
        py={{ base: 8, md: 10 }}
      >
        {/* Decorative soft orbs */}
        <Box
          position="absolute"
          top="-70px"
          right="-50px"
          w="220px"
          h="220px"
          borderRadius="full"
          bg="indigo.200"
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
          bg="cyan.200"
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
                bg="indigo.600"
                color="white"
                mb={4}
                gap={1.5}
              >
                <Radio size={12} />
                <Text fontSize="xs" fontWeight="bold" letterSpacing="0.2em" textTransform="uppercase">
                  Live Proctor Feed
                </Text>
              </HStack>

              <Heading as="h1" size="2xl" lineHeight="1.08" letterSpacing="tight" color="gray.900">
                Monitoring Ujian Aktif
              </Heading>
              <Text mt={3} color="gray.500" maxW="lg" fontSize="sm" lineHeight="tall">
                Halaman ini hanya menampilkan ujian aktif. Riwayat dan jadwal mendatang dipisah agar pengawasan lebih fokus.
              </Text>
            </Box>

            <HStack alignSelf="start" gap={2.5} flexWrap="wrap">
              <Link href="/admin/monitoring/history">
                <Button
                  size="sm"
                  borderRadius="xl"
                  variant="outline"
                  borderColor="gray.300"
                  color="gray.700"
                  bg="white"
                  _hover={{ bg: 'gray.50', borderColor: 'indigo.400', color: 'indigo.700' }}
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
                  borderColor="gray.300"
                  color="gray.700"
                  bg="white"
                  _hover={{ bg: 'gray.50', borderColor: 'indigo.400', color: 'indigo.700' }}
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
            bg="white"
            borderRadius="2xl"
            border="1px solid"
            borderColor="gray.200"
            p={4}
            boxShadow="0 2px 16px rgba(15,23,42,0.06)"
          >
            <Flex direction={{ base: 'column', md: 'row' }} gap={3}>
              <Box position="relative" flex="1">
                <Box
                  position="absolute"
                  left="13px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  color="gray.400"
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
                  bg="gray.50"
                  borderColor="gray.200"
                  color="gray.800"
                  _placeholder={{ color: 'gray.400' }}
                  borderRadius="xl"
                  _focus={{ borderColor: 'indigo.400', bg: 'white', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' }}
                />
              </Box>
              <Input
                id="live-monitoring-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                borderRadius="xl"
                bg="gray.50"
                borderColor="gray.200"
                color="gray.700"
                w={{ base: 'full', md: '200px' }}
                _focus={{ borderColor: 'indigo.400', bg: 'white' }}
              />
              <Button
                id="live-monitoring-refresh"
                onClick={() => refetch()}
                disabled={isFetching}
                borderRadius="xl"
                bg="indigo.600"
                color="white"
                fontWeight="semibold"
                _hover={{ bg: 'indigo.700' }}
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
          <Spinner size="lg" color="indigo.500" />
          <Text fontSize="sm" color="gray.400" fontWeight="medium">Memuat data ujian…</Text>
        </Flex>
      )}

      {/* ─── Live count bar ─── */}
      {!isLoading && filteredExams.length > 0 && (
        <Flex align="center" justify="space-between" px={1}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            {filteredExams.length} ujian sedang berlangsung
          </Text>
          <Flex align="center" gap={1.5}>
            <Box w="7px" h="7px" borderRadius="full" bg="green.500" className="animate-pulse" />
            <Text fontSize="xs" color="gray.400" fontWeight="medium">Refresh otomatis tiap 15 detik</Text>
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
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="2xl"
              boxShadow="0 2px 16px rgba(15,23,42,0.05)"
              overflow="hidden"
              transition="all 0.25s cubic-bezier(0.4,0,0.2,1)"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: '0 24px 60px rgba(99,102,241,0.12), 0 4px 16px rgba(15,23,42,0.07)',
                borderColor: 'indigo.200',
              }}
            >
              {/* Gradient accent top bar */}
              <Box h="4px" bg="linear-gradient(90deg, #22c55e 0%, #06b6d4 50%, #6366f1 100%)" />

              {/* Animated LIVE badge */}
              <Box position="absolute" top="20px" right="16px">
                <Flex
                  align="center"
                  gap={1.5}
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.200"
                >
                  <Box w="6px" h="6px" borderRadius="full" bg="green.500" className="animate-pulse" />
                  <Text fontSize="10px" fontWeight="bold" color="green.700" letterSpacing="0.08em">
                    LIVE
                  </Text>
                </Flex>
              </Box>

              <Flex p={5} direction="column" gap={4} h="100%">
                {/* Status icon */}
                <Flex
                  w={10}
                  h={10}
                  borderRadius="xl"
                  bg="green.50"
                  border="1px solid"
                  borderColor="green.100"
                  align="center"
                  justify="center"
                >
                  <Activity size={20} color="#16a34a" className="animate-pulse" />
                </Flex>

                {/* Title & Subject */}
                <Box pr={14}>
                  <Heading size="sm" color="gray.900" lineClamp={2} fontWeight="bold" letterSpacing="tight">
                    {exam.title}
                  </Heading>
                  <Text fontSize="xs" color="indigo.600" fontWeight="semibold" mt={1}>
                    {exam.subject.name}
                  </Text>
                </Box>

                {/* Divider */}
                <Box h="1px" bg="gray.100" />

                {/* Info rows with icon boxes */}
                <Stack gap={2.5} flex="1">
                  <Flex align="center" gap={2.5}>
                    <Flex
                      w="24px"
                      h="24px"
                      borderRadius="md"
                      bg="gray.100"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Users size={12} color="#6b7280" />
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                      <Text as="span" fontWeight="semibold" color="gray.800">
                        {exam._count?.examSessions ?? 0}
                      </Text>{' '}
                      peserta terdaftar
                    </Text>
                  </Flex>

                  <Flex align="center" gap={2.5}>
                    <Flex
                      w="24px"
                      h="24px"
                      borderRadius="md"
                      bg="gray.100"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Calendar size={12} color="#6b7280" />
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                      {formatDateTime(exam.startTime)}
                    </Text>
                  </Flex>

                  <Flex align="center" gap={2.5}>
                    <Flex
                      w="24px"
                      h="24px"
                      borderRadius="md"
                      bg="orange.50"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Clock size={12} color="#d97706" />
                    </Flex>
                    <Text fontSize="xs" color="orange.600" fontWeight="semibold">
                      {remaining(exam.endTime)} tersisa
                    </Text>
                  </Flex>
                </Stack>

                {/* CTA Button */}
                <Link href={`/admin/monitoring/${exam.id}`} style={{ width: '100%' }}>
                  <Button
                    w="full"
                    bg="gray.900"
                    color="white"
                    borderRadius="xl"
                    fontWeight="semibold"
                    fontSize="sm"
                    _hover={{ bg: 'indigo.700' }}
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
                py={20}
                px={6}
                textAlign="center"
                borderRadius="3xl"
                borderWidth="1.5px"
                borderStyle="dashed"
                borderColor="gray.200"
                bg="white"
              >
                <Flex
                  w={16}
                  h={16}
                  borderRadius="2xl"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <Activity size={28} color="#d1d5db" />
                </Flex>
                <Heading size="md" color="gray.700" mb={2}>
                  Tidak ada ujian aktif
                </Heading>
                <Text fontSize="sm" color="gray.400" maxW="sm">
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