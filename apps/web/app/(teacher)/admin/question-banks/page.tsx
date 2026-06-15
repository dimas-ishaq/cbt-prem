'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Box, Flex, Heading, Text, Button, Stack, Spinner, IconButton, SimpleGrid, HStack, Skeleton, Input, Textarea } from '@chakra-ui/react';
import toast from 'react-hot-toast';
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
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {banks.map((bank: QuestionBank) => (
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
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      outline: 'none',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="">{t('selectSubject')}</option>
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
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
