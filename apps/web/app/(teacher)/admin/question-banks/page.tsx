'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Search,
  RotateCcw,
  FolderKanban,
  FileQuestion,
  Hash,
  Layers,
  Copy,
  Info,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
  IconButton,
  SimpleGrid,
  HStack,
  Skeleton,
  Input,
  Select,
  createListCollection,
  Badge,
  Separator,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';

interface Subject { id: string; name: string; }
interface QuestionBank {
  id: string;
  name: string;
  subjectId: string;
  category?: string;
  subject?: Subject;
  questions?: any[];
  updatedAt?: string;
  _count?: { questions: number };
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string | number; tone: { bg: string; fg: string } }) {
  return (
    <Box bg="bg.surface" p={5} borderRadius="card" border="1px solid" borderColor="border.default" shadow="sm">
      <Flex align="center" gap={4}>
        <Flex w={12} h={12} borderRadius="lg" bg={tone.bg} color={tone.fg} align="center" justify="center" shadow="sm">
          <Icon size={22} strokeWidth={2.4} color="currentColor" />
        </Flex>
        <Box>
          <Text fontSize="xs" color="text.secondary" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">{label}</Text>
          <Text fontSize="2xl" fontWeight="bold" color="text.primary" mt={1}>{value}</Text>
        </Box>
      </Flex>
    </Box>
  );
}

const toneMap = {
  brand: { bg: 'brand.subtle', fg: 'brand.text' },
  success: { bg: 'status.success.bg', fg: 'status.success.text' },
  warning: { bg: 'status.warning.bg', fg: 'status.warning.text' },
  info: { bg: 'info.50', fg: 'info.600' },
};

export default function QuestionBankListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [formData, setFormData] = useState({ name: '', subjectId: '', category: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const { data: banks, isLoading } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks'],
    queryFn: async () => {
      const res = await api.get('/question-banks');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/subjects');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const categories = useMemo(() => Array.from(new Set((banks || []).map((b) => b.category?.trim()).filter((cat): cat is string => !!cat))).sort(), [banks]);
  const filteredBanks = useMemo(() => (banks || []).filter((bank) => {
    const matchesSearch = bank.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectId ? bank.subjectId === selectedSubjectId : true;
    const matchesCategory = selectedCategory ? (bank.category || 'Umum') === selectedCategory : true;
    return matchesSearch && matchesSubject && matchesCategory;
  }), [banks, searchQuery, selectedSubjectId, selectedCategory]);

  const subjectOptions = createListCollection({ items: [{ label: 'Semua Mapel', value: '' }, ...(subjects?.map((s) => ({ label: s.name, value: s.id })) || [])] });
  const categoryOptions = createListCollection({ items: [{ label: 'Semua Kategori', value: '' }, { label: 'Umum', value: 'Umum' }, ...categories.map((cat) => ({ label: cat, value: cat }))] });
  const sortOptions = createListCollection({ items: [
    { label: 'Nama (A - Z)', value: 'name-asc' },
    { label: 'Nama (Z - A)', value: 'name-desc' },
    { label: 'Soal Terbanyak', value: 'questions-desc' },
    { label: 'Soal Tersedikit', value: 'questions-asc' },
  ]});

  const createMutation = useMutation({ mutationFn: async (data: typeof formData) => api.post('/question-banks', data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['question-banks'] }); setIsModalOpen(false); resetForm(); toast.success(t('addQuestionSuccess')); }, onError: (err: any) => toast.error(err.response?.data?.message || t('addQuestionFail')) });
  const updateMutation = useMutation({ mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => api.patch(`/question-banks/${id}`, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['question-banks'] }); setIsModalOpen(false); resetForm(); toast.success(t('editQbSuccess')); }, onError: (err: any) => toast.error(err.response?.data?.message || t('editQbFail')) });
  const deleteBankMutation = useMutation({ mutationFn: async (id: string) => api.delete(`/questions/bank/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['question-banks'] }); toast.success('Bank soal berhasil dihapus'); }, onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus bank soal') });

  const handleDelete = async (id: string) => { if (await confirmDialog({ title: 'Hapus Bank Soal', description: t('deleteQbConfirm'), confirmText: t('deleteBtn') })) deleteBankMutation.mutate(id); };
  const handleEdit = (bank: QuestionBank) => { setEditingBank(bank); setFormData({ name: bank.name, subjectId: bank.subjectId, category: bank.category || '' }); setIsModalOpen(true); };
  const resetForm = () => { setFormData({ name: '', subjectId: '', category: '' }); setEditingBank(null); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); editingBank ? updateMutation.mutate({ id: editingBank.id, data: formData }) : createMutation.mutate(formData); };

  const totalBanks = banks?.length || 0;
  const totalQuestions = banks?.reduce((acc, bank) => acc + (bank._count?.questions ?? bank.questions?.length ?? 0), 0) || 0;
  const totalCategories = categories.length;
  const sortedBanks = [...filteredBanks].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    const aCount = a._count?.questions ?? a.questions?.length ?? 0;
    const bCount = b._count?.questions ?? b.questions?.length ?? 0;
    return sortBy === 'questions-desc' ? bCount - aCount : aCount - bCount;
  });
  const isFilterActive = searchQuery || selectedSubjectId || selectedCategory || sortBy !== 'name-asc';

  return (
    <Stack gap={6} p={6}>
<Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" p={6} shadow="card-dark">
        <Flex align="start" justify="space-between" gap={6} wrap="wrap">
          <Box maxW="2xl">
            <HStack gap={2} mb={2} color="brand.text"><Sparkles size={16} /><Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">Question Bank Control Center</Text></HStack>
            <Heading size="xl" fontWeight="bold" color="text.primary">{t('qbTitle')}</Heading>
            <Text color="text.secondary" mt={2} maxW="xl">{t('qbDesc')}</Text>
          </Box>
          <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" px={4} h={11} fontWeight="semibold" onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer" gap={2} shadow="btn-brand">
            <Plus size={18} /> <Box as="span">{t('addQb')}</Box>
          </Button>
        </Flex>
        <Box mt={5} p={4} borderRadius="lg" bg="bg.subtle" borderWidth="1px" borderColor="border.default">
          <Flex gap={2} align="center" color="text.secondary" mb={1}><Info size={16} /> <Text fontSize="sm" fontWeight="medium">Bank soal rapat, cepat, konsisten. Duplikat buat variasi, bukan bikin ulang.</Text></Flex>
          <Text fontSize="xs" color="text.muted">Klik kartu untuk masuk bank. Filter kiri, aksi kanan. Sort by jumlah soal paling berguna.</Text>
        </Box>
      </Box>

      {!isLoading && banks && banks.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <StatCard icon={FolderKanban} label="Total Bank Soal" value={totalBanks} tone={toneMap.brand} />
          <StatCard icon={FileQuestion} label="Total Soal" value={totalQuestions} tone={toneMap.success} />
          <StatCard icon={Hash} label="Kategori" value={totalCategories} tone={toneMap.warning} />
        </SimpleGrid>
      )}

      {!isLoading && banks && banks.length > 0 && (
        <Box bg="bg.surface" p={4} borderRadius="card" borderWidth="1px" borderColor="border.default" shadow="card-dark">
          <Flex direction={{ base: 'column', xl: 'row' }} gap={4} align={{ xl: 'center' }}>
            <Box flex={2} position="relative">
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="text.muted" pointerEvents="none"><Search size={18} /></Box>
              <Input placeholder="Cari bank soal..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} pl={10} borderRadius="lg" borderColor="input.border" bg="input.bg" _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }} />
            </Box>
            <Flex flex={{ base: 1, xl: 3 }} gap={3} direction={{ base: 'column', md: 'row' }} width="full">
              {[{ value: selectedSubjectId, set: setSelectedSubjectId, ph: 'Semua Mapel', col: subjectOptions }, { value: selectedCategory, set: setSelectedCategory, ph: 'Semua Kategori', col: categoryOptions }, { value: sortBy, set: setSortBy, ph: 'Urutkan', col: sortOptions }].map((f, idx) => (
                <Box key={idx} flex={1}>
                  <Select.Root collection={f.col} value={f.value ? [f.value] : []} onValueChange={(d) => f.set(d.value[0] || (idx === 2 ? 'name-asc' : ''))} positioning={{ sameWidth: true }}>
                    <Select.HiddenSelect />
                    <Select.Control><Select.Trigger borderRadius="lg"><Select.ValueText placeholder={f.ph} /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
                    <Select.Positioner><Select.Content>{f.col.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
                  </Select.Root>
                </Box>
              ))}
              {isFilterActive && <Button onClick={() => { setSearchQuery(''); setSelectedSubjectId(''); setSelectedCategory(''); setSortBy('name-asc'); }} variant="outline" borderColor="border.default" color="text.secondary" _hover={{ bg: 'bg.subtle' }} borderRadius="lg" height="40px" px={4} cursor="pointer" flexShrink={0} gap={2}><RotateCcw size={16} />Reset</Button>}
            </Flex>
          </Flex>
        </Box>
      )}

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}><Skeleton height="160px" borderRadius="card" /><Skeleton height="160px" borderRadius="card" /><Skeleton height="160px" borderRadius="card" /></SimpleGrid>
      ) : !banks || banks.length === 0 ? (
        <Box bg="bg.surface" borderWidth="1px" borderStyle="dashed" borderColor="border.default" borderRadius="card" p={12} textAlign="center">
          <Flex display="inline-flex" p={4} bg="bg.subtle" borderRadius="full" color="text.muted" mb={4}><BookOpen size={32} /></Flex>
          <Heading size="md" fontWeight="medium" color="text.primary">{t('noQb')}</Heading>
          <Text color="text.secondary" mt={2}>{t('noQbDesc')}</Text>
          <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" mt={6} onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer">{t('createBankBtn')}</Button>
        </Box>
      ) : sortedBanks.length === 0 ? (
        <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" p={12} textAlign="center">
          <Flex display="inline-flex" p={4} bg="bg.subtle" borderRadius="full" color="text.muted" mb={4}><Search size={32} /></Flex>
          <Heading size="md" fontWeight="medium" color="text.primary">Hasil pencarian tidak ditemukan</Heading>
          <Text color="text.secondary" mt={2}>Coba sesuaikan filter atau kata kunci pencarian Anda.</Text>
          <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" mt={6} onClick={() => { setSearchQuery(''); setSelectedSubjectId(''); setSelectedCategory(''); setSortBy('name-asc'); }} cursor="pointer">Bersihkan Filter</Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {sortedBanks.map((bank) => {
            const qCount = bank._count?.questions ?? bank.questions?.length ?? 0;
            return (
              <Box key={bank.id} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" shadow="card-dark" _hover={{ shadow: 'elevated', borderColor: 'brand.muted' }} transition="all 0.15s" display="flex" flexDirection="column">
                <Box p={4} flex={1}>
                  <Flex justify="space-between" align="flex-start" gap={2} mb={2.5}>
                    <Link href={`/admin/question-banks/${bank.id}`} style={{ textDecoration: 'none' }}>
                      <Heading size="sm" fontWeight="bold" color="text.primary" _hover={{ color: 'brand.text' }} cursor="pointer">{bank.name}</Heading>
                    </Link>
                    <HStack gap={1} flexShrink={0}>
                      <IconButton aria-label="Edit bank" size="sm" variant="ghost" color="text.secondary" _hover={{ bg: 'bg.subtle' }} borderRadius="md" onClick={() => handleEdit(bank)} cursor="pointer"><Edit2 size={14} /></IconButton>
                      <IconButton aria-label="Delete bank" size="sm" variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} borderRadius="md" onClick={() => handleDelete(bank.id)} cursor="pointer"><Trash2 size={14} /></IconButton>
                    </HStack>
                  </Flex>
                  <Flex align="center" gap={1.5} mb={2.5}>
                    <BookOpen size={12} color="var(--chakra-colors-text-muted)" />
                    <Text color="text.secondary" fontSize="xs" fontWeight="medium">{bank.subject?.name || '-'}</Text>
                  </Flex>
                  <HStack gap={1.5} flexWrap="wrap">
                    <Badge bg="brand.subtle" color="brand.text" borderRadius="sm" px={2} py={0.5} fontSize="11px">{bank.category || 'Umum'}</Badge>
                    <Badge bg="status.success.bg" color="status.success.text" borderRadius="sm" px={2} py={0.5} fontSize="11px">{qCount} soal</Badge>
                  </HStack>
                </Box>
                <Flex justify="space-between" align="center" px={4} py={2.5} bg="bg.subtle" borderTopWidth="1px" borderColor="border.default">
                  <Text fontSize="11px" color="text.muted">{bank.updatedAt ? new Date(bank.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'}</Text>
                  <Link href={`/admin/question-banks/${bank.id}`} style={{ textDecoration: 'none' }}>
                    <HStack gap={1} color="brand.text" _hover={{ color: 'brand.solid' }} transition="colors 0.15s">
                      <Text fontSize="11px" fontWeight="semibold">{t('manageQuestions')}</Text>
                      <ChevronRight size={12} />
                    </HStack>
                  </Link>
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {isModalOpen && (
        <Box position="fixed" inset={0} bg="rgba(6,9,15,0.7)" backdropFilter="blur(6px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} p={4}>
          <Box bg="bg.surface" borderRadius="card" p={8} w="full" maxW="md" shadow="2xl" border="1px solid" borderColor="border.default">
            <Heading size="lg" fontWeight="bold" mb={2} color="text.primary">{editingBank ? t('editQbModal') : t('createQbModal')}</Heading>
            <Text color="text.secondary" mb={6} fontSize="sm">Bank soal dipakai ulang. Nama jelas bikin cari cepat.</Text>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Box><Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>{t('bankNameLabel')} <Box as="span" color="status.danger.text">*</Box></Text><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('bankNamePlaceholder')} borderRadius="lg" borderColor="border.default" bg="bg.surface" _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }} /></Box>
                <Box><Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>{t('subjectLabel')} <Box as="span" color="status.danger.text">*</Box></Text><Select.Root collection={subjectOptions} value={formData.subjectId ? [formData.subjectId] : []} onValueChange={(details) => setFormData({ ...formData, subjectId: details.value[0] || '' })} positioning={{ sameWidth: true }}><Select.HiddenSelect /><Select.Control><Select.Trigger borderRadius="lg"><Select.ValueText placeholder={t('selectSubject')} /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content>{subjectOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root></Box>
                <Box><Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>{t('categoryLabel')}</Text><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder={t('categoryPlaceholder')} borderRadius="lg" borderColor="border.default" bg="bg.surface" _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }} /></Box>
                <Separator />
                <Flex gap={3} pt={2}><Button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} flex={1} variant="outline" borderRadius="lg" fontWeight="medium" cursor="pointer" borderColor="border.default">{t('cancelBtn')}</Button><Button type="submit" flex={1} bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" fontWeight="medium" cursor="pointer" loading={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? t('creatingBtn') : t('saveBtn')}</Button></Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
