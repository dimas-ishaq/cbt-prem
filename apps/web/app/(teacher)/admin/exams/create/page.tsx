'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ChevronLeft, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
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
} from '@chakra-ui/react';

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

export default function CreateExamPage() {
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
    blockKeyCopyPaste: false,
    forceFullscreen: false,
    maxViolations: 0,
  });

  const [requireSeb, setRequireSeb] = useState(false);

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return response.data;
    },
  });

  const { data: examGroups } = useQuery<ExamGroup[]>({
    queryKey: ['exam-groups'],
    queryFn: async () => {
      const response = await api.get('/exam-groups');
      return response.data;
    },
  });

  const { data: questionBanks } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks', formData.subjectId],
    queryFn: async () => {
      const response = await api.get('/question-banks');
      return response.data.filter((b: any) => b.subjectId === formData.subjectId);
    },
    enabled: !!formData.subjectId,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['questions', selectedBankId],
    queryFn: async () => {
      const response = await api.get(`/question-banks/${selectedBankId}`);
      return response.data.questions;
    },
    enabled: !!selectedBankId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/exams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      router.push('/admin/exams');
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
      alert('Pilih minimal satu soal.');
      return;
    }
    
    // Clean up empty optional fields
    const payload = {
      ...formData,
      questionIds: selectedQuestionIds,
      startTime: `${formData.startDate}T${formData.startTimeField}:00`,
      endTime: `${formData.endDate}T${formData.endTimeField}:00`,
      sebConfigKey: requireSeb ? formData.sebConfigKey : null,
      sebBrowserKey: requireSeb ? formData.sebBrowserKey : null,
      maxViolations: parseInt(formData.maxViolations as any) || 0,
    };
    
    // Remove UI-only fields
    delete (payload as any).startDate;
    delete (payload as any).startTimeField;
    delete (payload as any).endDate;
    delete (payload as any).endTimeField;
    
    if (!payload.examGroupId) delete (payload as any).examGroupId;
    
    createMutation.mutate(payload);
  };

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
            Jadwalkan Ujian Baru
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
                    <select
                      required
                      value={formData.examGroupId}
                      onChange={(e) => setFormData({ ...formData, examGroupId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        outline: 'none',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">-- Pilih Event Ujian --</option>
                      {examGroups?.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {examGroups?.length === 0 && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        Anda belum memiliki Event Ujian. Silakan buat di menu Event Ujian terlebih dahulu.
                      </Text>
                    )}
                  </Box>
                  <SimpleGrid columns={2} gap={4}>
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Mata Pelajaran</Text>
                      <select
                        required
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          outline: 'none',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Pilih Mata Pelajaran</option>
                        {subjects?.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
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
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          outline: 'none',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Pilih Bank Soal</option>
                        {questionBanks?.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </Box>

                    {selectedBankId && (
                      <Box maxH="96" overflowY="auto" borderWidth="1px" borderRadius="lg" borderColor="gray.200">
                        {questions?.map((q) => (
                          <Flex
                            key={q.id}
                            p={4}
                            align="flex-start"
                            gap={3}
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            bg={selectedQuestionIds.includes(q.id) ? 'indigo.50' : 'transparent'}
                            borderBottom="1px solid"
                            borderColor="gray.100"
                            transition="background 0.1s"
                            onClick={() => toggleQuestion(q.id)}
                          >
                            <Flex
                              mt={1}
                              flexShrink={0}
                              w={5}
                              h={5}
                              borderWidth="2px"
                              borderRadius="sm"
                              align="center"
                              justify="center"
                              bg={selectedQuestionIds.includes(q.id) ? 'indigo.600' : 'transparent'}
                              borderColor={selectedQuestionIds.includes(q.id) ? 'indigo.600' : 'gray.300'}
                              color="white"
                            >
                              {selectedQuestionIds.includes(q.id) && <CheckCircle2 size={14} />}
                            </Flex>
                            <Box flex={1}>
                              <Box
                                fontSize="sm"
                                fontWeight="medium"
                                color="gray.900"
                                lineClamp={2}
                                dangerouslySetInnerHTML={{ __html: q.content }}
                              />
                              <HStack gap={2} mt={1}>
                                <Text fontSize="xs" color="gray.500">{q.type}</Text>
                                <Text fontSize="xs" color="gray.500">{q.points} pts</Text>
                              </HStack>
                            </Box>
                          </Flex>
                        ))}
                        {questions?.length === 0 && (
                          <Flex justify="center" p={8}>
                            <Text color="gray.500">Tidak ada soal di bank ini.</Text>
                          </Flex>
                        )}
                      </Box>
                    )}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Right Column — Settings & Submit */}
          <Box>
            <Box
              bg="white"
              p={6}
              borderRadius="xl"
              shadow="sm"
              borderWidth="1px"
              borderColor="gray.100"
              position="sticky"
              top="6rem"
            >
              <Heading size="md" fontWeight="bold" color="gray.900" borderBottom="1px solid" borderColor="gray.100" pb={2} mb={4}>
                Pengaturan Ujian
              </Heading>

              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Token Ujian (Opsional)</Text>
                  <Input
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    placeholder="e.g. ABCXYZ"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>


                <Stack gap={3}>
                  <Flex
                    as="label"
                    align="center"
                    gap={3}
                    cursor="pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.randomizeSoal}
                      onChange={(e) => setFormData({ ...formData, randomizeSoal: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <Text fontSize="sm" color="gray.700">Acak Urutan Soal</Text>
                  </Flex>
                  <Flex
                    as="label"
                    align="center"
                    gap={3}
                    cursor="pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.randomizeOpsi}
                      onChange={(e) => setFormData({ ...formData, randomizeOpsi: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <Text fontSize="sm" color="gray.700">Acak Urutan Opsi</Text>
                  </Flex>
                  <Flex
                    as="label"
                    align="center"
                    gap={3}
                    cursor="pointer"
                  >
                    <input
                      type="checkbox"
                      checked={requireSeb}
                      onChange={(e) => setRequireSeb(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">Wajibkan Safe Exam Browser</Text>
                  </Flex>
                  {requireSeb && (
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
                  <Flex
                    as="label"
                    align="center"
                    gap={3}
                    cursor="pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.blockKeyCopyPaste}
                      onChange={(e) => setFormData({ ...formData, blockKeyCopyPaste: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
                    />
                    <Text fontSize="sm" color="gray.700">Proteksi Keyboard & Mouse (Blokir Klik Kanan, Salin-Tempel, DevTools)</Text>
                  </Flex>
                  <Flex
                    as="label"
                    align="center"
                    gap={3}
                    cursor="pointer"
                  >
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

                <Box pt={4} borderTop="1px solid" borderColor="gray.100">
                  <Flex justify="space-between" fontSize="sm" mb={4}>
                    <Text color="gray.500">Soal Terpilih:</Text>
                    <Text fontWeight="bold" color="gray.900">{selectedQuestionIds.length}</Text>
                  </Flex>
                  <Button
                    type="submit"
                    w="full"
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    fontWeight="bold"
                    py={3}
                    disabled={createMutation.isPending}
                    cursor="pointer"
                  >
                    <Save size={20} />
                    {createMutation.isPending ? 'Menyimpan...' : 'Jadwalkan Ujian'}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>
        </SimpleGrid>
      </form>
    </Stack>
  );
}
