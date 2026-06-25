
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useMemo, useState, useEffect } from 'react';
import { ChevronLeft, User, Award, Clock, FileText, FileDown, BarChart3, RotateCcw, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Stack,
  Table,
  HStack,
  Spinner,
  ButtonGroup,
  Checkbox,
  Dialog,
  Portal,
  Input,
  createListCollection,
  Select,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { TablePagination } from '@/components/ui/pagination';

interface Student {
  user: {
    fullName: string;
    username: string;
  };
}

interface ExamRombelTarget {
  rombelId: string;
  rombel?: {
    id: string;
    name: string;
  };
}

interface ExamSession {
  id: string;
  student: {
    user: {
      fullName: string;
      username: string;
    };
    nisn: string;
    rombelId?: string | null;
    rombel?: {
      id: string;
      name: string;
    } | null;
  };
  startTime: string;
  endTime: string;
  score: number | null;
  status: string;
  answers: any[];
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isBulkResetModalOpen, setIsBulkResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');

  const { data: exam } = useQuery<any>({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}`);
      return response.data;
    },
  });

  const { data: sessions, isLoading, refetch, isRefetching } = useQuery<ExamSession[]>({
    queryKey: ['exam-sessions', id],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${id}`);
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const bulkResetMutation = useMutation({
    mutationFn: async (sessionIds: string[]) => {
      return api.post(`/exam-sessions/bulk-reset`, { ids: sessionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-sessions', id] });
      setSelectedSessionIds([]);
      setIsBulkResetModalOpen(false);
      setResetConfirmationInput('');
      toast.success('Pengerjaan ujian siswa yang dipilih berhasil direset');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mereset pengerjaan ujian');
    },
  });

  const [filterRombelId, setFilterRombelId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRombelId, filterStatus]);

  const assignedRombels = useMemo(() => {
    const targets: ExamRombelTarget[] = Array.isArray(exam?.targetRombels)
      ? exam.targetRombels
      : [];
    return targets
      .map((target) => target.rombel || null)
      .filter((rombel): rombel is { id: string; name: string } => Boolean(rombel));
  }, [exam]);

  const rombelCollection = useMemo(() => {
    return createListCollection({
      items: [
        { label: 'Semua Rombel', value: 'ALL' },
        ...assignedRombels.map((r) => ({ label: r.name, value: r.id })),
      ],
    });
  }, [assignedRombels]);

  const statusCollection = useMemo(() => {
    return createListCollection({
      items: [
        { label: 'Semua Status', value: 'ALL' },
        { label: 'Sedang Mengerjakan', value: 'IN_PROGRESS' },
        { label: 'Selesai', value: 'SUBMITTED' },
      ],
    });
  }, []);

  const filteredSessions = useMemo(() => {
    let list = Array.isArray(sessions) ? sessions : [];

    // Filter by Rombel
    if (filterRombelId) {
      list = list.filter((session) => session.student?.rombelId === filterRombelId);
    }

    // Filter by Status
    if (filterStatus && filterStatus !== 'ALL') {
      if (filterStatus === 'IN_PROGRESS') {
        list = list.filter(
          (session) => session.status === 'IN_PROGRESS' || session.status === 'ONGOING'
        );
      } else if (filterStatus === 'SUBMITTED') {
        list = list.filter(
          (session) => session.status === 'SUBMITTED' || session.status === 'FINISHED'
        );
      }
    }

    // Filter by Search Query (min 3 chars)
    const query = searchQuery.trim().toLowerCase();
    if (query.length >= 3) {
      list = list.filter(
        (session) =>
          session.student?.user?.fullName?.toLowerCase().includes(query) ||
          session.student?.user?.username?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [sessions, filterRombelId, filterStatus, searchQuery]);

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${id}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results-${exam?.title || id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh">
        <Spinner size="lg" color="indigo.600" />
        <Text color="gray.600" mt={3} fontWeight="semibold">Loading results...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
        <Flex align="center" gap={4}>
          <Link href="/admin/exams" passHref>
            <Button variant="ghost" p={2} borderRadius="full" cursor="pointer">
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <Box>
            <Heading size="lg" fontWeight="bold" color="gray.900">
              Hasil Ujian: {exam?.title}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {exam?.subject.name} • {filteredSessions.length} Lembar Jawaban
            </Text>
          </Box>
        </Flex>
        <HStack gap={3}>
          <Link href={`/admin/results/${id}/essay-grading`} passHref>
            <Button
              variant="outline"
              colorPalette="orange"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              px={4}
              py={5}
              cursor="pointer"
            >
              <FileText size={20} />
              <Text>Koreksi Essay</Text>
            </Button>
          </Link>
          <Link href={`/admin/results/${id}/analytics`} passHref>
            <Button
              variant="outline"
              colorPalette="indigo"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              px={4}
              py={5}
              cursor="pointer"
            >
              <BarChart3 size={20} />
              <Text>Analisis Grafik</Text>
            </Button>
          </Link>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            colorPalette="green"
            borderRadius="xl"
            fontWeight="bold"
            fontSize="sm"
            px={4}
            py={5}
            cursor="pointer"
          >
            <FileDown size={20} />
            <Text>{exportMutation.isPending ? 'Mengekspor...' : 'Ekspor Excel'}</Text>
          </Button>
        </HStack>
      </Flex>

      {/* Advanced Filters Panel */}
      <Box bg="white" p={5} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'end' }}>
          
          {/* Search Box */}
          <Stack gap={1.5} flex={2}>
            <Text fontSize="xs" fontWeight="bold" color="gray.600">Cari Siswa</Text>
            <Input
              placeholder="Cari nama atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              borderRadius="lg"
            />
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <Text fontSize="10px" color="amber.600" fontWeight="bold">
                Ketik minimal 3 karakter untuk memfilter
              </Text>
            )}
          </Stack>

          {/* Rombel Select */}
          <Stack gap={1.5} flex={1.5}>
            <Text fontSize="xs" fontWeight="bold" color="gray.600">Rombel</Text>
            <Select.Root
              collection={rombelCollection}
              value={filterRombelId ? [filterRombelId] : ['ALL']}
              onValueChange={(details) => {
                const val = details.value[0];
                setFilterRombelId(val === 'ALL' ? '' : (val ?? ''));
              }}
              size="sm"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Semua Rombel" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {rombelCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Stack>

          {/* Status Select */}
          <Stack gap={1.5} flex={1.5}>
            <Text fontSize="xs" fontWeight="bold" color="gray.600">Status Pengerjaan</Text>
            <Select.Root
              collection={statusCollection}
              value={[filterStatus]}
              onValueChange={(details) => {
                setFilterStatus(details.value[0] ?? 'ALL');
              }}
              size="sm"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Semua Status" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {statusCollection.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Stack>

          {/* Action Buttons: Sync */}
          <Flex gap={2} justify="end" align="center">
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              size="sm"
              variant="outline"
              borderRadius="lg"
              fontWeight="bold"
              borderColor="gray.200"
              color="gray.700"
              _hover={{ bg: 'gray.50' }}
              cursor="pointer"
              h="32px"
              gap={2}
            >
              <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
              Sinkronkan
            </Button>
          </Flex>

        </Flex>
      </Box>

      {selectedSessionIds.length > 0 && (
        <Flex
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          p={4}
          borderRadius="2xl"
          align="center"
          justify="space-between"
          className="animate-bounce-in"
        >
          <HStack gap={3}>
            <Text fontSize="sm" fontWeight="bold" color="red.700">
              {selectedSessionIds.length} siswa terpilih
            </Text>
          </HStack>
          <Button
            size="sm"
            colorPalette="red"
            onClick={() => {
              setResetConfirmationInput('');
              setIsBulkResetModalOpen(true);
            }}
            borderRadius="xl"
            fontWeight="bold"
            cursor="pointer"
          >
            <RotateCcw size={16} />
            Reset Pengerjaan Ujian
          </Button>
        </Flex>
      )}

      <Box bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        <Table.Root interactive>
          <Table.Header bg="gray.50">
            <Table.Row>
              <Table.ColumnHeader w="40px" px={4} py={4}>
                <Checkbox.Root
                  checked={filteredSessions.length > 0 && selectedSessionIds.length === filteredSessions.length}
                  onCheckedChange={(details) => {
                    if (details.checked) {
                      setSelectedSessionIds(filteredSessions.map(s => s.id));
                    } else {
                      setSelectedSessionIds([]);
                    }
                  }}
                  colorPalette="indigo"
                >
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Siswa</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Rombel</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Durasi Pengerjaan</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Status</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Nilai Akhir</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" textAlign="right">Aksi</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body color="gray.700">
            {paginatedSessions.map((session) => {
              const start = new Date(session.startTime);
              const end = session.endTime ? new Date(session.endTime) : null;
              const diff = end ? Math.round((end.getTime() - start.getTime()) / 60000) : '-';

              return (
                <Table.Row key={session.id} _hover={{ bg: 'gray.50/40' }} transition="all 0.2s">
                  <Table.Cell px={4} py={4}>
                    <Checkbox.Root
                      checked={selectedSessionIds.includes(session.id)}
                      onCheckedChange={(details) => {
                        if (details.checked) {
                          setSelectedSessionIds(prev => [...prev, session.id]);
                        } else {
                          setSelectedSessionIds(prev => prev.filter(id => id !== session.id));
                        }
                      }}
                      colorPalette="indigo"
                    >
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <HStack gap={3}>
                      <Flex w={8} h={8} borderRadius="full" bg="blue.50" align="center" justify="center" color="blue.650">
                        <User size={16} />
                      </Flex>
                      <Box>
                        <Text fontWeight="bold" color="gray.900" fontSize="sm">{session.student.user.fullName}</Text>
                        <Text fontSize="3xs" color="gray.400" fontWeight="medium">@{session.student.user.username}</Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    <Text fontWeight="semibold" color="gray.700">
                      {session.student.rombel?.name || '-'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    <HStack gap={1}>
                      <Clock size={14} className="text-gray-400" />
                      <Text fontWeight="medium">{diff} menit</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <Badge
                      colorPalette={
                        session.status === 'FINISHED' || session.status === 'SUBMITTED' ? 'green' :
                        session.status === 'ONGOING' || session.status === 'IN_PROGRESS' ? 'blue' : 'gray'
                      }
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      fontSize="3xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      {session.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <HStack gap={1}>
                      <Award size={16} className={session.score !== null ? 'text-amber-500' : 'text-gray-300'} />
                      <Text fontWeight="bold" color="gray.800">{session.score ?? '--'}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} textAlign="right">
                    <Link href={`/admin/results/sessions/${session.id}`} passHref>
                      <Button
                        as="span"
                        variant="ghost"
                        size="sm"
                        color="indigo.650"
                        _hover={{ bg: 'indigo.50', color: 'indigo.700' }}
                        borderRadius="lg"
                        fontWeight="bold"
                        fontSize="xs"
                        cursor="pointer"
                      >
                        <FileText size={16} />
                        <Text>Detail & Nilai</Text>
                      </Button>
                    </Link>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
        <TablePagination
          currentPage={currentPage}
          totalCount={filteredSessions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      {/* Bulk Reset Confirmation Dialog */}
      <Dialog.Root
        open={isBulkResetModalOpen}
        onOpenChange={(details: any) => setIsBulkResetModalOpen(details.open)}
        size="md"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" overflow="hidden">
              <Dialog.Header bg="gray.50" py={4} borderBottom="1px solid" borderColor="gray.100">
                <Dialog.Title fontSize="md" fontWeight="bold" color="red.600" display="flex" alignItems="center" gap={2}>
                  <RotateCcw size={18} />
                  Reset Massal Pengerjaan Ujian
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={6}>
                <Stack gap={4}>
                  <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                    Apakah Anda yakin ingin me-reset pengerjaan ujian untuk <strong>{selectedSessionIds.length}</strong> siswa terpilih? Semua jawaban, nilai, dan riwayat pelanggaran proctoring siswa-siswa tersebut akan dihapus secara permanen. Mereka akan diizinkan untuk mengulang ujian ini dari awal.
                  </Text>
                  
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="gray.550" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Ketik "reset" untuk mengonfirmasi:
                    </Text>
                    <Input
                      value={resetConfirmationInput}
                      onChange={(e) => setResetConfirmationInput(e.target.value)}
                      placeholder="Ketik 'reset'"
                      borderRadius="lg"
                      borderColor="gray.350"
                      _focus={{ borderColor: 'red.500', boxShadow: '0 0 0 1px var(--chakra-colors-red-500)' }}
                    />
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer p={6} borderTop="1px solid" borderColor="gray.100">
                <Flex gap={3} width="full">
                  <Dialog.ActionTrigger asChild>
                    <Button type="button" variant="outline" borderRadius="lg" cursor="pointer" flex={1}>
                      Batal
                    </Button>
                  </Dialog.ActionTrigger>
                  <Button
                    onClick={() => {
                      if (resetConfirmationInput.toLowerCase() === 'reset') {
                        bulkResetMutation.mutate(selectedSessionIds);
                      }
                    }}
                    disabled={resetConfirmationInput.toLowerCase() !== 'reset' || bulkResetMutation.isPending}
                    flex={1}
                    bg="red.600"
                    color="white"
                    _hover={{ bg: 'red.700' }}
                    borderRadius="lg"
                    cursor="pointer"
                    loading={bulkResetMutation.isPending}
                  >
                    Reset Sekarang ({selectedSessionIds.length})
                  </Button>
                </Flex>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
