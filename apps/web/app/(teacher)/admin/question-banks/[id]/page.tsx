'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, ChevronLeft, HelpCircle, FileDown, Download, Eye, AlertTriangle, CheckCircle2, X, FileQuestion, BookOpen, Image as ImageIcon } from 'lucide-react';
import { useState, use, useRef, useMemo } from 'react';
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
  Select,
  createListCollection,
  Separator,
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
  MUDAH: { bg: 'status.success.bg', color: 'status.success.text' },
  SEDANG: { bg: 'status.warning.bg', color: 'status.warning.text' },
  SULIT: { bg: 'status.danger.bg', color: 'status.danger.text' },
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
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const subjectOptions = createListCollection({
    items: subjects?.map((subject) => ({ label: subject.name, value: subject.id })) ?? [],
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
        <Spinner size="lg" color="brand.solid" />
        <Text ml={3} color="text.secondary">{t('loadingQbDetail')}</Text>
      </Flex>
    );
  }

  if (!bank) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Text color="text.secondary">{t('qbNotFound')}</Text>
      </Flex>
    );
  }

  return (
    <Box maxW="5xl" mx="auto" py={8} px={6}>
      <Stack gap={6}>
        {/* ─── Header ───────────────────────────────────────────────────── */}
        <Box bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" p={5} shadow="card-dark">
          <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
            <HStack gap={3} align="center">
              <IconButton asChild variant="ghost" _hover={{ bg: 'bg.subtle' }} borderRadius="full" aria-label={t('backToQb')} size="sm"><Link href="/admin/question-banks"><ChevronLeft size={24} /></Link></IconButton>
              <Box>
                <HStack gap={2} mb={0.5}><HelpCircle size={12} color="var(--chakra-colors-brand-text)" /><Text fontSize="xs" fontWeight="bold" letterSpacing="wider" textTransform="uppercase" color="brand.text">{t('qbTitle')} Detail</Text></HStack>
                <Heading size="lg" fontWeight="bold" color="text.primary">{bank.name}</Heading>
                <Text color="text.secondary" fontSize="sm" mt={1}>{bank.subject.name} • {bank.category ? bank.category + ' • ' : ''}{bank.questions.length} soal</Text>
              </Box>
            </HStack>
            <HStack gap={2}>
              <IconButton aria-label="Edit bank" size="sm" variant="ghost" color="text.muted" _hover={{ bg: 'bg.subtle' }} onClick={() => { setBankFormData({ name: bank.name, subjectId: bank.subjectId, category: bank.category || '' }); setIsEditingBank(true); }} cursor="pointer"><Edit2 size={16} /></IconButton>
              <IconButton aria-label="Delete bank" size="sm" variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} onClick={async () => { const confirmed = await confirmDialog({ title: 'Hapus Bank Soal', description: t('deleteQbConfirm'), confirmText: t('deleteBtn') }); if (confirmed) deleteBankMutation.mutate(); }} cursor="pointer"><Trash2 size={16} /></IconButton>
            </HStack>
          </Flex>
        </Box>

        {/* ─── Action Bar ─────────────────────────────────────────────── */}
        {!isAddingQuestion && !importPreview && (
          <Flex gap={3} wrap="wrap" align="center">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".docx" style={{ display: 'none' }} />
            <Button variant="outline" borderColor="brand.subtle" color="brand.text" _hover={{ bg: 'brand.subtle' }} borderRadius="md" size="sm" onClick={handleDownloadTemplate} cursor="pointer" gap={2}><Download size={16} />{t('downloadTemplate')}</Button>
            <Button variant="outline" borderColor="border.default" color="text.secondary" _hover={{ bg: 'bg.subtle' }} borderRadius="md" size="sm" onClick={() => fileInputRef.current?.click()} disabled={previewMutation.isPending} cursor="pointer" gap={2}><FileDown size={16} />{previewMutation.isPending ? t('previewingBtn') : t('importWordBtn')}</Button>
            <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="md" size="sm" onClick={() => setIsAddingQuestion(true)} cursor="pointer" gap={2} shadow="btn-brand"><Plus size={16} />{t('addQuestionBtn')}</Button>
          </Flex>
        )}

        {/* ─── Info Panel ──────────────────────────────────────────────── */}
        {bank.questions.length > 0 && (
          <Flex gap={4} wrap="wrap">
            <Flex align="center" gap={2.5} bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="md" px={4} py={2.5}>
              <FileQuestion size={16} color="var(--chakra-colors-brand-text)" />
              <Text fontSize="sm" fontWeight="medium" color="text.primary">{bank.questions.length} soal</Text>
            </Flex>
            <Flex align="center" gap={2.5} bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="md" px={4} py={2.5}>
              <BookOpen size={16} color="var(--chakra-colors-text-muted)" />
              <Text fontSize="sm" color="text.secondary">{bank.subject.name}</Text>
            </Flex>
            {bank.category && (
              <Flex align="center" gap={2.5} bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="md" px={4} py={2.5}>
                <Layers size={16} color="var(--chakra-colors-text-muted)" />
                <Text fontSize="sm" color="text.secondary">{bank.category}</Text>
              </Flex>
            )}
          </Flex>
        )}

        {/* ─── Import Preview ─────────────────────────────────────────── */}
        {importPreview && (
          <Box bg="bg.surface" borderRadius="card" shadow="lg" borderWidth="1px" borderColor="border.default" overflow="hidden">
            {/* Preview Header */}
            <Flex p={6} bg="brand.subtle" align="center" justify="space-between" borderBottomWidth="1px" borderColor="border.default">
              <Box>
                <Flex align="center" gap={3} mb={1}>
                  <Eye size={20} color="currentColor" />
                  <Heading size="md" fontWeight="bold" color="text.primary">{t('previewTitle')}</Heading>
                </Flex>
                <Text color="text.secondary" fontSize="sm">{t('previewDesc')}</Text>
              </Box>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Close preview"
                onClick={handleCancelPreview}
                cursor="pointer"
                _hover={{ bg: 'bg.subtle' }}
              >
                <X size={18} />
              </IconButton>
            </Flex>

            {/* Stats Row */}
            <Flex gap={4} p={6} pb={4} wrap="wrap">
              <Flex align="center" gap={2} bg="status.success.bg" border="1px solid" borderColor="status.success.bg" borderRadius="lg" px={4} py={2}>
                <CheckCircle2 size={18} color="currentColor" />
                <Text fontWeight="semibold" color="status.success.text">{t('previewSuccess', { count: importPreview.totalParsed })}</Text>
              </Flex>
              {importPreview.totalWarnings > 0 && (
                <Flex align="center" gap={2} bg="status.warning.bg" border="1px solid" borderColor="status.warning.bg" borderRadius="lg" px={4} py={2}>
                  <AlertTriangle size={18} color="currentColor" />
                  <Text fontWeight="semibold" color="status.warning.text">{t('previewWarnings', { count: importPreview.totalWarnings })}</Text>
                </Flex>
              )}
            </Flex>

            {/* Warnings */}
            {importPreview.warnings.length > 0 && (
              <Box px={6} pb={4}>
                <Text fontWeight="semibold" color="status.warning.text" mb={2} fontSize="sm">⚠️ {t('warningSection')}</Text>
                <Stack gap={2}>
                  {importPreview.warnings.map((w, i) => (
                    <Box key={i} bg="status.warning.bg" borderRadius="md" p={3} borderLeftWidth="3px" borderLeftColor="status.warning.text">
                      <Text fontSize="xs" color="status.warning.text" fontWeight="medium">{t('warningLine')}: {w.line}</Text>
                      <Text fontSize="xs" color="text.secondary" mt={0.5}>{w.reason}</Text>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Question Preview Cards */}
            {importPreview.success.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="text.secondary">{t('noPreviewData')}</Text>
              </Box>
            ) : (
              <Stack gap={3} px={6} pb={4} maxH="60vh" overflowY="auto">
                {importPreview.success.map((q, idx) => {
                  const dc = difficultyColor[q.difficulty] ?? { bg: 'status.warning.bg', color: 'status.warning.text' };
                  return (
                    <Box key={idx} bg="bg.subtle" borderRadius="lg" p={4} borderWidth="1px" borderColor="border.default">
                      <Flex justify="space-between" align="center" mb={2}>
                        <HStack gap={2}>
                          <Flex w={7} h={7} align="center" justify="center" borderRadius="full" bg="brand.subtle" color="brand.text" fontWeight="bold" fontSize="xs">
                            {idx + 1}
                          </Flex>
                          <Badge fontSize="xs" fontWeight="semibold" px={2} py={1} bg="brand.subtle" color="brand.text" borderRadius="full">
                            {typeLabel[q.type] ?? q.type}
                          </Badge>
                          <Badge fontSize="xs" fontWeight="semibold" px={2} py={1} bg={dc.bg} color={dc.color} borderRadius="full">
                            {q.difficulty}
                          </Badge>
                          <Badge fontSize="xs" fontWeight="semibold" px={2} py={1} bg="bg.surface" color="text.secondary" borderRadius="full">
                            {q.points} poin
                          </Badge>
                        </HStack>
                      </Flex>
                      <Box color="text.primary" fontSize="sm" mb={q.options.length > 0 ? 3 : 0} dangerouslySetInnerHTML={{ __html: q.content }} />
                      {q.options.length > 0 && (
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                          {q.options.map((opt, oi) => (
                            <Flex key={oi} p={2} borderWidth="1px" borderColor={opt.isCorrect ? 'status.success.text' : 'border.default'} bg={opt.isCorrect ? 'status.success.bg' : 'bg.surface'} borderRadius="md" align="center" gap={2}>
                              <Flex w={5} h={5} align="center" justify="center" borderRadius="full" fontSize="xs" fontWeight="bold" bg={opt.isCorrect ? 'status.success.text' : 'bg.subtle'} color={opt.isCorrect ? 'text.inverted' : 'text.secondary'}>
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
            <Flex gap={3} p={6} borderTopWidth="1px" borderColor="border.default" justify="flex-end">
              <Button variant="outline" borderRadius="lg" onClick={handleCancelPreview} cursor="pointer" borderColor="border.default">
                {t('cancelImport')}
              </Button>
              <Button
                bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg"
                onClick={handleConfirmImport}
                disabled={importPreview.totalParsed === 0 || importMutation.isPending}
                cursor="pointer"
              >
                {importMutation.isPending ? <Spinner size="sm" mr={2} /> : <CheckCircle2 size={18} />}
                {importMutation.isPending ? t('importingBtn') : `${t('confirmImport')} (${importPreview.totalParsed} soal)`}
              </Button>
            </Flex>
          </Box>
        )}

        {/* ─── Add Question Form ──────────────────────────────────────── */}
        {isAddingQuestion ? (
          <Box bg="bg.surface" borderRadius="card" shadow="sm" borderWidth="1px" borderColor="border.default" p={8}>
            <Heading size="lg" fontWeight="bold" mb={6} color="text.primary">{t('createNewQuestion')}</Heading>
            <QuestionForm
              onSubmit={(data) => createQuestionMutation.mutate(data)}
              onCancel={() => setIsAddingQuestion(false)}
              isSubmitting={createQuestionMutation.isPending}
            />
          </Box>
        ) : (
          <Stack gap={4}>
            {bank.questions.map((question, idx) => {
              const dc = difficultyColor[question.difficulty] ?? { bg: 'status.warning.bg', color: 'status.warning.text' };
              if (editingQuestionId === question.id) {
                return (
                  <Box key={question.id} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" p={6} shadow="card-dark">
                    <Heading size="md" fontWeight="bold" mb={6} color="text.primary">{t('editQuestionTitle')}</Heading>
                    <QuestionForm initialData={question} onSubmit={(data) => editQuestionMutation.mutate({ questionId: question.id, data })} onCancel={() => setEditingQuestionId(null)} isSubmitting={editQuestionMutation.isPending} />
                  </Box>
                );
              }
              return (
                <Box key={question.id} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" overflow="hidden" shadow="card-dark" _hover={{ shadow: 'elevated', borderColor: 'brand.muted' }} transition="all 0.15s">
                  <Box p={4}>
                    <Flex justify="space-between" align="flex-start" mb={3}>
                      <HStack gap={2}>
                        <Flex w={7} h={7} align="center" justify="center" borderRadius="sm" bg="brand.subtle" color="brand.text" fontWeight="bold" fontSize="xs">{idx + 1}</Flex>
                        <Badge fontSize="11px" fontWeight="semibold" px={2} py={0.5} bg="bg.subtle" color="text.secondary" borderRadius="sm">{typeLabel[question.type] ?? question.type}</Badge>
                        <Badge fontSize="11px" fontWeight="semibold" px={2} py={0.5} bg={dc.bg} color={dc.color} borderRadius="sm">{question.difficulty}</Badge>
                        <Badge fontSize="11px" fontWeight="semibold" px={2} py={0.5} bg="bg.subtle" color="text.secondary" borderRadius="sm">{question.points} poin</Badge>
                      </HStack>
                      <HStack gap={1}>
                        <IconButton variant="ghost" color="text.secondary" _hover={{ bg: 'bg.subtle' }} size="xs" borderRadius="sm" aria-label={t('editQuestionTitle')} onClick={() => setEditingQuestionId(question.id)} cursor="pointer"><Edit2 size={14} /></IconButton>
                        <IconButton variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} size="xs" borderRadius="sm" aria-label={t('deleteQuestionTitle')} onClick={async () => { const confirmed = await confirmDialog({ title: t('deleteQuestionTitle'), description: t('deleteQuestionDesc'), confirmText: t('deleteBtn') }); if (confirmed) deleteQuestionMutation.mutate(question.id); }} cursor="pointer"><Trash2 size={14} /></IconButton>
                      </HStack>
                    </Flex>
                    <Box color="text.primary" fontSize="sm" mb={3} dangerouslySetInnerHTML={{ __html: question.content }} />
                    {question.type !== 'ESSAY' && (
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
                        {question.options.map((option, optIdx) => (
                          <Flex key={option.id} p={2.5} borderWidth="1px" borderColor={option.isCorrect ? 'status.success.text' : 'border.default'} bg={option.isCorrect ? 'status.success.bg' : 'bg.surface'} borderRadius="md" align="center" gap={2}>
                            <Flex w={5} h={5} align="center" justify="center" borderRadius="sm" fontSize="10px" fontWeight="bold" bg={option.isCorrect ? 'status.success.text' : 'bg.subtle'} color={option.isCorrect ? 'text.inverted' : 'text.secondary'}>{String.fromCharCode(65 + optIdx)}</Flex>
                            <Text fontSize="sm" dangerouslySetInnerHTML={{ __html: option.content }} />
                          </Flex>
                        ))}
                      </SimpleGrid>
                    )}
                  </Box>
                  {question.mediaUrl && (
                    <Flex px={4} py={2} bg="bg.subtle" borderTopWidth="1px" borderColor="border.default" align="center" gap={2}>
                      <ImageIcon size={12} color="var(--chakra-colors-text-muted)" />
                      <Text fontSize="11px" color="text.muted">Ada media</Text>
                    </Flex>
                  )}
                </Box>
              );
            })}

            {/* Empty state */}
            {bank.questions.length === 0 && !importPreview && (
              <Box bg="bg.subtle" borderWidth="2px" borderStyle="dashed" borderColor="border.default" borderRadius="card" p={12} textAlign="center">
                <Flex display="inline-flex" p={4} bg="bg.surface" borderRadius="full" color="text.muted" mb={4}>
                  <HelpCircle size={32} />
                </Flex>
                <Heading size="md" fontWeight="medium" color="text.primary">{t('noQuestions')}</Heading>
                <Text color="text.secondary" mt={2}>{t('noQuestionsDesc')}</Text>
                <HStack justify="center" mt={6} gap={3}>
                  <Button variant="outline" borderColor="brand.subtle" color="brand.text" _hover={{ bg: 'brand.subtle' }} borderRadius="lg" onClick={handleDownloadTemplate} cursor="pointer">
                    <Download size={18} />
                    {t('downloadTemplate')}
                  </Button>
                  <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" onClick={() => setIsAddingQuestion(true)} cursor="pointer">
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
          <Box position="fixed" inset={0} bg="rgba(6,9,15,0.7)" backdropFilter="blur(6px)" display="flex" alignItems="center" justifyContent="center" zIndex={50}>
            <Box bg="bg.surface" borderRadius="lg" p={6} w="full" maxW="md" shadow="elevated" borderWidth="1px" borderColor="border.default">
              <Heading size="lg" fontWeight="bold" mb={6} color="text.primary">{t('editQbModal')}</Heading>
              <form onSubmit={(e) => { e.preventDefault(); updateBankMutation.mutate(bankFormData); }}>
                <Stack gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>{t('bankNameLabel')} <Box as="span" color="status.danger.text">*</Box></Text>
                    <Input required value={bankFormData.name} onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })} placeholder={t('bankNamePlaceholder')} borderRadius="lg" borderColor="border.default" bg="bg.surface" _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }} />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>{t('subjectLabel')} <Box as="span" color="status.danger.text">*</Box></Text>
                    <Select.Root collection={subjectOptions} value={bankFormData.subjectId ? [bankFormData.subjectId] : []} onValueChange={(details) => setBankFormData({ ...bankFormData, subjectId: details.value[0] || '' })} positioning={{ sameWidth: true }}>
                      <Select.HiddenSelect /><Select.Control><Select.Trigger borderRadius="lg"><Select.ValueText placeholder={t('selectSubject')} /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
                      <Select.Positioner><Select.Content>{subjectOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
                    </Select.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>{t('categoryLabel')}</Text>
                    <Input value={bankFormData.category} onChange={(e) => setBankFormData({ ...bankFormData, category: e.target.value })} placeholder={t('categoryPlaceholder')} borderRadius="lg" borderColor="border.default" bg="bg.surface" _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }} />
                  </Box>
                  <Separator />
                  <Flex gap={3} pt={2}>
                    <Button type="button" onClick={() => setIsEditingBank(false)} flex={1} variant="outline" borderRadius="lg" fontWeight="medium" cursor="pointer" borderColor="border.default">{t('cancelBtn')}</Button>
                    <Button type="submit" flex={1} bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" fontWeight="medium" cursor="pointer" disabled={updateBankMutation.isPending}>{updateBankMutation.isPending ? t('creatingBtn') : t('saveBtn')}</Button>
                  </Flex>
                </Stack>
              </form>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
