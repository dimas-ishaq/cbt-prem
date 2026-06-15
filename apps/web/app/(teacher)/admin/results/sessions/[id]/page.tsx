'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useState } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, Save } from 'lucide-react';
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
} from '@chakra-ui/react';
import toast from 'react-hot-toast';

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});

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

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh">
        <Spinner size="lg" color="indigo.650" />
        <Text color="gray.600" mt={3} fontWeight="semibold">Memuat detail lembar jawaban...</Text>
      </Flex>
    );
  }

  if (!session) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh" color="red.500">
        <Text fontWeight="bold">Sesi ujian tidak ditemukan</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
        <Flex align="center" gap={4}>
          <Link href={`/admin/results/${session.examId}`} passHref>
            <Button variant="ghost" p={2} borderRadius="full" cursor="pointer">
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <Box>
            <Heading size="lg" fontWeight="bold" color="gray.900">
              {session.student.user.fullName}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {session.exam.title} • Detail Hasil Ujian
            </Text>
          </Box>
        </Flex>
        
        <HStack bg="white" px={6} py={3} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" gap={6}>
          <Box textAlign="center">
            <Text fontSize="3xs" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Total Nilai</Text>
            <Text fontSize="2xl" fontWeight="black" color="indigo.600">{session.score ?? '--'}</Text>
          </Box>
          <Box w="1px" h="8" bg="gray.100" />
          <Box textAlign="center">
            <Text fontSize="3xs" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Status Sesi</Text>
            <Badge colorPalette="green" fontSize="xs" fontWeight="bold" px={3} py={1} borderRadius="full">
              {session.status}
            </Badge>
          </Box>
        </HStack>
      </Flex>

      <Stack gap={6} pb={12}>
        {session.answers.map((answer: any, idx: number) => {
          const question = answer.question;
          const isEssay = question.type === 'ESSAY';
          
          return (
            <Box key={answer.id} bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
              <Box p={6}>
                <Flex justify="between" align="start" mb={4}>
                  <HStack gap={3}>
                    <Flex w={8} h={8} borderRadius="full" bg="gray.100" align="center" justify="center" color="gray.600" fontWeight="bold" fontSize="sm">
                      {idx + 1}
                    </Flex>
                    <Badge colorPalette="blue" fontSize="2xs" fontWeight="bold" px={2} py={0.5} borderRadius="full">
                      {question.type}
                    </Badge>
                    {answer.isCorrect !== null && (
                      <Badge
                        colorPalette={answer.isCorrect ? 'green' : 'red'}
                        fontSize="3xs"
                        fontWeight="bold"
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        {answer.isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <Text>{answer.isCorrect ? 'Benar' : 'Salah'}</Text>
                      </Badge>
                    )}
                  </HStack>
                  <HStack gap={3}>
                    <HStack gap={2}>
                      <Text fontSize="2xs" color="gray.400" fontWeight="bold" textTransform="uppercase">Poin:</Text>
                      <Input
                        type="number"
                        defaultValue={answer.score || 0}
                        onChange={(e) => setEditingScores(prev => ({ ...prev, [answer.id]: parseInt(e.target.value) }))}
                        w={16}
                        textAlign="center"
                        fontSize="sm"
                        fontWeight="bold"
                        borderRadius="lg"
                        py={1.5}
                      />
                      <Text color="gray.400" fontSize="sm">/ {question.points}</Text>
                    </HStack>
                    {(editingScores[answer.id] !== undefined && editingScores[answer.id] !== answer.score) && (
                      <IconButton
                        aria-label="Save Score"
                        colorPalette="indigo"
                        size="sm"
                        onClick={() => gradeMutation.mutate({ answerId: answer.id, score: editingScores[answer.id]! })}
                        cursor="pointer"
                      >
                        <Save size={16} />
                      </IconButton>
                    )}
                  </HStack>
                </Flex>

                <Box
                  fontSize="md"
                  color="gray.850"
                  fontWeight="semibold"
                  lineHeight="relaxed"
                  mb={6}
                  dangerouslySetInnerHTML={{ __html: question.content }}
                />

                <Box p={4} bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.100">
                  <Text fontSize="3xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>Jawaban Siswa:</Text>
                  {isEssay ? (
                    <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" lineHeight="relaxed" fontWeight="medium">
                      {answer.essayAnswer || <span className="italic text-gray-400">Tidak ada jawaban yang dikirimkan.</span>}
                    </Text>
                  ) : (
                    <Stack gap={2}>
                      {question.options.map((opt: any) => {
                        const isSelected = answer.selectedOption?.split(',').includes(opt.id);
                        return (
                          <HStack key={opt.id} gap={3} fontSize="sm">
                            <Flex
                              w={4}
                              h={4}
                              borderRadius="full"
                              border="1px solid"
                              align="center"
                              justify="center"
                              borderColor={isSelected ? 'blue.500' : 'gray.300'}
                              bg={isSelected ? 'blue.500' : 'transparent'}
                            />
                            <Box
                              fontSize="xs"
                              fontWeight={opt.isCorrect ? 'bold' : 'medium'}
                              color={opt.isCorrect ? 'green.700' : 'gray.600'}
                              textDecoration={isSelected ? 'underline' : 'none'}
                              dangerouslySetInnerHTML={{ __html: opt.content }}
                            />
                            {opt.isCorrect && <CheckCircle2 size={14} className="text-green-500" />}
                            {isSelected && !opt.isCorrect && <XCircle size={14} className="text-red-500" />}
                          </HStack>
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
    </Stack>
  );
}
