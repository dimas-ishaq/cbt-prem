'use client';

import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ChevronLeft, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Box,
  Flex,
  Stack,
  Text,
  Button,
  HStack,
  VStack,
  Spinner,
  Heading,
  Badge,
  Grid,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';

interface EssayAnswer {
  id: string;
  examSession: {
    student: { user: { fullName: string; username: string } };
    id: string;
  };
  question: { content: string; points: number };
  essayAnswer: string | null;
  score: number | null;
  isGraded: boolean;
}

export default function EssayGradingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

  const { data: answers, isLoading, error } = useQuery<EssayAnswer[]>({
    queryKey: ['essay-answers', examId],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${examId}/essay-answers`);
      return response.data;
    },
  });

  const selectedAnswer = answers?.find((a) => a.id === selectedAnswerId);

  const gradeMutation = useMutation({
    mutationFn: async ({ answerId, score }: { answerId: string; score: number }) => {
      return api.post(`/exam-sessions/exam/${examId}/essay-answers/${answerId}/grade`, { score });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['essay-answers', examId] });
      toast.success('Nilai essay berhasil disimpan!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyimpan nilai.');
    },
  });

  const handleGrade = (score: number) => {
    if (!selectedAnswerId) return;
    gradeMutation.mutate({ answerId: selectedAnswerId, score });
  };

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="60vh" gap={3}>
        <Spinner size="xl" color="indigo.600" />
        <Text color="gray.500" fontWeight="bold">Memuat Lembar Jawaban Essay...</Text>
      </Flex>
    );
  }

  if (error || !answers || answers.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh" p={6}>
        <AlertCircle size={48} className="text-amber-500 mb-3" />
        <Heading size="md" color="gray.800" mb={1}>Tidak Ada Jawaban Essay</Heading>
        <Text color="gray.500" mb={6}>Ujian ini tidak memiliki pertanyaan bertipe essay atau belum ada jawaban masuk.</Text>
        <Link href={`/admin/results/${examId}`} passHref>
          <Button colorPalette="indigo" borderRadius="xl">Kembali ke Hasil Ujian</Button>
        </Link>
      </Flex>
    );
  }

  const gradedCount = answers.filter((a) => a.score !== null).length;

  return (
    <Stack gap={6} maxW="7xl" mx="auto" px={{ base: 4, lg: 8 }} py={6} h="calc(100vh - 100px)">
      {/* Header */}
      <Flex align="center" gap={4} pb={4} borderBottom="1px solid" borderColor="gray.100">
        <Link href={`/admin/results/${examId}`} passHref>
          <Button variant="ghost" p={2.5} borderRadius="full" cursor="pointer">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <Box>
          <Heading size="xl" fontWeight="black" color="gray.900" letterSpacing="tight">
            Koreksi Jawaban Essay
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={0.5}>
            Penilaian manual secara terpusat • Progress: {gradedCount} dari {answers.length} jawaban dinilai
          </Text>
        </Box>
      </Flex>

      {/* Main Workspace Layout */}
      <Grid templateColumns={{ base: '1fr', lg: '320px 1fr' }} gap={6} flex={1} overflow="hidden">
        
        {/* Left Pane: Answer List */}
        <Flex direction="column" bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={4} overflow="hidden">
          <Text fontWeight="bold" color="gray.700" mb={3} fontSize="sm" px={1}>
            Daftar Jawaban Siswa
          </Text>
          <Stack gap={3} flex={1} overflowY="auto" pr={1}>
            {answers.map((a) => {
              const isSelected = selectedAnswerId === a.id;
              return (
                <Box
                  key={a.id}
                  p={4}
                  bg={isSelected ? 'indigo.600' : 'white'}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={isSelected ? 'indigo.700' : 'gray.200'}
                  cursor="pointer"
                  onClick={() => setSelectedAnswerId(a.id)}
                  transition="all 0.2s"
                  shadow="xs"
                  _hover={isSelected ? {} : { borderColor: 'indigo.200', transform: 'translateY(-1px)' }}
                >
                  <Text fontWeight="bold" fontSize="sm" color={isSelected ? 'white' : 'gray.800'} lineClamp={1}>
                    {a.examSession.student.user.fullName}
                  </Text>
                  <Text fontSize="2xs" color={isSelected ? 'indigo.200' : 'gray.400'} mt={1} lineClamp={1}>
                    NIS: {a.examSession.student.user.username}
                  </Text>
                  <Flex mt={3} justify="space-between" align="center">
                    <Badge
                      colorPalette={a.score !== null ? 'green' : 'orange'}
                      variant={isSelected ? 'solid' : 'subtle'}
                      fontSize="3xs"
                      fontWeight="bold"
                      borderRadius="md"
                    >
                      {a.score !== null ? `Dinilai: ${a.score}` : 'Belum Dinilai'}
                    </Badge>
                    <Text fontSize="3xs" color={isSelected ? 'indigo.200' : 'gray.400'} fontWeight="bold">
                      Maks {a.question.points} Poin
                    </Text>
                  </Flex>
                </Box>
              );
            })}
          </Stack>
        </Flex>

        {/* Right Pane: grading detail */}
        <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={8} overflowY="auto" shadow="sm">
          {selectedAnswer ? (
            <VStack align="stretch" gap={8}>
              {/* Student Identity */}
              <Box pb={4} borderBottom="1px solid" borderColor="gray.100">
                <Text fontSize="3xs" fontWeight="black" color="indigo.500" textTransform="uppercase" letterSpacing="widest">Kandidat Ujian</Text>
                <Heading size="md" color="gray.850" mt={1}>
                  {selectedAnswer.examSession.student.user.fullName}
                </Heading>
                <Text fontSize="xs" color="gray.400" mt={0.5}>
                  Username: @{selectedAnswer.examSession.student.user.username}
                </Text>
              </Box>

              {/* Question Text */}
              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={2.5}>Pertanyaan Soal</Text>
                <Box
                  p={4.5}
                  bg="gray.50"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.100"
                  fontSize="sm"
                  fontWeight="semibold"
                  color="gray.800"
                  lineHeight="relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedAnswer.question.content }}
                />
              </Box>

              {/* Student Typed Answer */}
              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={2.5}>Jawaban yang Dikirim</Text>
                <Box
                  p={5}
                  bg="indigo.50/20"
                  borderRadius="2xl"
                  border="1.5px solid"
                  borderColor="indigo.100"
                  fontSize="sm"
                  color="gray.750"
                  fontWeight="medium"
                  minH="180px"
                  whiteSpace="pre-wrap"
                  lineHeight="relaxed"
                >
                  {selectedAnswer.essayAnswer || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Siswa tidak mengirimkan jawaban tertulis.</span>}
                </Box>
              </Box>

              {/* Score selector */}
              <Box pt={4} borderTop="1px solid" borderColor="gray.100">
                <Text fontSize="2xs" fontWeight="black" color="gray.400" textTransform="uppercase" letterSpacing="widest" mb={3.5}>
                  Pilih Nilai Kelulusan (Maksimum {selectedAnswer.question.points} Poin)
                </Text>
                <HStack gap={2.5} wrap="wrap">
                  {Array.from({ length: selectedAnswer.question.points + 1 }, (_, i) => i).map((score) => {
                    const isCurrentScore = selectedAnswer.score === score;
                    return (
                      <Button
                        key={score}
                        size="md"
                        colorPalette="indigo"
                        variant={isCurrentScore ? 'solid' : 'outline'}
                        onClick={() => handleGrade(score)}
                        borderRadius="xl"
                        fontWeight="black"
                        w={12}
                        h={12}
                        cursor="pointer"
                        loading={gradeMutation.isPending && selectedAnswerId === selectedAnswer.id}
                        _hover={isCurrentScore ? {} : { bg: 'indigo.50' }}
                      >
                        {score}
                      </Button>
                    );
                  })}
                </HStack>
              </Box>
            </VStack>
          ) : (
            <Flex direction="column" align="center" justify="center" h="full" gap={3}>
              <Box p={4} bg="indigo.50" color="indigo.600" borderRadius="2xl">
                <FileText size={32} />
              </Box>
              <Text color="gray.500" fontWeight="semibold" fontSize="sm">
                Pilih salah satu lembar jawaban siswa dari daftar sebelah kiri untuk memulai penilaian.
              </Text>
            </Flex>
          )}
        </Box>
      </Grid>
    </Stack>
  );
}