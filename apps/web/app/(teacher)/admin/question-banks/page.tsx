'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, BookOpen, Search, SlidersHorizontal, ArrowUpDown, RotateCcw, FolderOpen, FileQuestion, Hash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Stack, Spinner, IconButton, SimpleGrid, HStack, Skeleton, Input, Textarea, Select, createListCollection } from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';

interface Subject {
  id: string;
  name: string;
}

interface QuestionBank {
  id: string;
  name: string;
  subjectId: string;
  category?: string;
  subject?: Subject;
  questions?: any[];
  _count?: {
    questions: number;
  };
}

export default function QuestionBankListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    category: '',
  });

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  const { data: banks, isLoading } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks'],
    queryFn: async () => {
      const res = await api.get('/question-banks');
      return res.data;
    },
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/subjects');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => api.post('/question-banks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(t('addQuestionSuccess')); // fallbacks or general success
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('addQuestionFail'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) =>
      api.patch(`/question-banks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(t('editQbSuccess'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('editQbFail'));
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/questions/bank/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      toast.success('Bank soal berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus bank soal');
    },
  });

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Bank Soal',
      description: t('deleteQbConfirm'),
      confirmText: t('deleteBtn'),
    });
    if (confirmed) deleteBankMutation.mutate(id);
  };

  const handleEdit = (bank: QuestionBank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      subjectId: bank.subjectId,
      category: bank.category || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', subjectId: '', category: '' });
    setEditingBank(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBank) {
      updateMutation.mutate({ id: editingBank.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Dynamic categories extraction
  const categories = Array.from(
    new Set(
      banks
        ?.map((b) => b.category?.trim())
        .filter((cat): cat is string => !!cat) || []
    )
  ).sort();

  // Stats calculation
  const totalBanks = banks?.length || 0;
  const totalQuestions = banks?.reduce((acc, bank) => {
    return acc + (bank._count?.questions ?? bank.questions?.length ?? 0);
  }, 0) || 0;
  const totalCategories = categories.length;

  // Filtered and sorted banks list
  const filteredBanks = (banks || []).filter((bank) => {
    const matchesSearch = bank.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectId ? bank.subjectId === selectedSubjectId : true;
    const matchesCategory = selectedCategory ? (bank.category || 'Umum') === selectedCategory : true;
    return matchesSearch && matchesSubject && matchesCategory;
  });

  const sortedBanks = [...filteredBanks].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    const aCount = a._count?.questions ?? a.questions?.length ?? 0;
    const bCount = b._count?.questions ?? b.questions?.length ?? 0;
    if (sortBy === 'questions-desc') {
      return bCount - aCount;
    }
    if (sortBy === 'questions-asc') {
      return aCount - bCount;
    }
    return 0;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('');
    setSelectedCategory('');
    setSortBy('name-asc');
  };

  const isFilterActive = searchQuery !== '' || selectedSubjectId !== '' || selectedCategory !== '' || sortBy !== 'name-asc';

  const subjectOptions = createListCollection({
    items: [{ label: 'Semua Mapel', value: '' }, ...(subjects?.map((subject) => ({ label: subject.name, value: subject.id })) || [])],
  });

  const categoryOptions = createListCollection({
    items: [
      { label: 'Semua Kategori', value: '' },
      { label: 'Umum', value: 'Umum' },
      ...categories.map((cat) => ({ label: cat, value: cat })),
    ],
  });

  const sortOptions = createListCollection({
    items: [
      { label: 'Nama (A - Z)', value: 'name-asc' },
      { label: 'Nama (Z - A)', value: 'name-desc' },
      { label: 'Soal Terbanyak', value: 'questions-desc' },
      { label: 'Soal Tersedikit', value: 'questions-asc' },
    ],
  });

  return (
    <Stack gap={6} p={6}>
      <Flex align="center" justify="space-between">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            {t('qbTitle')}
          </Heading>
          <Text color="gray.500" mt={1}>
            {t('qbDesc')}
          </Text>
        </Box>
        <Button
          bg="indigo.600"
          color="white"
          _hover={{ bg: 'indigo.700' }}
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="medium"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          cursor="pointer"
        >
          <Plus size={20} style={{ marginRight: '6px' }} />
          {t('addQb')}
        </Button>
      </Flex>

      {/* Stats Cards - Only show when banks are loaded and banks list is not empty */}
      {!isLoading && banks && banks.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          {/* Card 1: Total Banks */}
          <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
            <Flex align="center" gap={4}>
              <Box p={3} bg="indigo.50" borderRadius="lg" color="indigo.600">
                <BookOpen size={24} />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                  Total Bank Soal
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>
                  {totalBanks}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Card 2: Total Questions */}
          <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
            <Flex align="center" gap={4}>
              <Box p={3} bg="teal.50" borderRadius="lg" color="teal.600">
                <FileQuestion size={24} />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                  Total Soal
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>
                  {totalQuestions}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Card 3: Unique Categories */}
          <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
            <Flex align="center" gap={4}>
              <Box p={3} bg="orange.50" borderRadius="lg" color="orange.600">
                <Hash size={24} />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                  Kategori
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>
                  {totalCategories}
                </Text>
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>
      )}

      {/* Filter and Search Panel - Only show when banks are loaded and banks list is not empty */}
      {!isLoading && banks && banks.length > 0 && (
        <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
          <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align={{ lg: 'center' }}>
            {/* Search Input */}
            <Box flex={2} position="relative">
              <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none" zIndex={2}>
                <Search size={18} />
              </Box>
              <Input
                placeholder="Cari bank soal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl={10}
                borderRadius="lg"
                borderColor="gray.200"
                _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
              />
            </Box>

            {/* Select Filters and Sorting */}
            <Flex flex={{ base: 1, lg: 3 }} gap={3} direction={{ base: 'column', md: 'row' }} width="full">
              {/* Subject Filter */}
              <Box flex={1}>
                <Select.Root
                  collection={subjectOptions}
                  value={selectedSubjectId ? [selectedSubjectId] : []}
                  onValueChange={(details) => setSelectedSubjectId(details.value[0] || '')}
                  positioning={{ sameWidth: true }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger borderRadius="lg">
                      <Select.ValueText placeholder="Semua Mapel" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {subjectOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>

              {/* Category Filter */}
              <Box flex={1}>
                <Select.Root
                  collection={categoryOptions}
                  value={selectedCategory ? [selectedCategory] : []}
                  onValueChange={(details) => setSelectedCategory(details.value[0] || '')}
                  positioning={{ sameWidth: true }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger borderRadius="lg">
                      <Select.ValueText placeholder="Semua Kategori" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {categoryOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>

              {/* Sort By */}
              <Box flex={1}>
                <Select.Root
                  collection={sortOptions}
                  value={[sortBy]}
                  onValueChange={(details) => setSortBy(details.value[0] || 'name-asc')}
                  positioning={{ sameWidth: true }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger borderRadius="lg">
                      <Select.ValueText placeholder="Urutkan" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {sortOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>

              {/* Reset Button */}
              {isFilterActive && (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  borderColor="gray.200"
                  color="gray.600"
                  _hover={{ bg: 'gray.50' }}
                  borderRadius="lg"
                  height="40px"
                  px={4}
                  cursor="pointer"
                  flexShrink={0}
                >
                  <RotateCcw size={16} style={{ marginRight: '6px' }} />
                  Reset
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>
      )}

      {isLoading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          <Skeleton height="160px" borderRadius="xl" />
          <Skeleton height="160px" borderRadius="xl" />
          <Skeleton height="160px" borderRadius="xl" />
        </SimpleGrid>
      ) : !banks || banks.length === 0 ? (
        <Box
          bg="gray.50"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="gray.200"
          borderRadius="xl"
          p={12}
          textAlign="center"
        >
          <Flex display="inline-flex" p={4} bg="gray.100" borderRadius="full" color="gray.400" mb={4}>
            <BookOpen size={32} />
          </Flex>
          <Heading size="md" fontWeight="medium" color="gray.900">
            {t('noQb')}
          </Heading>
          <Text color="gray.500" mt={2}>
            {t('noQbDesc')}
          </Text>
          <Button
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="lg"
            mt={6}
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            cursor="pointer"
          >
            {t('createBankBtn')}
          </Button>
        </Box>
      ) : sortedBanks.length === 0 ? (
        <Box
          bg="gray.50"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={12}
          textAlign="center"
        >
          <Flex display="inline-flex" p={4} bg="gray.100" borderRadius="full" color="gray.400" mb={4}>
            <Search size={32} />
          </Flex>
          <Heading size="md" fontWeight="medium" color="gray.900">
            Hasil pencarian tidak ditemukan
          </Heading>
          <Text color="gray.500" mt={2}>
            Coba sesuaikan filter atau kata kunci pencarian Anda.
          </Text>
          <Button
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="lg"
            mt={6}
            onClick={handleResetFilters}
            cursor="pointer"
          >
            Bersihkan Filter
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {sortedBanks.map((bank: QuestionBank) => (
            <Box
              key={bank.id}
              bg="white"
              borderRadius="xl"
              p={6}
              borderWidth="1px"
              borderColor="gray.100"
              shadow="sm"
              _hover={{ shadow: 'md', borderColor: 'gray.200' }}
              transition="all 0.2s"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              minHeight="160px"
            >
              <Box>
                <Flex justify="space-between" align="flex-start" gap={2} mb={1}>
                  <Link href={`/admin/question-banks/${bank.id}`} style={{ textDecoration: 'none' }}>
                    <Heading
                      size="md"
                      fontWeight="bold"
                      color="gray.900"
                      _hover={{ color: 'indigo.600' }}
                      cursor="pointer"
                    >
                      {bank.name}
                    </Heading>
                  </Link>
                  <HStack gap={1} flexShrink={0}>
                    <IconButton
                      aria-label="Edit bank"
                      size="sm"
                      variant="ghost"
                      color="gray.600"
                      _hover={{ bg: 'gray.100' }}
                      borderRadius="lg"
                      onClick={() => handleEdit(bank)}
                      cursor="pointer"
                    >
                      <Edit2 size={16} />
                    </IconButton>
                    <IconButton
                      aria-label="Delete bank"
                      size="sm"
                      variant="ghost"
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      borderRadius="lg"
                      onClick={() => handleDelete(bank.id)}
                      cursor="pointer"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </HStack>
                </Flex>
                <Text color="gray.600" fontSize="sm" fontWeight="medium">
                  {bank.subject?.name}
                </Text>
              </Box>
              <Flex justify="space-between" align="center" mt={4} pt={3} borderTopWidth="1px" borderColor="gray.50">
                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                  {bank.category ? bank.category : 'Umum'}
                </Text>
                <Link href={`/admin/question-banks/${bank.id}`} style={{ textDecoration: 'none' }}>
                  <Text fontSize="xs" color="indigo.600" fontWeight="semibold" _hover={{ color: 'indigo.800' }}>
                    {t('manageQuestions')} ({bank._count?.questions ?? bank.questions?.length ?? 0})
                  </Text>
                </Link>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Box bg="white" borderRadius="xl" p={8} w="full" maxW="md" shadow="2xl">
            <Heading size="lg" fontWeight="bold" mb={6}>
              {editingBank ? t('editQbModal') : t('createQbModal')}
            </Heading>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {t('bankNameLabel')} <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('bankNamePlaceholder')}
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {t('subjectLabel')} <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Select.Root
                    collection={subjectOptions}
                    value={formData.subjectId ? [formData.subjectId] : []}
                    onValueChange={(details) => setFormData({ ...formData, subjectId: details.value[0] || '' })}
                    positioning={{ sameWidth: true }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger borderRadius="lg">
                        <Select.ValueText placeholder={t('selectSubject')} />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                        <Select.ClearTrigger />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {subjectOptions.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {t('categoryLabel')}
                  </Text>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder={t('categoryPlaceholder')}
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Flex gap={3} pt={4}>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    flex={1}
                    variant="outline"
                    borderRadius="lg"
                    fontWeight="medium"
                    cursor="pointer"
                  >
                    {t('cancelBtn')}
                  </Button>
                  <Button
                    type="submit"
                    flex={1}
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    fontWeight="medium"
                    cursor="pointer"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? t('creatingBtn') : t('saveBtn')}
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
