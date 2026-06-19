'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Activity, ChevronRight, Users, Calendar, Search, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Select,
  SimpleGrid,
  Badge,
  Spinner,
  Stack,
  HStack,
  Icon,
  createListCollection,
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

export default function MonitoringListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'PUBLISHED'>('ALL');

  const statusOptions = createListCollection({
    items: [
      { label: 'Semua Status', value: 'ALL' },
      { label: 'Sedang Berlangsung', value: 'ONGOING' },
      { label: 'Terpublikasi', value: 'PUBLISHED' },
    ],
  });

  const { data: exams, isLoading, refetch, isFetching } = useQuery<Exam[]>({
    queryKey: ['exams-monitoring'],
    queryFn: async () => {
      const res = await api.get('/exams');
      return res.data.filter((e: any) => e.status !== 'DRAFT');
    },
    refetchInterval: 15_000,
  });

  const filteredExams = useMemo(() => {
    if (!exams) return [];
    return exams
      .filter((e) => statusFilter === 'ALL' || e.status === statusFilter)
      .filter((e) =>
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [exams, searchQuery, statusFilter]);

  const remaining = (end: string) => {
    const diff = new Date(end).getTime() - Date.now();
    if (diff <= 0) return 'Selesai';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return h > 0 ? `${h}j ${m}m` : `${m}m`;
  };

  return (
    <Stack gap={8} w="full">
      {/* ─── Header ─── */}
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ sm: 'center' }} justify="space-between" gap={4}>
        <Box>
          <Heading size="xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
            Live Monitoring
          </Heading>
          <Text mt={1} color="gray.500">
            Pantau progres siswa secara <Box as="span" fontWeight="semibold" color="indigo.600">real‑time</Box>
          </Text>
        </Box>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          colorPalette="gray"
          size="sm"
          borderRadius="xl"
          fontWeight="medium"
          shadow="xs"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </Flex>

      {/* ─── Search & Filter ─── */}
      <Flex direction={{ base: 'column', sm: 'row' }} gap={4}>
        <Box position="relative" flex="1">
          <Box position="absolute" left="14px" top="50%" transform="translateY(-50%)" zIndex={2} color="gray.400">
            <Search size={18} />
          </Box>
          <Input
            placeholder="Cari ujian atau mata pelajaran…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pl="40px"
            bg="white"
            borderRadius="xl"
            borderColor="gray.200"
            _focus={{ borderColor: 'indigo.500', ring: 1, ringColor: 'indigo.500' }}
          />
        </Box>
        <Box minW="200px">
          <Select.Root
            collection={statusOptions}
            value={statusFilter !== 'ALL' ? [statusFilter] : []}
            onValueChange={(details) => setStatusFilter((details.value[0] || 'ALL') as 'ALL' | 'ONGOING' | 'PUBLISHED')}
            positioning={{ sameWidth: true }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger borderRadius="xl">
                <Select.ValueText placeholder="Semua Status" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
                <Select.ClearTrigger />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {statusOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Box>
      </Flex>

      {/* ─── Loading Skeletons ─── */}
      {isLoading && (
        <Flex justify="center" py={20}>
          <Spinner size="xl" color="indigo.500" />
        </Flex>
      )}

      {/* ─── Exam Grid ─── */}
      {!isLoading && (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={6}>
          {filteredExams.map((exam) => {
            const ongoing = exam.status === 'ONGOING';
            return (
              <Box
                key={exam.id}
                role="group"
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                shadow="sm"
                transition="all 0.3s"
                _hover={{ shadow: 'lg', borderColor: 'indigo.500' }}
                display="flex"
                flexDirection="column"
              >
                <Box p={6} display="flex" flexDirection="column" h="full">
                  {/* Top row */}
                  <Flex align="start" justify="space-between" mb={4}>
                    <Flex
                      p={3}
                      borderRadius="xl"
                      bg={ongoing ? 'green.50' : 'indigo.50'}
                      color={ongoing ? 'green.600' : 'indigo.600'}
                    >
                      <Activity size={22} className={ongoing ? 'animate-pulse' : ''} />
                    </Flex>
                    <Badge
                      colorPalette={ongoing ? 'green' : 'blue'}
                      size="sm"
                      px={2}
                      py={1}
                      borderRadius="full"
                    >
                      {ongoing ? 'BERLANGSUNG' : 'TERSEDIA'}
                    </Badge>
                  </Flex>

                  {/* Content */}
                  <Heading
                    size="md"
                    color="gray.800"
                    _groupHover={{ color: 'indigo.600' }}
                    transition="colors"
                    lineClamp={2}
                  >
                    {exam.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {exam.subject.name}
                  </Text>

                  <Stack mt={5} gap={2} flex="1">
                    <Flex align="center" gap={2} fontSize="sm" color="gray.600">
                      <Icon as={Users} color="gray.400" />
                      <Text>{exam._count?.examSessions ?? 0} siswa terdaftar</Text>
                    </Flex>
                    <Flex align="center" gap={2} fontSize="sm" color="gray.600">
                      <Icon as={Calendar} color="gray.400" />
                      <Text>{new Date(exam.startTime).toLocaleString('id-ID')}</Text>
                    </Flex>
                    {ongoing && (
                      <Flex align="center" gap={2} fontSize="sm" fontWeight="medium" color="amber.600">
                        <Icon as={Clock} />
                        <Text>{remaining(exam.endTime)} lagi</Text>
                      </Flex>
                    )}
                  </Stack>

                  {/* Action */}
                  <Link href={`/admin/monitoring/${exam.id}`} style={{ width: '100%' }}>
                    <Button
                      mt={5}
                      w="full"
                      bg="gray.900"
                      color="white"
                      borderRadius="xl"
                      _hover={{ bg: 'indigo.600' }}
                      transition="colors"
                      className="group/btn"
                    >
                      <Text>Masuk Proktor</Text>
                      <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </Box>
              </Box>
            );
          })}

          {/* ─── Empty State ─── */}
          {filteredExams.length === 0 && (
            <Box gridColumn="1 / -1">
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={20}
                bg="gray.50"
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="2xl"
              >
                <Activity size={56} className="text-gray-400 mb-5" />
                <Heading size="lg" color="gray.800">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Tidak ada hasil yang sesuai'
                    : 'Belum ada ujian aktif'}
                </Heading>
                <Text fontSize="sm" color="gray.500" mt={2} maxW="xs" textAlign="center">
                  {searchQuery || statusFilter !== 'ALL'
                    ? 'Coba ubah kata kunci atau filter status untuk mendapatkan hasil yang berbeda.'
                    : 'Ujian yang siap dimonitor akan muncul di sini setelah dipublikasikan.'}
                </Text>
              </Flex>
            </Box>
          )}
        </SimpleGrid>
      )}
    </Stack>
  );
}