"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { TablePagination } from '@/components/ui/pagination';
import { Plus, FileText, Trash2, Calendar, Clock, Lock, Pencil, Search, Filter, ClipboardList, BadgeCheck, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Badge, Box, Flex, Heading, Text, Button, Table, HStack, Stack, Spinner, IconButton, Input, Select, createListCollection } from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';

interface Exam { id: string; title: string; subject: { name: string }; examGroup?: { name: string }; startTime: string; endTime: string; duration: number; status: string; token?: string; }

const statusOptions = createListCollection({ items: [{ label: 'Semua Status', value: '' }, { label: 'Draft', value: 'DRAFT' }, { label: 'Terpublikasi', value: 'PUBLISHED' }, { label: 'Sedang Berjalan', value: 'ONGOING' }, { label: 'Selesai', value: 'COMPLETED' }] });

const statusMeta: Record<string, { bg: string; color: string }> = {
  PUBLISHED: { bg: 'status.success.bg', color: 'status.success.text' },
  ONGOING: { bg: 'info.50', color: 'info.600' },
  COMPLETED: { bg: 'bg.subtle', color: 'text.secondary' },
  DRAFT: { bg: 'status.warning.bg', color: 'status.warning.text' },
};

export default function ExamsPage() {
  const qc = useQueryClient();
  const confirmDialog = useConfirm();
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => setCurrentPage(1), [searchText, selectedStatus]);

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exams/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); toast.success('Ujian berhasil dihapus!'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus ujian'),
  });

  const filteredExams = useMemo(() => (exams || []).filter((exam) => {
    const q = searchText.trim().toLowerCase();
    const matchesSearch = !q || `${exam.title} ${exam.subject.name} ${exam.examGroup?.name ?? ''}`.toLowerCase().includes(q);
    const matchesStatus = !selectedStatus || exam.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }), [exams, searchText, selectedStatus]);

  const paginatedExams = useMemo(() => filteredExams.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize), [filteredExams, currentPage, pageSize]);

  if (isLoading) {
    return <Flex justify="center" align="center" py={16}><Spinner size="lg" color="brand.solid" /><Text ml={3} color="text.secondary">Memuat data ujian...</Text></Flex>;
  }

  const counts = {
    total: (exams || []).length,
    draft: (exams || []).filter((e) => e.status === 'DRAFT').length,
    published: (exams || []).filter((e) => e.status === 'PUBLISHED').length,
    ongoing: (exams || []).filter((e) => e.status === 'ONGOING').length,
  };

  return (
    <Stack gap={6}>
      <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" shadow="card-dark" p={{ base: 5, md: 6 }}>
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <Box>
            <HStack gap={2} mb={1}><ClipboardList size={18} color="var(--chakra-colors-brand-text)" /><Heading size="xl" fontWeight="bold" color="text.primary">Ujian</Heading></HStack>
            <Text color="text.secondary" mt={1}>Jadwalkan, publish, dan kelola ujian mata pelajaran.</Text>
          </Box>
          <Link href="/admin/exams/create">
            <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" px={4} py={2} fontWeight="medium" cursor="pointer">
              <Plus size={20} /> Jadwalkan Ujian
            </Button>
          </Link>
        </Flex>

        <Flex gap={4} wrap="wrap" mt={5}>
          {[
            { label: 'Total', value: counts.total, icon: ClipboardList, color: '#9C55E8', bg: 'rgba(156, 85, 232, 0.1)' },
            { label: 'Draft', value: counts.draft, icon: FileText, color: '#F5A623', bg: 'rgba(245, 166, 35, 0.1)' },
            { label: 'Published', value: counts.published, icon: BadgeCheck, color: '#1ABE71', bg: 'rgba(26, 190, 113, 0.1)' },
            { label: 'Ongoing', value: counts.ongoing, icon: Clock, color: '#2D9BF0', bg: 'rgba(45, 155, 240, 0.1)' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Flex
                key={item.label}
                minW="140px"
                flex="1"
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
                borderRadius="xl"
                p={4}
                align="center"
                gap={4}
              >
                <Flex
                  w={10}
                  h={10}
                  borderRadius="lg"
                  bg={item.bg}
                  align="center"
                  justify="center"
                  color={item.color}
                  flexShrink={0}
                >
                  <Icon size={20} />
                </Flex>
                <Box>
                  <Text color="text.secondary" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.08em">
                    {item.label}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="text.primary" mt={0.5}>
                    {item.value}
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </Flex>
      </Box>

      <Box bg="bg.surface" borderRadius="card" borderWidth="1px" borderColor="border.default" shadow="card-dark" p={4}>
        <Flex gap={3} align="center" flexWrap="wrap">
          <Flex align="center" gap={2} bg="input.bg" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="input.border" flex={1} minW="260px">
            <Search size={16} color="var(--chakra-colors-text-muted)" />
            <Input placeholder="Cari ujian..." value={searchText} onChange={(e) => setSearchText(e.target.value)} size="sm" variant="unstyled" flex={1} _placeholder={{ color: 'text.muted' }} />
          </Flex>
          <Flex align="center" gap={2} bg="input.bg" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="input.border">
            <BadgeCheck size={16} color="var(--chakra-colors-text-muted)" />
            <Select.Root collection={statusOptions} value={selectedStatus ? [selectedStatus] : []} onValueChange={(d) => setSelectedStatus(d.value[0] || '')} positioning={{ sameWidth: true }}>
              <Select.HiddenSelect />
              <Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Status" /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
              <Select.Positioner><Select.Content>{statusOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
            </Select.Root>
          </Flex>
        </Flex>
      </Box>

      <Box bg="bg.surface" borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default" overflow="hidden">
        <Table.Root size="md">
          <Table.Header bg="bg.subtle">
            <Table.Row>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">Judul Ujian</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">Mata Pelajaran</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">Jadwal</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">Status</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase" textAlign="end">Aksi</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedExams.map((exam) => {
              const sc = statusMeta[exam.status] ?? { bg: 'bg.subtle', color: 'text.secondary' };
              return (
                <Table.Row key={exam.id} _hover={{ bg: 'bg.elevated' }} transition="background 0.15s">
                  <Table.Cell px={6} py={4}>
                    <HStack gap={2}><Text fontWeight="semibold" color="text.primary">{exam.title}</Text></HStack>
                    <HStack gap={2} mt={1} wrap="wrap">
                      {exam.examGroup && <Badge bg="brand.subtle" color="brand.text" fontSize="2xs" borderRadius="badge"><BookOpen size={10} style={{ display: 'inline', marginRight: 4 }} />{exam.examGroup.name}</Badge>}
                      {exam.token && <HStack gap={1} color="text.muted" fontSize="xs"><Lock size={12} /><Text>Token: {exam.token}</Text></HStack>}
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm" color="text.secondary">{exam.subject.name}</Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    <HStack gap={1} color="text.secondary"><Calendar size={14} /><Text>{new Date(exam.startTime).toLocaleDateString('id-ID')}</Text></HStack>
                    <HStack gap={1} mt={1} color="text.muted"><Clock size={14} /><Text>{exam.duration} menit</Text></HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}><Badge px={2} py={1} fontSize="xs" fontWeight="bold" borderRadius="badge" bg={sc.bg} color={sc.color}>{exam.status}</Badge></Table.Cell>
                  <Table.Cell px={6} py={4} textAlign="end">
                    <HStack gap={2} justify="flex-end">
                      <IconButton asChild variant="ghost" color="brand.text" _hover={{ bg: 'brand.subtle' }} size="sm" borderRadius="lg" aria-label="Lihat Hasil"><Link href={`/admin/results/${exam.id}`}><FileText size={16} /></Link></IconButton>
                      <IconButton asChild variant="ghost" color="status.warning.text" _hover={{ bg: 'status.warning.bg' }} size="sm" borderRadius="lg" aria-label="Edit Ujian"><Link href={`/admin/exams/edit/${exam.id}`}><Pencil size={16} /></Link></IconButton>
                      <IconButton variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} size="sm" borderRadius="lg" aria-label="Delete Exam" onClick={async () => { const confirmed = await confirmDialog({ title: 'Hapus Ujian', description: 'Apakah Anda yakin ingin menghapus ujian ini?', confirmText: 'Hapus' }); if (confirmed) deleteMutation.mutate(exam.id); }}><Trash2 size={16} /></IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {filteredExams.length === 0 && <Table.Row><Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="text.secondary" fontStyle="italic">Belum ada ujian yang dijadwalkan.</Table.Cell></Table.Row>}
          </Table.Body>
        </Table.Root>
        <TablePagination currentPage={currentPage} totalCount={filteredExams.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </Box>
    </Stack>
  );
}