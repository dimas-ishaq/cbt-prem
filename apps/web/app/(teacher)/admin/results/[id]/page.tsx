'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useMemo, useState, useEffect } from 'react';
import { ChevronLeft, User, Award, Clock, FileText, FileDown, BarChart3, RotateCcw, RefreshCw, Search, Filter, Users, ShieldAlert, CheckCircle2, Download } from 'lucide-react';
import Link from 'next/link';
import { Badge, Box, Flex, Heading, Text, Button, Stack, Table, HStack, Spinner, Checkbox, Dialog, Portal, Input, createListCollection, Select } from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { TablePagination } from '@/components/ui/pagination';

interface ExamRombelTarget { rombelId: string; rombel?: { id: string; name: string } }
interface ExamSession { id: string; student: { user: { fullName: string; username: string }; nisn: string; rombelId?: string | null; rombel?: { id: string; name: string } | null }; startTime: string; endTime: string; score: number | null; status: string; answers: any[]; }

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const qc = useQueryClient();
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isBulkResetModalOpen, setIsBulkResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [targetSingleResetSession, setTargetSingleResetSession] = useState<{ id: string; fullName: string } | null>(null);
  const [isSingleResetModalOpen, setIsSingleResetModalOpen] = useState(false);
  const [singleResetConfirmationInput, setSingleResetConfirmationInput] = useState('');
  const [filterRombelId, setFilterRombelId] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: exam } = useQuery<any>({ queryKey: ['exam', id], queryFn: async () => (await api.get(`/exams/${id}`)).data });
  const { data: sessions, isLoading, refetch, isRefetching } = useQuery<ExamSession[]>({ queryKey: ['exam-sessions', id], queryFn: async () => { const r = await api.get(`/exam-sessions/exam/${id}`); return Array.isArray(r.data) ? r.data : r.data?.data || []; } });
  const bulkResetMutation = useMutation({ mutationFn: async (ids: string[]) => api.post('/exam-sessions/bulk-reset', { ids }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['exam-sessions', id] }); setSelectedSessionIds([]); setIsBulkResetModalOpen(false); setResetConfirmationInput(''); toast.success('Pengerjaan ujian siswa yang dipilih berhasil direset'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mereset pengerjaan ujian') });
  const singleResetMutation = useMutation({ mutationFn: async (sessionId: string) => api.delete(`/exam-sessions/${sessionId}/reset`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['exam-sessions', id] }); setIsSingleResetModalOpen(false); setTargetSingleResetSession(null); setSingleResetConfirmationInput(''); toast.success('Pengerjaan ujian siswa berhasil direset'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mereset pengerjaan ujian') });

  useEffect(() => setCurrentPage(1), [searchQuery, filterRombelId, filterStatus]);
  const assignedRombels = useMemo(() => ((Array.isArray(exam?.targetRombels) ? exam.targetRombels : []) as ExamRombelTarget[]).map((t) => t.rombel || null).filter((r): r is { id: string; name: string } => Boolean(r)), [exam]);
  const rombelCollection = useMemo(() => createListCollection({ items: [{ label: 'Semua Rombel', value: 'ALL' }, ...assignedRombels.map((r) => ({ label: r.name, value: r.id }))] }), [assignedRombels]);
  const statusCollection = useMemo(() => createListCollection({ items: [{ label: 'Semua Status', value: 'ALL' }, { label: 'Sedang Mengerjakan', value: 'IN_PROGRESS' }, { label: 'Terkunci', value: 'LOCKED' }, { label: 'Selesai', value: 'SUBMITTED' }] }), []);

  const filteredSessions = useMemo(() => {
    let list = Array.isArray(sessions) ? sessions : [];
    if (filterRombelId) list = list.filter((s) => s.student?.rombelId === filterRombelId);
    if (filterStatus !== 'ALL') list = list.filter((s) => s.status === filterStatus);
    const q = searchQuery.trim().toLowerCase();
    if (q.length >= 3) list = list.filter((s) => s.student?.user?.fullName?.toLowerCase().includes(q) || s.student?.user?.username?.toLowerCase().includes(q));
    return list;
  }, [sessions, filterRombelId, filterStatus, searchQuery]);
  const paginatedSessions = useMemo(() => filteredSessions.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize), [filteredSessions, currentPage, pageSize]);

  const exportMutation = useMutation({ mutationFn: async () => { const response = await api.get(`/exam-sessions/exam/${id}/export`, { responseType: 'blob' }); const url = window.URL.createObjectURL(new Blob([response.data])); const link = document.createElement('a'); link.href = url; link.setAttribute('download', `results-${exam?.title || id}.xlsx`); document.body.appendChild(link); link.click(); link.remove(); } });

  if (isLoading) return <Flex direction="column" align="center" justify="center" minH="50vh"><Spinner size="lg" color="brand.solid" /><Text color="text.secondary" mt={3} fontWeight="semibold">Memuat hasil ujian...</Text></Flex>;

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4} bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" p={4} shadow="card-dark">
        <Flex align="center" gap={4}>
          <Link href="/admin/exams"><Button variant="ghost" p={2} borderRadius="full" cursor="pointer"><ChevronLeft size={24} /></Button></Link>
          <Box><HStack gap={2} mb={1}><CheckCircle2 size={16} color="var(--chakra-colors-brand-text)" /><Heading size="lg" fontWeight="bold" color="text.primary">Hasil Ujian: {exam?.title}</Heading></HStack><Text fontSize="sm" color="text.secondary">{exam?.subject?.name} • {filteredSessions.length} Lembar Jawaban</Text></Box>
        </Flex>
        <HStack gap={3}>
          <Link href={`/admin/results/${id}/essay-grading`}><Button variant="outline" borderRadius="xl"><FileText size={18} /><Text>Koreksi Essay</Text></Button></Link>
          <Link href={`/admin/results/${id}/analytics`}><Button variant="outline" borderRadius="xl"><BarChart3 size={18} /><Text>Analisis Grafik</Text></Button></Link>
          <Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} bg="brand.solid" color="text.inverted" borderRadius="xl"><Download size={18} /><Text>{exportMutation.isPending ? 'Mengekspor...' : 'Ekspor Excel'}</Text></Button>
        </HStack>
      </Flex>

      <Box bg="bg.surface" p={5} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ base: 'stretch', md: 'end' }}>
          <Stack gap={1.5} flex={2}>
            <Text fontSize="xs" fontWeight="bold" color="text.secondary"><Search size={12} style={{display:'inline',marginRight:4}} />Cari Siswa</Text>
            <Input placeholder="Cari nama atau username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="sm" borderRadius="lg" bg="input.bg" borderColor="input.border" color="text.primary" _placeholder={{ color: 'text.muted' }} />
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && <Text fontSize="10px" color="status.warning.text" fontWeight="bold">Ketik minimal 3 karakter untuk memfilter</Text>}
          </Stack>
          <Stack gap={1.5} flex={1.5}>
            <Text fontSize="xs" fontWeight="bold" color="text.secondary"><Users size={12} style={{display:'inline',marginRight:4}} />Rombel</Text>
            <Select.Root collection={rombelCollection} value={filterRombelId ? [filterRombelId] : ['ALL']} onValueChange={(d) => setFilterRombelId((d.value[0] ?? '') === 'ALL' ? '' : (d.value[0] ?? ''))} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Rombel" /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content>{rombelCollection.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root>
          </Stack>
          <Stack gap={1.5} flex={1.5}>
            <Text fontSize="xs" fontWeight="bold" color="text.secondary"><Filter size={12} style={{display:'inline',marginRight:4}} />Status Pengerjaan</Text>
            <Select.Root collection={statusCollection} value={[filterStatus]} onValueChange={(d) => setFilterStatus(d.value[0] ?? 'ALL')} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Status" /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content>{statusCollection.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root>
          </Stack>
          <Flex gap={2} justify="end" align="center"><Button onClick={() => refetch()} disabled={isRefetching} size="sm" variant="outline" borderRadius="lg" cursor="pointer"><RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} /> Sinkronkan</Button></Flex>
        </Flex>
      </Box>

      {selectedSessionIds.length > 0 && <Flex bg="status.danger.bg" border="1px solid" borderColor="status.danger.text" p={4} borderRadius="card" align="center" justify="space-between"><HStack gap={2}><ShieldAlert size={16} /><Text fontSize="sm" fontWeight="bold" color="status.danger.text">{selectedSessionIds.length} siswa terpilih</Text></HStack><Button size="sm" bg="status.danger.text" color="text.inverted" onClick={() => { setResetConfirmationInput(''); setIsBulkResetModalOpen(true); }} borderRadius="xl"><RotateCcw size={16} /> Reset Pengerjaan Ujian</Button></Flex>}

      <Box bg="bg.surface" borderRadius="card" shadow="card-dark" border="1px solid" borderColor="border.default" overflow="hidden">
        <Table.Root interactive>
          <Table.Header bg="bg.subtle"><Table.Row><Table.ColumnHeader w="40px" px={4} py={4}><Checkbox.Root checked={filteredSessions.length > 0 && selectedSessionIds.length === filteredSessions.length} onCheckedChange={(d) => setSelectedSessionIds(d.checked === true ? filteredSessions.map((s) => s.id) : [])}><Checkbox.HiddenInput /><Checkbox.Control /></Checkbox.Root></Table.ColumnHeader><Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary">Siswa</Table.ColumnHeader><Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary">Rombel</Table.ColumnHeader><Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary">Durasi Pengerjaan</Table.ColumnHeader><Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary">Status</Table.ColumnHeader><Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary">Nilai Akhir</Table.ColumnHeader><Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" textAlign="right">Aksi</Table.ColumnHeader></Table.Row></Table.Header>
          <Table.Body color="text.primary">{paginatedSessions.map((session) => { const diff = session.endTime ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) : '-'; return (<Table.Row key={session.id} _hover={{ bg: 'bg.elevated' }}><Table.Cell px={4} py={4}><Checkbox.Root checked={selectedSessionIds.includes(session.id)} onCheckedChange={(d) => setSelectedSessionIds((prev) => d.checked === true ? [...prev, session.id] : prev.filter((id) => id !== session.id))}><Checkbox.HiddenInput /><Checkbox.Control /></Checkbox.Root></Table.Cell><Table.Cell px={6} py={4}><HStack gap={3}><Flex w={8} h={8} borderRadius="full" bg="brand.subtle" align="center" justify="center" color="brand.text"><User size={16} /></Flex><Box><Text fontWeight="bold" color="text.primary" fontSize="sm">{session.student.user.fullName}</Text><Text fontSize="3xs" color="text.muted" fontWeight="medium">@{session.student.user.username}</Text></Box></HStack></Table.Cell><Table.Cell px={6} py={4} fontSize="sm"><Text fontWeight="semibold" color="text.secondary">{session.student.rombel?.name || '-'}</Text></Table.Cell><Table.Cell px={6} py={4} fontSize="sm"><HStack gap={1}><Clock size={14} /><Text fontWeight="medium">{diff} menit</Text></HStack></Table.Cell><Table.Cell px={6} py={4}><Badge bg={session.status === 'FINISHED' || session.status === 'SUBMITTED' ? 'status.success.bg' : session.status === 'ONGOING' || session.status === 'IN_PROGRESS' ? 'info.50' : 'bg.subtle'} color={session.status === 'FINISHED' || session.status === 'SUBMITTED' ? 'status.success.text' : session.status === 'ONGOING' || session.status === 'IN_PROGRESS' ? 'info.600' : 'text.secondary'} px={2.5} py={1} borderRadius="badge" fontSize="3xs" fontWeight="bold" textTransform="uppercase">{session.status}</Badge></Table.Cell><Table.Cell px={6} py={4}><HStack gap={1}><Award size={16} /><Text fontWeight="bold">{session.score ?? '--'}</Text></HStack></Table.Cell><Table.Cell px={6} py={4} textAlign="right"><HStack gap={2} justify="end"><Link href={`/admin/results/sessions/${session.id}`}><Button as="span" variant="ghost" size="sm" color="brand.text" borderRadius="lg" fontWeight="bold" fontSize="xs"><FileText size={16} /><Text>Detail & Nilai</Text></Button></Link><Button size="sm" variant="ghost" color="status.danger.text" borderRadius="lg" fontWeight="bold" fontSize="xs" loading={singleResetMutation.isPending && singleResetMutation.variables === session.id} onClick={() => { setTargetSingleResetSession({ id: session.id, fullName: session.student.user.fullName }); setSingleResetConfirmationInput(''); setIsSingleResetModalOpen(true); }}><RotateCcw size={14} /><Text>Reset</Text></Button></HStack></Table.Cell></Table.Row>); })}</Table.Body>
        </Table.Root>
        <TablePagination currentPage={currentPage} totalCount={filteredSessions.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </Box>

      <Dialog.Root open={isBulkResetModalOpen} onOpenChange={(d: any) => setIsBulkResetModalOpen(d.open)} size="md"><Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content borderRadius="card" overflow="hidden" bg="bg.surface"><Dialog.Header bg="bg.subtle" py={4} borderBottom="1px solid" borderColor="border.default"><Dialog.Title fontSize="md" fontWeight="bold" color="status.danger.text" display="flex" alignItems="center" gap={2}><RotateCcw size={18} /> Reset Massal Pengerjaan Ujian</Dialog.Title></Dialog.Header><Dialog.Body p={6}><Stack gap={4}><Text fontSize="sm" color="text.secondary" lineHeight="relaxed">Apakah Anda yakin ingin me-reset pengerjaan ujian untuk <strong>{selectedSessionIds.length}</strong> siswa terpilih? Semua jawaban, nilai, dan riwayat pelanggaran proctoring akan dihapus permanen.</Text><Box><Text fontSize="xs" fontWeight="bold" color="text.secondary" mb={2} textTransform="uppercase" letterSpacing="wider">Ketik "reset" untuk mengonfirmasi:</Text><Input value={resetConfirmationInput} onChange={(e) => setResetConfirmationInput(e.target.value)} placeholder="Ketik 'reset'" borderRadius="lg" borderColor="input.border" bg="input.bg" _focus={{ borderColor: 'input.focus.border' }} /></Box></Stack></Dialog.Body><Dialog.Footer p={6} borderTop="1px solid" borderColor="border.default"><Flex gap={3} width="full"><Dialog.ActionTrigger asChild><Button type="button" variant="outline" borderRadius="lg" flex={1}>Batal</Button></Dialog.ActionTrigger><Button onClick={() => { if (resetConfirmationInput.toLowerCase() === 'reset') bulkResetMutation.mutate(selectedSessionIds); }} disabled={resetConfirmationInput.toLowerCase() !== 'reset' || bulkResetMutation.isPending} flex={1} bg="status.danger.text" color="text.inverted" borderRadius="lg" loading={bulkResetMutation.isPending}>Reset Sekarang ({selectedSessionIds.length})</Button></Flex></Dialog.Footer><Dialog.CloseTrigger /></Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
      <Dialog.Root open={isSingleResetModalOpen} onOpenChange={(d: any) => setIsSingleResetModalOpen(d.open)} size="md"><Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content borderRadius="card" overflow="hidden" bg="bg.surface"><Dialog.Header bg="bg.subtle" py={4} borderBottom="1px solid" borderColor="border.default"><Dialog.Title fontSize="md" fontWeight="bold" color="status.danger.text" display="flex" alignItems="center" gap={2}><RotateCcw size={18} /> Reset Pengerjaan Ujian Siswa</Dialog.Title></Dialog.Header><Dialog.Body p={6}><Stack gap={4}><Text fontSize="sm" color="text.secondary" lineHeight="relaxed">Apakah Anda yakin ingin me-reset pengerjaan ujian untuk siswa <strong>{targetSingleResetSession?.fullName}</strong>? Semua jawaban, nilai, dan riwayat pelanggaran proctoring akan dihapus permanen.</Text><Box><Text fontSize="xs" fontWeight="bold" color="text.secondary" mb={2} textTransform="uppercase" letterSpacing="wider">Ketik "reset" untuk mengonfirmasi:</Text><Input value={singleResetConfirmationInput} onChange={(e) => setSingleResetConfirmationInput(e.target.value)} placeholder="Ketik 'reset'" borderRadius="lg" borderColor="input.border" bg="input.bg" _focus={{ borderColor: 'input.focus.border' }} /></Box></Stack></Dialog.Body><Dialog.Footer p={6} borderTop="1px solid" borderColor="border.default"><Flex gap={3} width="full"><Dialog.ActionTrigger asChild><Button type="button" variant="outline" borderRadius="lg" flex={1}>Batal</Button></Dialog.ActionTrigger><Button onClick={() => { if (singleResetConfirmationInput.toLowerCase() === 'reset' && targetSingleResetSession) singleResetMutation.mutate(targetSingleResetSession.id); }} disabled={singleResetConfirmationInput.toLowerCase() !== 'reset' || singleResetMutation.isPending} flex={1} bg="status.danger.text" color="text.inverted" borderRadius="lg" loading={singleResetMutation.isPending}>Reset Sekarang</Button></Flex></Dialog.Footer><Dialog.CloseTrigger /></Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
    </Stack>
  );
}