'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ChevronLeft, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Input,
  Textarea,
  SimpleGrid,
  Checkbox,
  IconButton,
  HStack,
  Badge,
  Spinner,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';

interface Subject {
  id: string;
  name: string;
}

interface QuestionBank {
  id: string;
  name: string;
  subjectId: string;
}

interface ExamGroup {
  id: string;
  name: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  points: number;
}

interface EditExamPageProps {
  params: Promise<{ id: string }>;
}

export default function EditExamPage({ params }: EditExamPageProps) {
  const { id: examId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    startDate: '',
    startTimeField: '00:00',
    endDate: '',
    endTimeField: '23:49',
    duration: 60,
    token: '',
    maxAttempts: 1,
    randomizeSoal: true,
    randomizeOpsi: true,
    passingGrade: 0,
    status: 'DRAFT',
    examGroupId: '',
    sebConfigKey: '',
    sebBrowserKey: '',
    requireSeb: false,
    blockKeyCopyPaste: false,
    forceFullscreen: false,
    maxViolations: 0,
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const token = useAuthStore((state) => state.access_token);

  // Fetch the current exam details
  // staleTime:0 + gcTime:0 memastikan data selalu fresh dari DB setiap kali halaman dibuka
  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ['exam-edit', examId],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}`);
      return response.data;
    },
    enabled: !!token && !!examId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch static data
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const { data: examGroups } = useQuery<ExamGroup[]>({
    queryKey: ['exam-groups'],
    queryFn: async () => {
      const response = await api.get('/exam-groups');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const { data: questionBanks } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks', formData.subjectId],
    queryFn: async () => {
      const response = await api.get('/question-banks');
      const banks = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return banks.filter((b: any) => b.subjectId === formData.subjectId);
    },
    enabled: !!formData.subjectId,
  });

  const examGroupOptions = createListCollection({
    items: examGroups?.map((group) => ({ label: group.name, value: group.id })) || [],
  });

  const subjectOptions = createListCollection({
    items: subjects?.map((subject) => ({ label: subject.name, value: subject.id })) || [],
  });

  const questionBankOptions = createListCollection({
    items: questionBanks?.map((bank) => ({ label: bank.name, value: bank.id })) || [],
  });

  const statusOptions = createListCollection({
    items: [
      { label: 'DRAFT', value: 'DRAFT' },
      { label: 'PUBLISHED', value: 'PUBLISHED' },
      { label: 'ONGOING', value: 'ONGOING' },
      { label: 'COMPLETED', value: 'COMPLETED' },
    ],
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['questions', selectedBankId],
    queryFn: async () => {
      const response = await api.get(`/question-banks/${selectedBankId}`);
      return response.data.questions;
    },
    enabled: !!selectedBankId,
  });

  // Populate form with existing exam details
  useEffect(() => {
    if (exam) {
      const toLocalDateString = (dateStr: string) => {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const toLocalTimeString = (dateStr: string) => {
        const d = new Date(dateStr);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        subjectId: exam.subjectId || '',
        startDate: exam.startTime ? toLocalDateString(exam.startTime) : '',
        startTimeField: exam.startTime ? toLocalTimeString(exam.startTime) : '00:00',
        endDate: exam.endTime ? toLocalDateString(exam.endTime) : '',
        endTimeField: exam.endTime ? toLocalTimeString(exam.endTime) : '23:49',
        duration: exam.duration ?? 60,
        token: exam.token || '',
        maxAttempts: exam.maxAttempts ?? 1,
        randomizeSoal: exam.randomizeSoal ?? true,
        randomizeOpsi: exam.randomizeOpsi ?? true,
        passingGrade: exam.passingGrade ?? 0,
        status: exam.status || 'DRAFT',
        examGroupId: exam.examGroupId || '',
        sebConfigKey: exam.sebConfigKey || '',
        sebBrowserKey: exam.sebBrowserKey || '',
        requireSeb: exam.requireSeb ?? false,
        blockKeyCopyPaste: exam.blockKeyCopyPaste ?? false,
        forceFullscreen: exam.forceFullscreen ?? false,
        maxViolations: exam.maxViolations ?? 0,
      });
      
      if (exam.examQuestions) {
        setSelectedQuestionIds(exam.examQuestions.map((eq: any) => eq.questionId));
      }
    }
  }, [exam]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/exams/${examId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-edit', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Ujian berhasil diperbarui!');
      router.push('/admin/exams');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui ujian');
    },
  });

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      toast.error('Pilih minimal satu soal.');
      return;
    }

    // Payload eksplisit — boolean di-cast agar tidak pernah jadi string
    const payload: Record<string, any> = {
      title: formData.title,
      description: formData.description,
      subjectId: formData.subjectId,
      examGroupId: formData.examGroupId || null,
      startTime: `${formData.startDate}T${formData.startTimeField}:00`,
      endTime: `${formData.endDate}T${formData.endTimeField}:00`,
      duration: Number(formData.duration),
      token: formData.token || null,
      maxAttempts: Number(formData.maxAttempts) || 1,
      passingGrade: Number(formData.passingGrade) || 0,
      maxViolations: Number(formData.maxViolations) || 0,
      status: formData.status,
      // ⬇ boolean eksplisit — ini kunci utama agar nilai selalu tersimpan benar
      randomizeSoal: Boolean(formData.randomizeSoal),
      randomizeOpsi: Boolean(formData.randomizeOpsi),
      requireSeb: Boolean(formData.requireSeb),
      blockKeyCopyPaste: Boolean(formData.blockKeyCopyPaste),
      forceFullscreen: Boolean(formData.forceFullscreen),
      // SEB keys hanya dikirim jika requireSeb aktif
      sebConfigKey: formData.requireSeb ? (formData.sebConfigKey?.trim() || undefined) : undefined,
      sebBrowserKey: formData.requireSeb ? (formData.sebBrowserKey?.trim() || undefined) : undefined,
      questionIds: selectedQuestionIds,
    };

    if (!payload.requireSeb) {
      delete payload.sebConfigKey;
      delete payload.sebBrowserKey;
    }

    updateMutation.mutate(payload);
  };

  if (isLoadingExam) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat data ujian...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6} maxW="5xl" mx="auto">
      <Flex align="center" justify="space-between">
        <HStack gap={4}>
          <IconButton
            asChild
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
            borderRadius="full"
            aria-label="Kembali ke Daftar Ujian"
            size="sm"
          >
            <Link href="/admin/exams">
              <ChevronLeft size={24} />
            </Link>
          </IconButton>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Edit Jadwal Ujian
          </Heading>
        </HStack>
      </Flex>

      <form onSubmit={handleSubmit}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8}>
          {/* Left Column — Exam Info + Questions */}
          <Box gridColumn={{ lg: 'span 2' }}>
            <Stack gap={6}>
              {/* Exam Information Card */}
              <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
                <Heading size="md" fontWeight="bold" color="gray.900" borderBottom="1px solid" borderColor="gray.100" pb={2} mb={4}>
                  Informasi Ujian
                </Heading>
                <Stack gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Judul Ujian</Text>
                    <Input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Cth. Ujian Tengah Semester Matematika"
                      borderRadius="lg"
                      borderColor="gray.200"
                      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Deskripsi</Text>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Deskripsi opsional..."
                      borderRadius="lg"
                      borderColor="gray.200"
                      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Event / Kelompok Ujian <span style={{ color: 'red' }}>*</span></Text>
                    <Select.Root
                      collection={examGroupOptions}
                      value={formData.examGroupId ? [formData.examGroupId] : []}
                      onValueChange={(details) => setFormData({ ...formData, examGroupId: details.value[0] || '' })}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="-- Pilih Event Ujian --" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                          <Select.ClearTrigger />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {examGroupOptions.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>
                  <SimpleGrid columns={2} gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Mata Pelajaran</Text>
                      <Select.Root
                        collection={subjectOptions}
                        value={formData.subjectId ? [formData.subjectId] : []}
                        onValueChange={(details) => setFormData({ ...formData, subjectId: details.value[0] || '' })}
                        positioning={{ sameWidth: true }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="Pilih Mata Pelajaran" />
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
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Durasi (Menit)</Text>
                      <Input
                        type="number"
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                  </SimpleGrid>
                  <SimpleGrid columns={2} gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Tanggal Mulai</Text>
                      <Input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Waktu Mulai</Text>
                      <Input
                        type="time"
                        required
                        value={formData.startTimeField}
                        onChange={(e) => setFormData({ ...formData, startTimeField: e.target.value })}
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                  </SimpleGrid>
                  <SimpleGrid columns={2} gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Tanggal Berakhir</Text>
                      <Input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Waktu Berakhir</Text>
                      <Input
                        type="time"
                        required
                        value={formData.endTimeField}
                        onChange={(e) => setFormData({ ...formData, endTimeField: e.target.value })}
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                  </SimpleGrid>
                </Stack>
              </Box>

              {/* Select Questions Card */}
              <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
                <Heading size="md" fontWeight="bold" color="gray.900" borderBottom="1px solid" borderColor="gray.100" pb={2} mb={4}>
                  Pilih Soal
                </Heading>

                {!formData.subjectId ? (
                  <Flex justify="center" py={8}>
                    <Text color="gray.500">Pilih mata pelajaran terlebih dahulu untuk melihat soal.</Text>
                  </Flex>
                ) : (
                  <Stack gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Bank Soal</Text>
                      <Select.Root
                        collection={questionBankOptions}
                        value={selectedBankId ? [selectedBankId] : []}
                        onValueChange={(details) => setSelectedBankId(details.value[0] || '')}
                        positioning={{ sameWidth: true }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="-- Pilih Bank Soal --" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                            <Select.ClearTrigger />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content>
                            {questionBankOptions.items.map((item) => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Box>

                    {selectedBankId && (
                      <Stack gap={3} maxH="sm" overflowY="auto" p={2} border="1px solid" borderColor="gray.100" borderRadius="lg">
                        {questions?.map((q) => {
                          const isChecked = selectedQuestionIds.includes(q.id);
                          return (
                            <Flex
                              key={q.id}
                              align="center"
                              justify="space-between"
                              p={2.5}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={isChecked ? 'indigo.100' : 'gray.100'}
                              bg={isChecked ? 'indigo.50/30' : 'transparent'}
                            >
                              <HStack gap={3} flex={1}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleQuestion(q.id)}
                                  style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                                />
                                <Box>
                                  <Text fontSize="xs" fontWeight="semibold" color="gray.800" lineClamp={2}>
                                    {q.content.replace(/<[^>]*>/g, '')}
                                  </Text>
                                  <Text fontSize="2xs" color="gray.450" mt={0.5}>
                                    Tipe: {q.type} • Poin: {q.points}
                                  </Text>
                                </Box>
                              </HStack>
                            </Flex>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Right Column — Advanced Settings */}
          <Box>
            <Stack gap={6}>
              <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
                <Heading size="md" fontWeight="bold" color="gray.900" borderBottom="1px solid" borderColor="gray.100" pb={2} mb={4}>
                  Pengaturan Lanjutan
                </Heading>
                <Stack gap={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Token Ujian (Opsional)</Text>
                    <Input
                      value={formData.token}
                      onChange={(e) => setFormData({ ...formData, token: e.target.value.toUpperCase() })}
                      placeholder="Cth. MAT2A"
                      borderRadius="lg"
                      borderColor="gray.200"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Kriteria Kelulusan Minimal (KKM)</Text>
                    <Input
                      type="number"
                      value={formData.passingGrade}
                      onChange={(e) => setFormData({ ...formData, passingGrade: parseInt(e.target.value) || 0 })}
                      borderRadius="lg"
                      borderColor="gray.200"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Batas Percobaan Pengerjaan</Text>
                    <Input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                      borderRadius="lg"
                      borderColor="gray.200"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Status Publikasi</Text>
                    <Select.Root
                      collection={statusOptions}
                      value={[formData.status]}
                      onValueChange={(details) => setFormData({ ...formData, status: details.value[0] })}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Pilih status" />
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

                  <Stack gap={3}>
                    <Flex as="label" align="center" gap={3} cursor="pointer">
                      <input
                        type="checkbox"
                        checked={formData.randomizeSoal}
                        onChange={(e) => setFormData({ ...formData, randomizeSoal: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                      />
                      <Text fontSize="sm" color="gray.700">Acak Urutan Soal</Text>
                    </Flex>
                    <Flex as="label" align="center" gap={3} cursor="pointer">
                      <input
                        type="checkbox"
                        checked={formData.randomizeOpsi}
                        onChange={(e) => setFormData({ ...formData, randomizeOpsi: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                      />
                      <Text fontSize="sm" color="gray.700">Acak Urutan Opsi</Text>
                    </Flex>

                    <Flex as="label" align="center" gap={3} cursor="pointer">
                      <input
                        type="checkbox"
                        checked={formData.requireSeb}
                        onChange={(e) => setFormData({ ...formData, requireSeb: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                      />
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">Wajibkan Safe Exam Browser</Text>
                    </Flex>
                    {formData.requireSeb && (
                      <Stack gap={2.5} pl={7} className="animate-fade-in">
                        <Box>
                          <Text fontSize="2xs" fontWeight="semibold" color="gray.500" mb={1}>Kunci Konfigurasi SEB (Opsional)</Text>
                          <Input
                            size="xs"
                            value={formData.sebConfigKey}
                            onChange={(e) => setFormData({ ...formData, sebConfigKey: e.target.value })}
                            placeholder="Config Key"
                            borderRadius="md"
                          />
                        </Box>
                        <Box>
                          <Text fontSize="2xs" fontWeight="semibold" color="gray.500" mb={1}>Kunci Browser SEB (Opsional)</Text>
                          <Input
                            size="xs"
                            value={formData.sebBrowserKey}
                            onChange={(e) => setFormData({ ...formData, sebBrowserKey: e.target.value })}
                            placeholder="Browser Key"
                            borderRadius="md"
                          />
                        </Box>
                      </Stack>
                    )}

                    <Flex as="label" align="center" gap={3} cursor="pointer">
                      <input
                        type="checkbox"
                        checked={formData.blockKeyCopyPaste}
                        onChange={(e) => setFormData({ ...formData, blockKeyCopyPaste: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                      />
                      <Text fontSize="sm" color="gray.700">Proteksi Keyboard & Mouse (Klik Kanan, Copy-Paste, DevTools)</Text>
                    </Flex>
                    <Flex as="label" align="center" gap={3} cursor="pointer">
                      <input
                        type="checkbox"
                        checked={formData.forceFullscreen}
                        onChange={(e) => setFormData({ ...formData, forceFullscreen: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                      />
                      <Text fontSize="sm" color="gray.700">Wajibkan Layar Penuh (Forced Fullscreen)</Text>
                    </Flex>
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={1}>Batas Maksimum Pelanggaran (0 untuk Tidak Terbatas)</Text>
                      <Input
                        type="number"
                        size="sm"
                        w="20"
                        value={formData.maxViolations}
                        onChange={(e) => setFormData({ ...formData, maxViolations: parseInt(e.target.value) || 0 })}
                        borderRadius="md"
                      />
                    </Box>
                  </Stack>

                  <Box pt={4} borderTop="1px solid" borderColor="gray.100" mt={4}>
                    <Flex justify="space-between" fontSize="sm" mb={4}>
                      <Text color="gray.500">Soal Terpilih:</Text>
                      <Text fontWeight="bold" color="gray.900">{selectedQuestionIds.length} Soal</Text>
                    </Flex>
                    <Button
                      type="submit"
                      w="full"
                      bg="indigo.600"
                      color="white"
                      _hover={{ bg: 'indigo.700' }}
                      borderRadius="xl"
                      gap={2}
                      cursor="pointer"
                      loading={updateMutation.isPending}
                    >
                      <Save size={18} />
                      Simpan Perubahan
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </SimpleGrid>
      </form>
    </Stack>
  );
}
