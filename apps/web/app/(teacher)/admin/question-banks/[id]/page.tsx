'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, ChevronLeft, HelpCircle, FileDown, Download, Eye, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useState, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuestionForm } from '@/components/admin/question-form';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
  IconButton,
  Badge,
  SimpleGrid,
  HStack,
  Input,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';

interface Option {
  id?: string;
  content: string;
  isCorrect: boolean;
}

interface Subject {
  id: string;
  name: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  points: number;
  mediaUrl?: string;
  mediaType?: string;
  options: Option[];
}

interface QuestionBank {
  id: string;
  name: string;
  subjectId: string;
  category?: string;
  subject: {
    name: string;
  };
  questions: Question[];
}

interface PreviewQuestion {
  content: string;
  type: string;
  difficulty: string;
  points: number;
  options: { content: string; isCorrect: boolean; order: number }[];
}

interface ImportPreview {
  success: PreviewQuestion[];
  warnings: { line: string; reason: string }[];
  totalParsed: number;
  totalWarnings: number;
}

const difficultyColor: Record<string, { bg: string; color: string }> = {
  MUDAH: { bg: 'green.100', color: 'green.700' },
  SEDANG: { bg: 'yellow.100', color: 'yellow.700' },
  SULIT: { bg: 'red.100', color: 'red.700' },
};

const typeLabel: Record<string, string> = {
  PILIHAN_GANDA: 'Pilihan Ganda',
  BENAR_SALAH: 'Benar/Salah',
  MULTIPLE_RESPONSE: 'Jawaban Ganda',
  ESSAY: 'Essay',
};

export default function QuestionBankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    name: '',
    subjectId: '',
    category: '',
  });

  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const { t } = useTranslation();

  const { data: bank, isLoading } = useQuery<QuestionBank>({
    queryKey: ['question-bank', id],
    queryFn: async () => {
      const response = await api.get(`/question-banks/${id}`);
      return response.data;
    },
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/subjects');
      return res.data;
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (newQuestion: any) => api.post('/questions', { ...newQuestion, questionBankId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setIsAddingQuestion(false);
      toast.success(t('addQuestionSuccess'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('addQuestionFail'));
    },
  });

  const editQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
      api.patch(`/questions/${questionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setEditingQuestionId(null);
      toast.success(t('editQuestionSuccess'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('editQuestionFail'));
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => api.delete(`/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      toast.success(t('deleteQuestionSuccess'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('deleteQuestionFail'));
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: (data: typeof bankFormData) => api.patch(`/question-banks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setIsEditingBank(false);
      toast.success(t('editQbSuccess'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('editQbFail'));
    },
  });

  // Preview (dry-run) mutation
  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/questions/import/${id}/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as ImportPreview;
    },
    onSuccess: (data) => {
      setImportPreview(data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('importQuestionFail'));
    },
  });

  // Actual import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/questions/import/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      const data = res.data;
      const warningNote = data.warnings?.length > 0 ? ` ${t('importHasWarnings', { warn: data.warnings.length })}` : '';
      toast.success(t('importSuccessMsg', { count: data.imported }) + warningNote);
      setImportPreview(null);
      setPendingFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('importQuestionFail'));
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async () => api.delete(`/questions/bank/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      toast.success('Bank soal berhasil dihapus');
      router.push('/admin/question-banks');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus bank soal');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      previewMutation.mutate(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/questions/template/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template-import-soal.docx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleConfirmImport = () => {
    if (pendingFile) importMutation.mutate(pendingFile);
  };

  const handleCancelPreview = () => {
    setImportPreview(null);
    setPendingFile(null);
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">{t('loadingQbDetail')}</Text>
      </Flex>
    );
  }

  if (!bank) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Text color="gray.500">{t('qbNotFound')}</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <Flex align="center" justify="space-between">
        <HStack gap={4}>
          <IconButton
            asChild
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
            borderRadius="full"
            aria-label={t('backToQb')}
            size="sm"
          >
            <Link href="/admin/question-banks">
              <ChevronLeft size={24} />
            </Link>
          </IconButton>
          <Box>
            <HStack gap={2} align="center">
              <Heading size="xl" fontWeight="bold" color="gray.900">
                {bank.name}
              </Heading>
              <IconButton
                aria-label="Edit bank"
                size="xs"
                variant="ghost"
                color="gray.500"
                _hover={{ bg: 'gray.100' }}
                onClick={() => {
                  setBankFormData({
                    name: bank.name,
                    subjectId: bank.subjectId,
                    category: bank.category || '',
                  });
                  setIsEditingBank(true);
                }}
                cursor="pointer"
              >
                <Edit2 size={16} />
              </IconButton>
              <IconButton
                aria-label="Delete bank"
                size="xs"
                variant="ghost"
                color="red.500"
                _hover={{ bg: 'red.50' }}
                onClick={async () => {
                  const confirmed = await confirmDialog({
                    title: 'Hapus Bank Soal',
                    description: t('deleteQbConfirm'),
                    confirmText: t('deleteBtn'),
                  });
                  if (confirmed) {
                    deleteBankMutation.mutate();
                  }
                }}
                cursor="pointer"
              >
                <Trash2 size={16} />
              </IconButton>
            </HStack>
            <Text color="gray.500">
              {bank.subject.name} • {bank.category ? bank.category + ' • ' : ''}{t('questionsCountText', { count: bank.questions.length })}
            </Text>
          </Box>
        </HStack>
        {!isAddingQuestion && !importPreview && (
          <HStack gap={3}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".docx"
              style={{ display: 'none' }}
            />
            {/* Download Template */}
            <Button
              variant="outline"
              borderColor="blue.300"
              color="blue.600"
              _hover={{ bg: 'blue.50' }}
              borderRadius="lg"
              onClick={handleDownloadTemplate}
              cursor="pointer"
            >
              <Download size={18} />
              {t('downloadTemplate')}
            </Button>
            {/* Import from Word */}
            <Button
              variant="outline"
              borderColor="gray.300"
              color="gray.700"
              _hover={{ bg: 'gray.50' }}
              borderRadius="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={previewMutation.isPending}
              cursor="pointer"
            >
              <FileDown size={18} />
              {previewMutation.isPending ? t('previewingBtn') : t('importWordBtn')}
            </Button>
            {/* Add Question */}
            <Button
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
              onClick={() => setIsAddingQuestion(true)}
              cursor="pointer"
            >
              <Plus size={20} />
              {t('addQuestionBtn')}
            </Button>
          </HStack>
        )}
      </Flex>

      {/* ─── Import Preview Modal ─────────────────────────────────────────── */}
      {importPreview && (
        <Box
          bg="white"
          borderRadius="xl"
          shadow="lg"
          borderWidth="1px"
          borderColor="gray.200"
          overflow="hidden"
        >
          {/* Preview Header */}
          <Flex
            p={6}
            bg="indigo.50"
            align="center"
            justify="space-between"
            borderBottomWidth="1px"
            borderColor="indigo.100"
          >
            <Box>
              <Flex align="center" gap={3} mb={1}>
                <Eye size={20} color="#4f46e5" />
                <Heading size="md" fontWeight="bold" color="indigo.700">
                  {t('previewTitle')}
                </Heading>
              </Flex>
              <Text color="indigo.600" fontSize="sm">{t('previewDesc')}</Text>
            </Box>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Close preview"
              onClick={handleCancelPreview}
              cursor="pointer"
              _hover={{ bg: 'indigo.100' }}
            >
              <X size={18} />
            </IconButton>
          </Flex>

          {/* Stats Row */}
          <Flex gap={4} p={6} pb={4}>
            <Flex
              align="center"
              gap={2}
              bg="green.50"
              border="1px solid"
              borderColor="green.200"
              borderRadius="lg"
              px={4}
              py={2}
            >
              <CheckCircle2 size={18} color="#15803d" />
              <Text fontWeight="semibold" color="green.700">
                {t('previewSuccess', { count: importPreview.totalParsed })}
              </Text>
            </Flex>
            {importPreview.totalWarnings > 0 && (
              <Flex
                align="center"
                gap={2}
                bg="amber.50"
                border="1px solid"
                borderColor="amber.200"
                borderRadius="lg"
                px={4}
                py={2}
              >
                <AlertTriangle size={18} color="#b45309" />
                <Text fontWeight="semibold" color="amber.700">
                  {t('previewWarnings', { count: importPreview.totalWarnings })}
                </Text>
              </Flex>
            )}
          </Flex>

          {/* Warnings */}
          {importPreview.warnings.length > 0 && (
            <Box px={6} pb={4}>
              <Text fontWeight="semibold" color="amber.700" mb={2} fontSize="sm">
                ⚠️ {t('warningSection')}
              </Text>
              <Stack gap={2}>
                {importPreview.warnings.map((w, i) => (
                  <Box
                    key={i}
                    bg="amber.50"
                    borderRadius="md"
                    p={3}
                    borderLeftWidth="3px"
                    borderLeftColor="amber.400"
                  >
                    <Text fontSize="xs" color="amber.600" fontWeight="medium">{t('warningLine')}: {w.line}</Text>
                    <Text fontSize="xs" color="amber.800" mt={0.5}>{w.reason}</Text>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Question Preview Cards */}
          {importPreview.success.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color="gray.500">{t('noPreviewData')}</Text>
            </Box>
          ) : (
            <Stack gap={3} px={6} pb={4} maxH="60vh" overflowY="auto">
              {importPreview.success.map((q, idx) => {
                const dc = difficultyColor[q.difficulty] ?? { bg: 'yellow.100', color: 'yellow.700' };
                return (
                  <Box
                    key={idx}
                    bg="gray.50"
                    borderRadius="lg"
                    p={4}
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack gap={2}>
                        <Flex
                          w={7} h={7} align="center" justify="center"
                          borderRadius="full" bg="indigo.100" color="indigo.600"
                          fontWeight="bold" fontSize="xs"
                        >
                          {idx + 1}
                        </Flex>
                        <Badge
                          fontSize="xs" fontWeight="semibold" px={2} py={1}
                          bg="indigo.100" color="indigo.700" borderRadius="full"
                        >
                          {typeLabel[q.type] ?? q.type}
                        </Badge>
                        <Badge
                          fontSize="xs" fontWeight="semibold" px={2} py={1}
                          bg={dc.bg} color={dc.color} borderRadius="full"
                        >
                          {q.difficulty}
                        </Badge>
                        <Badge
                          fontSize="xs" fontWeight="semibold" px={2} py={1}
                          bg="gray.100" color="gray.600" borderRadius="full"
                        >
                          {q.points} poin
                        </Badge>
                      </HStack>
                    </Flex>
                    <Box
                      color="gray.800" fontSize="sm" mb={q.options.length > 0 ? 3 : 0}
                      dangerouslySetInnerHTML={{ __html: q.content }}
                    />
                    {q.options.length > 0 && (
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                        {q.options.map((opt, oi) => (
                          <Flex
                            key={oi}
                            p={2}
                            borderWidth="1px"
                            borderColor={opt.isCorrect ? 'green.400' : 'gray.200'}
                            bg={opt.isCorrect ? 'green.50' : 'white'}
                            borderRadius="md"
                            align="center"
                            gap={2}
                          >
                            <Flex
                              w={5} h={5} align="center" justify="center"
                              borderRadius="full" fontSize="xs" fontWeight="bold"
                              bg={opt.isCorrect ? 'green.500' : 'gray.100'}
                              color={opt.isCorrect ? 'white' : 'gray.600'}
                            >
                              {String.fromCharCode(65 + oi)}
                            </Flex>
                            <Text fontSize="xs" dangerouslySetInnerHTML={{ __html: opt.content }} />
                          </Flex>
                        ))}
                      </SimpleGrid>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* Action buttons */}
          <Flex gap={3} p={6} borderTopWidth="1px" borderColor="gray.100" justify="flex-end">
            <Button
              variant="outline"
              borderRadius="lg"
              onClick={handleCancelPreview}
              cursor="pointer"
            >
              {t('cancelImport')}
            </Button>
            <Button
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
              onClick={handleConfirmImport}
              disabled={importPreview.totalParsed === 0 || importMutation.isPending}
              cursor="pointer"
            >
              {importMutation.isPending ? <Spinner size="sm" mr={2} /> : <CheckCircle2 size={18} />}
              {importMutation.isPending
                ? t('importingBtn')
                : t('confirmImport') + ` (${importPreview.totalParsed} soal)`}
            </Button>
          </Flex>
        </Box>
      )}

      {/* ─── Add Question Form ────────────────────────────────────────────── */}
      {isAddingQuestion ? (
        <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" p={8}>
          <Heading size="lg" fontWeight="bold" mb={6}>
            {t('createNewQuestion')}
          </Heading>
          <QuestionForm
            onSubmit={(data) => createQuestionMutation.mutate(data)}
            onCancel={() => setIsAddingQuestion(false)}
            isSubmitting={createQuestionMutation.isPending}
          />
        </Box>
      ) : (
        <Stack gap={4}>
          {bank.questions.map((question, idx) => {
            const dc = difficultyColor[question.difficulty] ?? { bg: 'yellow.100', color: 'yellow.700' };
            if (editingQuestionId === question.id) {
              return (
                <Box key={question.id} bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" p={8}>
                  <Heading size="lg" fontWeight="bold" mb={6}>
                    {t('editQuestionTitle')}
                  </Heading>
                  <QuestionForm
                    initialData={question}
                    onSubmit={(data) => editQuestionMutation.mutate({ questionId: question.id, data })}
                    onCancel={() => setEditingQuestionId(null)}
                    isSubmitting={editQuestionMutation.isPending}
                  />
                </Box>
              );
            }
            return (
              <Box
                key={question.id}
                bg="white"
                borderRadius="xl"
                shadow="sm"
                borderWidth="1px"
                borderColor="gray.100"
                overflow="hidden"
              >
                <Box p={6}>
                  <Flex justify="space-between" align="flex-start" mb={4}>
                    <HStack gap={3}>
                      <Flex
                        w={8} h={8} align="center" justify="center"
                        borderRadius="full" bg="indigo.50" color="indigo.600"
                        fontWeight="bold" fontSize="sm"
                      >
                        {idx + 1}
                      </Flex>
                      <Badge
                        fontSize="xs" fontWeight="semibold" px={2} py={1}
                        bg="gray.100" color="gray.600" borderRadius="full"
                      >
                        {typeLabel[question.type] ?? question.type}
                      </Badge>
                      <Badge
                        fontSize="xs" fontWeight="semibold" px={2} py={1}
                        bg={dc.bg} color={dc.color} borderRadius="full"
                      >
                        {question.difficulty}
                      </Badge>
                      <Badge
                        fontSize="xs" fontWeight="semibold" px={2} py={1}
                        bg="gray.100" color="gray.600" borderRadius="full"
                      >
                        {question.points} poin
                      </Badge>
                    </HStack>
                    <HStack gap={1}>
                      <IconButton
                        variant="ghost"
                        color="gray.600"
                        _hover={{ bg: 'gray.100' }}
                        size="sm"
                        borderRadius="lg"
                        aria-label={t('editQuestionTitle')}
                        onClick={() => setEditingQuestionId(question.id)}
                        cursor="pointer"
                      >
                        <Edit2 size={18} />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        color="red.500"
                        _hover={{ bg: 'red.50' }}
                        size="sm"
                        borderRadius="lg"
                        aria-label={t('deleteQuestionTitle')}
                        onClick={async () => {
                          const confirmed = await confirmDialog({
                            title: t('deleteQuestionTitle'),
                            description: t('deleteQuestionDesc'),
                            confirmText: t('deleteBtn'),
                          });
                          if (confirmed) {
                            deleteQuestionMutation.mutate(question.id);
                          }
                        }}
                        cursor="pointer"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </HStack>
                  </Flex>

                  <Box
                    color="gray.900"
                    fontWeight="medium"
                    mb={4}
                    dangerouslySetInnerHTML={{ __html: question.content }}
                  />

                  {question.type !== 'ESSAY' && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                      {question.options.map((option, optIdx) => (
                        <Flex
                          key={option.id}
                          p={3}
                          borderWidth="1px"
                          borderColor={option.isCorrect ? 'green.500' : 'gray.200'}
                          bg={option.isCorrect ? 'green.50' : 'transparent'}
                          borderRadius="lg"
                          align="center"
                          gap={3}
                        >
                          <Flex
                            w={6} h={6} align="center" justify="center"
                            borderRadius="full" borderWidth="1px" fontSize="xs" fontWeight="bold"
                            bg={option.isCorrect ? 'green.600' : 'gray.100'}
                            borderColor={option.isCorrect ? 'green.600' : 'gray.200'}
                            color={option.isCorrect ? 'white' : 'gray.600'}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </Flex>
                          <Box dangerouslySetInnerHTML={{ __html: option.content }} />
                        </Flex>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              </Box>
            );
          })}

          {bank.questions.length === 0 && !importPreview && (
            <Box
              bg="gray.50" borderWidth="2px" borderStyle="dashed"
              borderColor="gray.200" borderRadius="xl" p={12} textAlign="center"
            >
              <Flex display="inline-flex" p={4} bg="gray.100" borderRadius="full" color="gray.400" mb={4}>
                <HelpCircle size={32} />
              </Flex>
              <Heading size="md" fontWeight="medium" color="gray.900">
                {t('noQuestions')}
              </Heading>
              <Text color="gray.500" mt={2}>
                {t('noQuestionsDesc')}
              </Text>
              <HStack justify="center" mt={6} gap={3}>
                <Button
                  variant="outline"
                  borderColor="blue.300"
                  color="blue.600"
                  _hover={{ bg: 'blue.50' }}
                  borderRadius="lg"
                  onClick={handleDownloadTemplate}
                  cursor="pointer"
                >
                  <Download size={18} />
                  {t('downloadTemplate')}
                </Button>
                <Button
                  bg="indigo.600" color="white"
                  _hover={{ bg: 'indigo.700' }}
                  borderRadius="lg"
                  onClick={() => setIsAddingQuestion(true)}
                  cursor="pointer"
                >
                  <Plus size={20} />
                  {t('addFirstQuestionBtn')}
                </Button>
              </HStack>
            </Box>
          )}
        </Stack>
      )}

      {/* Edit Question Bank Modal */}
      {isEditingBank && (
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
              {t('editQbModal')}
            </Heading>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateBankMutation.mutate(bankFormData);
              }}
            >
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {t('bankNameLabel')} <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    value={bankFormData.name}
                    onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
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
                    value={bankFormData.subjectId}
                    onChange={(e) => setBankFormData({ ...bankFormData, subjectId: e.target.value })}
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
                    value={bankFormData.category}
                    onChange={(e) => setBankFormData({ ...bankFormData, category: e.target.value })}
                    placeholder={t('categoryPlaceholder')}
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Flex gap={3} pt={4}>
                  <Button
                    type="button"
                    onClick={() => setIsEditingBank(false)}
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
                    disabled={updateBankMutation.isPending}
                  >
                    {updateBankMutation.isPending ? t('creatingBtn') : t('saveBtn')}
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
