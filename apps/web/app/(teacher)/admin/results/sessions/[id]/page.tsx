'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Save, 
  RotateCcw, 
  Clock, 
  User, 
  BookOpen, 
  AlertTriangle,
  Download
} from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Stack,
  HStack,
  Input,
  Spinner,
  IconButton,
  SimpleGrid,
  Grid,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');

  const { data: session, isLoading } = useQuery({
    queryKey: ['session-detail', id],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/${id}`);
      return response.data;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ answerId, score }: { answerId: string, score: number }) => {
      return api.patch(`/exam-sessions/answers/${answerId}/grade`, { score });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-detail', id] });
      toast.success('Skor berhasil diperbarui');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui skor');
    }
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/exam-sessions/${id}/reset`);
    },
    onSuccess: () => {
      toast.success('Pengerjaan siswa berhasil di-reset');
      router.push(`/admin/results/${session.examId}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal me-reset pengerjaan');
    }
  });

  const handleReset = () => {
    setResetConfirmationInput('');
    setIsResetModalOpen(true);
  };

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="60vh">
        <Spinner size="xl" color="indigo.600" />
        <Text color="gray.500" mt={4} fontWeight="medium">Memuat detail lembar jawaban...</Text>
      </Flex>
    );
  }

  if (!session) {
    return (
      <Flex direction="column" align="center" justify="center" minH="60vh" p={6} textAlign="center">
        <AlertTriangle size={48} className="text-red-500" style={{ marginBottom: '16px' }} />
        <Heading size="md" fontWeight="bold" color="gray.950" mb={2}>Sesi Ujian Tidak Ditemukan</Heading>
        <Text color="gray.500" mb={6}>Sesi lembar jawaban siswa mungkin telah dihapus atau link tidak valid.</Text>
        <Link href="/admin/exams" passHref>
          <Button bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg">Kembali ke Daftar Ujian</Button>
        </Link>
      </Flex>
    );
  }

  // Calculate statistics
  const totalQuestions = session.answers?.length || 0;
  const correctCount = session.answers?.filter((a: any) => a.isCorrect === true).length || 0;
  const incorrectCount = session.answers?.filter((a: any) => a.isCorrect === false).length || 0;
  const essayCount = session.answers?.filter((a: any) => a.question?.type === 'ESSAY').length || 0;

  const timeStart = session.startTime ? new Date(session.startTime) : null;
  const timeEnd = session.endTime ? new Date(session.endTime) : null;
  const timeSpent = (timeStart && timeEnd) 
    ? `${Math.round((timeEnd.getTime() - timeStart.getTime()) / 60000)} menit`
    : 'Sedang berjalan / belum selesai';

  return (
    <Stack gap={6} p={2}>
      {/* Header bar */}
      <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={4} pb={4} borderBottom="1px solid" borderColor="gray.100">
        <Flex align="center" gap={4}>
          <Link href={`/admin/results/${session.examId}`} passHref className="no-print">
            <Button variant="ghost" p={2} borderRadius="xl" border="1px solid" borderColor="gray.200" cursor="pointer" bg="white" _hover={{ bg: 'gray.50' }}>
              <ChevronLeft size={20} />
            </Button>
          </Link>
          <Box>
            <Heading size="xl" fontWeight="black" color="gray.900" letterSpacing="tight">
              Lembar Jawaban Siswa
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={0.5} className="no-print">
              Evaluasi jawaban mandiri dan rekap nilai hasil ujian.
            </Text>
          </Box>
        </Flex>

        <HStack gap={3} className="no-print">
          <Button
            onClick={() => window.print()}
            variant="solid"
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="xl"
            fontWeight="semibold"
            size="md"
            cursor="pointer"
            gap={2}
          >
            <Download size={16} />
            Cetak / Unduh PDF
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            borderColor="red.200"
            color="red.600"
            _hover={{ bg: 'red.50', borderColor: 'red.300' }}
            borderRadius="xl"
            fontWeight="semibold"
            size="md"
            cursor="pointer"
            loading={resetMutation.isPending}
            gap={2}
          >
            <RotateCcw size={16} />
            Reset Pengerjaan
          </Button>
        </HStack>
      </Flex>

      {/* Overview stats cards */}
      <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
        {/* Left Side: Score & Status Card */}
        <Flex bg="white" border="1px solid" borderColor="gray.100" borderRadius="2xl" shadow="sm" p={6} flexDirection="column" justify="center" align="center" position="relative" overflow="hidden" className="print-card">
          <Box position="absolute" top={0} left={0} right={0} h="4px" bg="indigo.600" className="no-print" />
          <Text fontSize="2xs" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb={2}>TOTAL NILAI AKHIR</Text>
          <Heading fontSize="6xl" fontWeight="black" color="indigo.600" lineHeight="1">{session.score ?? '--'}</Heading>
          <Box mt={4} mb={2}>
            <Badge colorPalette={session.status === 'SUBMITTED' ? 'green' : 'yellow'} fontSize="xs" fontWeight="extrabold" px={3} py={1} borderRadius="full">
              {session.status}
            </Badge>
          </Box>
          <Text fontSize="xs" color="gray.400" mt={2} textAlign="center" className="no-print">
            Dinilai otomatis oleh sistem untuk Pilihan Ganda & Multi-respons.
          </Text>
        </Flex>

        {/* Right Side: Details Card */}
        <Box bg="white" border="1px solid" borderColor="gray.100" borderRadius="2xl" shadow="sm" p={6} className="print-card">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Stack gap={4}>
              <HStack gap={3}>
                <Flex w={8} h={8} borderRadius="lg" bg="indigo.50" align="center" justify="center" color="indigo.600" className="no-print">
                  <User size={16} />
                </Flex>
                <Box>
                  <Text fontSize="2xs" color="gray.400" fontWeight="bold" textTransform="uppercase">Nama Siswa</Text>
                  <Text fontWeight="semibold" color="gray.800" fontSize="sm">{session.student.user.fullName}</Text>
                  <Text fontSize="2xs" color="gray.500">NIS: {session.student.nis}</Text>
                </Box>
              </HStack>

              <HStack gap={3}>
                <Flex w={8} h={8} borderRadius="lg" bg="indigo.50" align="center" justify="center" color="indigo.600" className="no-print">
                  <BookOpen size={16} />
                </Flex>
                <Box>
                  <Text fontSize="2xs" color="gray.400" fontWeight="bold" textTransform="uppercase">Mata Pelajaran & Ujian</Text>
                  <Text fontWeight="semibold" color="gray.800" fontSize="sm">{session.exam.title}</Text>
                  <Text fontSize="2xs" color="gray.500">{session.exam.subject.name}</Text>
                </Box>
              </HStack>
            </Stack>

            <Stack gap={4}>
              <HStack gap={3}>
                <Flex w={8} h={8} borderRadius="lg" bg="indigo.50" align="center" justify="center" color="indigo.600" className="no-print">
                  <Clock size={16} />
                </Flex>
                <Box>
                  <Text fontSize="2xs" color="gray.400" fontWeight="bold" textTransform="uppercase">Durasi Pengerjaan</Text>
                  <Text fontWeight="semibold" color="gray.800" fontSize="sm">{timeSpent}</Text>
                  <Text fontSize="2xs" color="gray.500">
                    Mulai: {session.startTime ? new Date(session.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </Text>
                </Box>
              </HStack>

              <HStack gap={3}>
                <Flex w={8} h={8} borderRadius="lg" bg="indigo.50" align="center" justify="center" color="indigo.600" className="no-print">
                  <CheckCircle2 size={16} />
                </Flex>
                <Box>
                  <Text fontSize="2xs" color="gray.400" fontWeight="bold" textTransform="uppercase">Statistik Soal</Text>
                  <HStack gap={2} mt={0.5}>
                    <Badge colorPalette="green" variant="subtle" size="sm">{correctCount} Benar</Badge>
                    <Badge colorPalette="red" variant="subtle" size="sm">{incorrectCount} Salah</Badge>
                    {essayCount > 0 && <Badge colorPalette="purple" variant="subtle" size="sm">{essayCount} Esai</Badge>}
                    <Text fontSize="2xs" color="gray.400">dari {totalQuestions} soal</Text>
                  </HStack>
                </Box>
              </HStack>
            </Stack>
          </SimpleGrid>
        </Box>
      </Grid>

      {/* Answer List Section */}
      <Heading size="md" fontWeight="bold" color="gray.800" mt={4} mb={1}>
        Daftar Jawaban Soal
      </Heading>

      <Stack gap={6} pb={16}>
        {session.answers.map((answer: any, idx: number) => {
          const question = answer.question;
          const isEssay = question.type === 'ESSAY';
          
          return (
            <Box key={answer.id} bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden" transition="border 0.2s" _hover={{ borderColor: 'gray.200' }} className="print-card">
              <Box p={6}>
                {/* Info row */}
                <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Flex w={8} h={8} borderRadius="xl" bg="indigo.50" align="center" justify="center" color="indigo.700" fontWeight="black" fontSize="sm">
                      {idx + 1}
                    </Flex>
                    <Badge colorPalette="blue" variant="solid" fontSize="2xs" fontWeight="bold" px={2.5} py={0.5} borderRadius="md">
                      {question.type}
                    </Badge>
                    {answer.isCorrect !== null && (
                      <Badge
                        colorPalette={answer.isCorrect ? 'green' : 'red'}
                        fontSize="2xs"
                        fontWeight="bold"
                        px={3}
                        py={1}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                      >
                        {answer.isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <Text>{answer.isCorrect ? 'Benar' : 'Salah'}</Text>
                      </Badge>
                    )}
                  </HStack>

                  {/* Manual Grading */}
                  <HStack gap={3}>
                    <HStack gap={2} bg="gray.50" px={3} py={1.5} borderRadius="xl" borderWidth="1px" borderColor="gray.250" className="print-card">
                      <Text fontSize="2xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Skor Soal:</Text>
                      <Input
                        type="number"
                        step="any"
                        defaultValue={answer.score || 0}
                        onChange={(e) => setEditingScores(prev => ({ ...prev, [answer.id]: parseFloat(e.target.value) }))}
                        w={14}
                        h={7}
                        textAlign="center"
                        fontSize="xs"
                        fontWeight="extrabold"
                        borderRadius="md"
                        bg="white"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500' }}
                        p={1}
                        className="no-print"
                      />
                      {/* For printing, show read-only score */}
                      <Text className="print-score-only" fontSize="xs" fontWeight="bold" color="indigo.600" display="none">{answer.score || 0}</Text>
                      <Text color="gray.400" fontSize="xs" fontWeight="medium">/ {question.points} Poin</Text>
                    </HStack>
                    {(editingScores[answer.id] !== undefined && editingScores[answer.id] !== answer.score) && (
                      <IconButton
                        aria-label="Save Score"
                        colorPalette="indigo"
                        size="sm"
                        borderRadius="lg"
                        onClick={() => gradeMutation.mutate({ answerId: answer.id, score: editingScores[answer.id]! })}
                        cursor="pointer"
                        className="no-print"
                      >
                        <Save size={14} />
                      </IconButton>
                    )}
                  </HStack>
                </Flex>

                {/* Question Content */}
                <Box
                  className="question-content"
                  fontSize="sm"
                  color="gray.800"
                  fontWeight="semibold"
                  lineHeight="relaxed"
                  mb={6}
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />

                {/* Student's Answer */}
                <Box p={4} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.100" className="print-card">
                  <Text fontSize="2xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={3}>
                    JAWABAN SISWA:
                  </Text>
                  
                  {isEssay ? (
                    <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" lineHeight="relaxed" fontWeight="medium">
                      {answer.essayAnswer || <span className="italic text-gray-400">Tidak ada jawaban yang dikirimkan.</span>}
                    </Text>
                  ) : (
                    <Stack gap={2.5}>
                      {question.options.map((opt: any) => {
                        const isSelected = answer.selectedOption?.split(',').includes(opt.id);
                        
                        let optionBg = 'transparent';
                        let optionBorder = '1px solid';
                        let optionBorderColor = 'gray.200';
                        let badgeText = '';
                        let badgeColor = '';

                        if (isSelected) {
                          if (opt.isCorrect) {
                            optionBg = 'green.50';
                            optionBorderColor = 'green.350';
                            badgeText = 'Jawaban Siswa (Benar)';
                            badgeColor = 'green';
                          } else {
                            optionBg = 'red.50';
                            optionBorderColor = 'red.350';
                            badgeText = 'Jawaban Siswa (Salah)';
                            badgeColor = 'red';
                          }
                        } else if (opt.isCorrect) {
                          optionBg = 'green.50/40';
                          optionBorderColor = 'green.200';
                          badgeText = 'Kunci Jawaban';
                          badgeColor = 'green';
                        }

                        return (
                          <Flex 
                            key={opt.id} 
                            align="center" 
                            justify="space-between" 
                            p={3} 
                            bg={optionBg} 
                            border={optionBorder} 
                            borderColor={optionBorderColor} 
                            borderRadius="xl"
                            gap={3}
                            className="print-card"
                          >
                            <HStack gap={3} flex={1}>
                              <Flex
                                w={4}
                                h={4}
                                borderRadius="full"
                                border="1.5px solid"
                                align="center"
                                justify="center"
                                borderColor={isSelected ? 'indigo.500' : 'gray.400'}
                                bg={isSelected ? 'indigo.500' : 'transparent'}
                                flexShrink={0}
                              >
                                {isSelected && <Box w={1.5} h={1.5} bg="white" borderRadius="full" />}
                              </Flex>
                              <Box
                                fontSize="xs"
                                fontWeight={opt.isCorrect ? 'bold' : 'medium'}
                                color={opt.isCorrect ? 'green.800' : 'gray.750'}
                                dangerouslySetInnerHTML={{ __html: opt.content }}
                              />
                            </HStack>

                            {badgeText && (
                              <Badge colorPalette={badgeColor} size="sm" variant="subtle" borderRadius="md">
                                {badgeText}
                              </Badge>
                            )}
                          </Flex>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Custom Reset Confirmation Modal */}
      {isResetModalOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          backdropFilter="blur(4px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          p={4}
        >
          <Box bg="white" borderRadius="2xl" shadow="xl" w="full" maxW="md" overflow="hidden">
            <Flex px={6} py={4} borderBottom="1px solid" borderColor="gray.100" justify="space-between" align="center" bg="gray.50">
              <Heading size="md" fontWeight="bold" color="red.600" display="flex" alignItems="center" gap={2}>
                <RotateCcw size={18} />
                Reset Pengerjaan Siswa
              </Heading>
              <Button variant="ghost" color="gray.400" onClick={() => setIsResetModalOpen(false)} fontSize="xl" p={0} minW={0} cursor="pointer">×</Button>
            </Flex>
            <Stack gap={4} p={6}>
              <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                Apakah Anda yakin ingin me-reset pengerjaan untuk siswa <strong>{session?.student?.user?.fullName}</strong>? Semua jawaban, skor, dan riwayat pelanggaran proctoring akan dihapus secara permanen. Siswa akan diizinkan untuk mengulang ujian ini dari awal.
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

              <Flex gap={3} pt={4}>
                <Button type="button" onClick={() => setIsResetModalOpen(false)} flex={1} variant="outline" borderRadius="lg" cursor="pointer">
                  Batal
                </Button>
                <Button
                  onClick={() => {
                    if (resetConfirmationInput.toLowerCase() === 'reset') {
                      resetMutation.mutate();
                      setIsResetModalOpen(false);
                    }
                  }}
                  disabled={resetConfirmationInput.toLowerCase() !== 'reset' || resetMutation.isPending}
                  flex={1}
                  bg="red.600"
                  color="white"
                  _hover={{ bg: 'red.700' }}
                  borderRadius="lg"
                  cursor="pointer"
                  loading={resetMutation.isPending}
                >
                  Reset Sekarang
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}

      {/* Styles for printing and custom DOM formatting */}
      <style>{`
        .question-content p {
          margin-bottom: 8px;
        }
        .question-content img {
          max-height: 250px;
          border-radius: 8px;
          margin: 8px 0;
        }
        
        @media print {
          /* Hide sidebar, headers, and buttons during print */
          header, 
          [as="header"], 
          aside, 
          nav, 
          button, 
          .no-print,
          div[style*="background: linear-gradient"],
          nav[as="nav"],
          aside[class*="sidebar"] {
            display: none !important;
          }
          
          /* Reset container margins and padding */
          body, main, [as="main"], .print-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Ensure all text is dark and visible */
          h1, h2, h3, h4, h5, p, span, div, text {
            color: #000 !important;
          }

          /* Keep layout clean and remove shadow borders */
          .print-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid;
          }
          
          /* Display read-only score when printing */
          .print-score-only {
            display: inline !important;
          }
        }
      `}</style>
    </Stack>
  );
}
