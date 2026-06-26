'use client';

import { use, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  ArrowLeft,
  Search,
  Calendar,
  FileText,
  Clock,
  BookOpen,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Stack,
  Input,
  Spinner,
  Badge,
  HStack,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import Link from 'next/link';

interface Subject {
  name: string;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  subject: Subject;
  _count?: { examSessions: number };
}

interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  exams: Exam[];
}

const statusMap: Record<string, { label: string; colorPalette: string }> = {
  DRAFT: { label: 'Draft', colorPalette: 'gray' },
  ONGOING: { label: 'Berlangsung', colorPalette: 'green' },
  COMPLETED: { label: 'Selesai', colorPalette: 'blue' },
  CANCELLED: { label: 'Dibatalkan', colorPalette: 'red' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusOptions = createListCollection({
  items: [
    { label: 'Semua Status', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Berlangsung', value: 'ONGOING' },
    { label: 'Selesai', value: 'COMPLETED' },
    { label: 'Dibatalkan', value: 'CANCELLED' },
  ],
});

export default function ExamGroupReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const { data: group, isLoading } = useQuery<ExamGroup>({
    queryKey: ['exam-group-report', id],
    queryFn: async () => {
      const res = await api.get(`/exam-groups/${id}`);
      return res.data;
    },
  });

  const filteredExams = useMemo(() => {
    if (!group?.exams) return [];
    return group.exams.filter((exam) => {
      const matchSearch =
        exam.title.toLowerCase().includes(search.toLowerCase()) ||
        (exam.subject?.name || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = !filterStatus || exam.status === filterStatus;

      const examDate = new Date(exam.startTime);
      const matchFrom = !filterDateFrom || examDate >= new Date(filterDateFrom);
      const matchTo = !filterDateTo || examDate <= new Date(filterDateTo + 'T23:59:59');

      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  }, [group, search, filterStatus, filterDateFrom, filterDateTo]);

  const hasFilters = search || filterStatus || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">
          Memuat data laporan...
        </Text>
      </Flex>
    );
  }

  if (!group) {
    return (
      <Flex justify="center" minH="40vh" align="center">
        <Box
          p={4}
          bg="red.50"
          color="red.700"
          borderRadius="xl"
          w="full"
          textAlign="center"
          fontWeight="semibold"
        >
          Event ujian tidak ditemukan.
        </Box>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      {/* Header */}
      <Box>
        <Link href="/admin/reports">
          <Button
            variant="ghost"
            size="sm"
            color="gray.500"
            _hover={{ color: 'gray.800' }}
            mb={3}
            cursor="pointer"
            px={0}
          >
            <ArrowLeft size={15} />
            Kembali ke Laporan
          </Button>
        </Link>
        <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="xl" fontWeight="black" color="gray.900" letterSpacing="tight">
              {group.name}
            </Heading>
            <HStack mt={1} gap={3} flexWrap="wrap">
              {group.academicYear && (
                <Text color="gray.500" fontSize="sm">
                  Tahun Ajaran: <strong>{group.academicYear}</strong>
                </Text>
              )}
              {group.semester && (
                <Text color="gray.500" fontSize="sm">
                  Semester: <strong>{group.semester}</strong>
                </Text>
              )}
              {group.startDate && (
                <Text color="gray.500" fontSize="sm">
                  {formatDate(group.startDate)}
                  {group.endDate ? ` — ${formatDate(group.endDate)}` : ''}
                </Text>
              )}
            </HStack>
            {group.description && (
              <Text color="gray.500" mt={1} fontSize="sm">
                {group.description}
              </Text>
            )}
          </Box>
          <Badge
            colorPalette="indigo"
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="full"
            fontWeight="bold"
          >
            {group.exams.length} Ujian
          </Badge>
        </Flex>
      </Box>

      {/* Filter & Search Bar */}
      <Box bg="white" p={5} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Flex align="center" gap={2} mb={4}>
          <Filter size={15} color="var(--chakra-colors-gray-500)" />
          <Text fontWeight="semibold" color="gray.700" fontSize="sm">
            Filter &amp; Pencarian
          </Text>
          {hasFilters && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              cursor="pointer"
              onClick={clearFilters}
              ml="auto"
            >
              <X size={12} />
              Hapus Filter
            </Button>
          )}
        </Flex>
        <Flex gap={3} flexWrap="wrap">
          {/* Search */}
          <Flex
            align="center"
            bg="gray.50"
            borderRadius="xl"
            px={3}
            gap={2}
            flex="1"
            minW="200px"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Search size={14} color="var(--chakra-colors-gray-400)" />
            <Input
              placeholder="Cari nama ujian atau mata pelajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              border="none"
              bg="transparent"
              _focus={{ outline: 'none', boxShadow: 'none' }}
              fontSize="sm"
              size="sm"
            />
          </Flex>

          {/* Status Filter */}
          <Select.Root
            collection={statusOptions}
            value={[filterStatus]}
            onValueChange={(v) => setFilterStatus(v.value[0] || '')}
            size="sm"
            minW="160px"
          >
            <Select.Trigger
              bg="gray.50"
              borderRadius="xl"
              borderColor="gray.200"
              cursor="pointer"
            >
              <Select.ValueText placeholder="Semua Status" />
            </Select.Trigger>
            <Select.Content>
              {statusOptions.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          {/* Date From */}
          <Flex
            align="center"
            bg="gray.50"
            borderRadius="xl"
            px={3}
            gap={2}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Calendar size={14} color="var(--chakra-colors-gray-400)" />
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              border="none"
              bg="transparent"
              _focus={{ outline: 'none', boxShadow: 'none' }}
              fontSize="sm"
              size="sm"
              placeholder="Dari tanggal"
              minW="140px"
            />
          </Flex>

          {/* Date To */}
          <Flex
            align="center"
            bg="gray.50"
            borderRadius="xl"
            px={3}
            gap={2}
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Calendar size={14} color="var(--chakra-colors-gray-400)" />
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              border="none"
              bg="transparent"
              _focus={{ outline: 'none', boxShadow: 'none' }}
              fontSize="sm"
              size="sm"
              placeholder="Sampai tanggal"
              minW="140px"
            />
          </Flex>
        </Flex>
      </Box>

      {/* Exams Table */}
      <Box bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Flex align="center" justify="space-between" mb={4}>
          <Heading size="md" fontWeight="bold" color="gray.800">
            Daftar Ujian
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Menampilkan <strong>{filteredExams.length}</strong> dari{' '}
            <strong>{group.exams.length}</strong> ujian
          </Text>
        </Flex>

        {filteredExams.length === 0 ? (
          <Flex direction="column" align="center" justify="center" py={12} gap={3}>
            <FileText size={36} color="var(--chakra-colors-gray-300)" />
            <Text color="gray.400" fontWeight="medium">
              {hasFilters
                ? 'Tidak ada ujian yang cocok dengan filter.'
                : 'Belum ada ujian dalam event ini.'}
            </Text>
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                colorPalette="indigo"
                cursor="pointer"
                onClick={clearFilters}
              >
                Hapus filter
              </Button>
            )}
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table.Root variant="outline" size="sm">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    #
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    Nama Ujian
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    Mata Pelajaran
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    Tanggal Ujian
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    Waktu
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    Durasi
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>
                    Status
                  </Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3} textAlign="right">
                    Aksi
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredExams.map((exam, idx) => {
                  const statusInfo = statusMap[exam.status] ?? {
                    label: exam.status,
                    colorPalette: 'gray',
                  };
                  return (
                    <Table.Row key={exam.id} _hover={{ bg: 'gray.50' }}>
                      <Table.Cell py={3.5} color="gray.400" fontSize="xs" fontWeight="medium">
                        {idx + 1}
                      </Table.Cell>
                      <Table.Cell py={3.5}>
                        <Text fontWeight="semibold" color="gray.900" fontSize="sm">
                          {exam.title}
                        </Text>
                        {exam.description && (
                          <Text fontSize="xs" color="gray.400" mt={0.5}>
                            {exam.description}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell py={3.5}>
                        <Flex align="center" gap={1.5}>
                          <BookOpen size={13} color="var(--chakra-colors-indigo-500)" />
                          <Text fontSize="sm" color="gray.700">
                            {exam.subject?.name || '-'}
                          </Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell py={3.5}>
                        <Flex align="center" gap={1.5}>
                          <Calendar size={13} color="var(--chakra-colors-gray-400)" />
                          <Text fontSize="sm" color="gray.700">
                            {formatDate(exam.startTime)}
                          </Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell py={3.5}>
                        <Text fontSize="sm" color="gray.600">
                          {formatTime(exam.startTime)} — {formatTime(exam.endTime)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3.5}>
                        <Flex align="center" gap={1.5}>
                          <Clock size={13} color="var(--chakra-colors-gray-400)" />
                          <Text fontSize="sm" color="gray.600">
                            {exam.duration} menit
                          </Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell py={3.5}>
                        <Badge
                          colorPalette={statusInfo.colorPalette}
                          borderRadius="full"
                          px={2.5}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="semibold"
                        >
                          {statusInfo.label}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell py={3.5} textAlign="right">
                        <Link href={`/admin/results/${exam.id}`}>
                          <Button
                            size="xs"
                            colorPalette="indigo"
                            variant="subtle"
                            borderRadius="lg"
                            fontWeight="semibold"
                            cursor="pointer"
                          >
                            Lihat Hasil
                            <ChevronRight size={12} />
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
