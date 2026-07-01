'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  BookOpen,
  AlertTriangle,
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
  Spinner,
  SimpleGrid,
  Grid,
  RadioGroup,
  Checkbox,
  Container,
} from '@chakra-ui/react';

export default function StudentResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['my-session-result', sessionId],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/me/${sessionId}`);
      return response.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <Flex minH="100dvh" bg="dd.canvas" align="center" justify="center">
        <Box textAlign="center">
          <Spinner size="xl" color="dd.brand" mb={4} />
          <Text color="dd.text.muted" fontSize="13px">Memuat lembar hasil ujian...</Text>
        </Box>
      </Flex>
    );
  }

  if (error || !session) {
    return (
      <Flex minH="100dvh" bg="dd.canvas" align="center" justify="center" p={6} textAlign="center">
        <Box maxW="md">
          <AlertTriangle size={48} style={{ margin: '0 auto 16px', color: 'var(--chakra-colors-dd-text-muted)' }} />
          <Heading size="lg" fontWeight="700" color="dd.text" mb={2}>Hasil Tidak Ditemukan</Heading>
          <Text color="dd.text.muted" mb={6}>Sesi hasil ujian tidak tersedia atau link tidak valid.</Text>
          <Button
            bg="dd.brand"
            color="white"
            borderRadius="md"
            fontWeight="bold"
            onClick={() => router.push('/dashboard')}
          >
            Kembali ke Dashboard
          </Button>
        </Box>
      </Flex>
    );
  }

  const answers = Array.isArray(session.answers) ? session.answers : [];
  const totalQuestions = answers.length;
  const correctCount = answers.filter((a: any) => a.isCorrect === true).length;
  const incorrectCount = answers.filter((a: any) => a.isCorrect === false).length;
  const essayCount = answers.filter((a: any) => a.question?.type === 'ESSAY').length;

  const timeStart = session.startTime ? new Date(session.startTime) : null;
  const timeEnd = session.endTime ? new Date(session.endTime) : null;
  const timeSpent = (timeStart && timeEnd)
    ? `${Math.round((timeEnd.getTime() - timeStart.getTime()) / 60000)} menit`
    : '-';

  return (
    <Box minH="100dvh" bg="dd.canvas" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
      <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={5}>
        <Stack gap={6}>
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            color="dd.text.muted"
            onClick={() => router.push('/dashboard')}
            alignSelf="flex-start"
            gap={1.5}
            fontWeight="bold"
            fontSize="12px"
            cursor="pointer"
          >
            <ChevronLeft size={14} />
            Kembali ke Dashboard
          </Button>

          {/* Header */}
          <Box>
            <Heading size="xl" fontWeight="black" color="dd.text" letterSpacing="tight">
              Hasil Ujian
            </Heading>
            <Text color="dd.text.muted" fontSize="13px" mt={1}>
              Review jawaban dan hasil pengerjaan ujian kamu.
            </Text>
          </Box>

          {/* Overview */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 2fr' }} gap={6}>
            {/* Score */}
            <Box
              bg="dd.surface"
              border="1px solid"
              borderColor="dd.border"
              borderRadius="card"
              p={6}
              textAlign="center"
            >
              <Text fontSize="10px" color="dd.text.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="widest" mb={2}>
                Nilai Akhir
              </Text>
              <Heading fontSize="6xl" fontWeight="black" color={session.score !== null ? 'dd.status.success.text' : 'dd.text.muted'} lineHeight="1">
                {session.score !== null ? Math.round(session.score) : '--'}
              </Heading>
              {session.status && (
                <Badge
                  mt={4}
                  colorPalette={session.status === 'LOCKED' ? 'red' : 'green'}
                  fontSize="xs"
                  fontWeight="extrabold"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {session.status}
                </Badge>
              )}
            </Box>

            {/* Details */}
            <Box bg="dd.surface" border="1px solid" borderColor="dd.border" borderRadius="card" p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                <Stack gap={4}>
                  <HStack gap={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="dd.brand.subtle" align="center" justify="center">
                      <User size={14} color="var(--chakra-colors-dd-brand)" />
                    </Flex>
                    <Box>
                      <Text fontSize="10px" color="dd.text.muted" fontWeight="bold" textTransform="uppercase">Siswa</Text>
                      <Text fontWeight="semibold" color="dd.text" fontSize="sm">{session.student?.user?.fullName || '-'}</Text>
                      <Text fontSize="11px" color="dd.text.muted">NIS: {session.student?.nis || '-'}</Text>
                    </Box>
                  </HStack>
                  <HStack gap={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="dd.brand.subtle" align="center" justify="center">
                      <BookOpen size={14} color="var(--chakra-colors-dd-brand)" />
                    </Flex>
                    <Box>
                      <Text fontSize="10px" color="dd.text.muted" fontWeight="bold" textTransform="uppercase">Ujian</Text>
                      <Text fontWeight="semibold" color="dd.text" fontSize="sm">{session.exam?.title || '-'}</Text>
                      <Text fontSize="11px" color="dd.text.muted">{session.exam?.subject?.name || ''}</Text>
                    </Box>
                  </HStack>
                </Stack>
                <Stack gap={4}>
                  <HStack gap={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="dd.brand.subtle" align="center" justify="center">
                      <Clock size={14} color="var(--chakra-colors-dd-brand)" />
                    </Flex>
                    <Box>
                      <Text fontSize="10px" color="dd.text.muted" fontWeight="bold" textTransform="uppercase">Durasi</Text>
                      <Text fontWeight="semibold" color="dd.text" fontSize="sm">{timeSpent}</Text>
                      {session.startTime && (
                        <Text fontSize="11px" color="dd.text.muted">
                          Mulai: {new Date(session.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </Box>
                  </HStack>
                  <HStack gap={3}>
                    <Flex w={8} h={8} borderRadius="lg" bg="dd.brand.subtle" align="center" justify="center">
                      <CheckCircle2 size={14} color="var(--chakra-colors-dd-brand)" />
                    </Flex>
                    <Box>
                      <Text fontSize="10px" color="dd.text.muted" fontWeight="bold" textTransform="uppercase">Statistik Soal</Text>
                      <HStack gap={2} mt={0.5}>
                        <Badge colorPalette="green" variant="subtle" size="sm">{correctCount} Benar</Badge>
                        <Badge colorPalette="red" variant="subtle" size="sm">{incorrectCount} Salah</Badge>
                        {essayCount > 0 && <Badge colorPalette="gray" variant="subtle" size="sm">{essayCount} Essay</Badge>}
                      </HStack>
                    </Box>
                  </HStack>
                </Stack>
              </SimpleGrid>
            </Box>
          </Grid>

          {/* Answer list */}
          <Heading size="md" fontWeight="bold" color="dd.text" mt={2}>
            Daftar Jawaban
          </Heading>

          <Stack gap={4} pb={8}>
            {answers.length === 0 && (
              <Text color="dd.text.muted" fontSize="13px" fontStyle="italic">
                Belum ada jawaban yang tercatat.
              </Text>
            )}
            {answers.map((answer: any, idx: number) => {
              const question = answer.question;
              const isEssay = question?.type === 'ESSAY';

              return (
                <Box
                  key={answer.id}
                  bg="dd.surface"
                  border="1px solid"
                  borderColor="dd.border"
                  borderRadius="card"
                  overflow="hidden"
                  p={5}
                >
                  {/* Question header */}
                  <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                    <HStack gap={3}>
                      <Flex w={8} h={8} borderRadius="lg" bg="dd.brand.subtle" align="center" justify="center" fontWeight="bold" fontSize="sm" color="dd.brand">
                        {idx + 1}
                      </Flex>
                      <Badge colorPalette="blue" variant="solid" fontSize="2xs" fontWeight="bold" px={2.5} py={0.5} borderRadius="md">
                        {question?.type || '-'}
                      </Badge>
                      {answer.isCorrect !== null && !isEssay && (
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
                          {answer.isCorrect ? 'Benar' : 'Salah'}
                        </Badge>
                      )}
                    </HStack>
                    <HStack gap={1}>
                      <Text fontSize="11px" color="dd.text.muted" fontWeight="medium">
                        {answer.score ?? 0} / {question?.points || 0} Poin
                      </Text>
                    </HStack>
                  </Flex>

                  {/* Question content */}
                  {(question?.content) && (
                    <Box
                      className="question-content"
                      fontSize="sm"
                      color="dd.text"
                      fontWeight="semibold"
                      lineHeight="relaxed"
                      mb={5}
                      dangerouslySetInnerHTML={{ __html: question.content }}
                    />
                  )}

                  {/* Student answer */}
                  <Box p={4} bg="dd.canvas" borderRadius="card" border="1px solid" borderColor="dd.border">
                    <Text fontSize="10px" fontWeight="bold" color="dd.text.muted" textTransform="uppercase" letterSpacing="widest" mb={3}>
                      JAWABAN KAMU:
                    </Text>
                    {isEssay ? (
                      <Text fontSize="sm" color="dd.text" whiteSpace="pre-wrap" lineHeight="relaxed" fontWeight="medium">
                        {answer.essayAnswer || <span style={{ fontStyle: 'italic', color: 'var(--chakra-colors-dd-text-muted)' }}>Tidak ada jawaban yang dikirimkan.</span>}
                      </Text>
                    ) : question?.type === 'MULTIPLE_RESPONSE' ? (
                      <Stack gap={2}>
                        {(question.options || []).map((opt: any) => {
                          const isSelected = answer.selectedOption?.split(',').includes(opt.id);
                          let bg = 'transparent';
                          let badgeText = '';
                          if (isSelected && opt.isCorrect) { bg = 'status.success.bg'; badgeText = 'Pilihan Kamu (Benar)'; }
                          else if (isSelected && !opt.isCorrect) { bg = 'status.danger.bg'; badgeText = 'Pilihan Kamu (Salah)'; }
                          else if (opt.isCorrect) { bg = 'brand.subtle'; badgeText = 'Kunci Jawaban'; }

                          return (
                            <Checkbox.Root
                              key={opt.id}
                              checked={!!isSelected}
                              disabled
                              as="div"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              p={3}
                              bg={bg}
                              border="1px solid"
                              borderColor={isSelected && !opt.isCorrect ? 'status.danger.text' : 'dd.border'}
                              borderRadius="xl"
                              gap={3}
                            >
                              <Checkbox.HiddenInput />
                              <HStack gap={3} flex={1}>
                                <Checkbox.Control colorPalette={isSelected ? (opt.isCorrect ? 'green' : 'red') : 'gray'} />
                                <Checkbox.Label
                                  fontSize="xs"
                                  fontWeight={opt.isCorrect ? 'bold' : 'medium'}
                                  as="span"
                                  dangerouslySetInnerHTML={{ __html: opt.content }}
                                />
                              </HStack>
                              {badgeText && (
                                <Badge colorPalette={opt.isCorrect ? 'green' : 'red'} size="sm" variant="subtle" borderRadius="md">
                                  {badgeText}
                                </Badge>
                              )}
                            </Checkbox.Root>
                          );
                        })}
                      </Stack>
                    ) : (
                      <RadioGroup.Root value={answer.selectedOption || ''} readOnly width="full">
                        <Stack gap={2}>
                          {(question.options || []).map((opt: any) => {
                            const isSelected = answer.selectedOption === opt.id;
                            let bg = 'transparent';
                            let badgeText = '';
                            if (isSelected && opt.isCorrect) { bg = 'status.success.bg'; badgeText = 'Jawaban Kamu (Benar)'; }
                            else if (isSelected && !opt.isCorrect) { bg = 'status.danger.bg'; badgeText = 'Jawaban Kamu (Salah)'; }
                            else if (opt.isCorrect) { bg = 'brand.subtle'; badgeText = 'Kunci Jawaban'; }

                            return (
                              <RadioGroup.Item
                                key={opt.id}
                                value={opt.id}
                                as="div"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                                p={3}
                                bg={bg}
                                border="1px solid"
                                borderColor={isSelected && !opt.isCorrect ? 'status.danger.text' : 'dd.border'}
                                borderRadius="xl"
                                gap={3}
                              >
                                <RadioGroup.ItemHiddenInput />
                                <HStack gap={3} flex={1}>
                                  <RadioGroup.ItemIndicator colorPalette={isSelected ? (opt.isCorrect ? 'green' : 'red') : 'gray'} />
                                  <RadioGroup.ItemText
                                    fontSize="xs"
                                    fontWeight={opt.isCorrect ? 'bold' : 'medium'}
                                    as="span"
                                    dangerouslySetInnerHTML={{ __html: opt.content }}
                                  />
                                </HStack>
                                {badgeText && (
                                  <Badge colorPalette={opt.isCorrect ? 'green' : 'red'} size="sm" variant="subtle" borderRadius="md">
                                    {badgeText}
                                  </Badge>
                                )}
                              </RadioGroup.Item>
                            );
                          })}
                        </Stack>
                      </RadioGroup.Root>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
