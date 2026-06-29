'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  SimpleGrid,
  Box,
  Flex,
  Badge,
  Text,
  Heading,
  Stack,
  HStack,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { Calendar, Clock } from 'lucide-react';
import { classifyExam, getAvailabilityLabel, getUpcomingExams } from '@/lib/exam-utils';

interface Exam {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration?: number;
  subject?: { name?: string };
  teacher?: { id?: string; nip?: string | null; user?: { fullName?: string; username?: string } | null } | null;
  examSessions?: Array<{ id?: string; status?: string }>;
}

export function ExamList() {
  const { data: exams, isLoading, error } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return response.data;
    },
  });

  const cardBg = { base: 'dd.surface', _dark: 'dd.surface' };
  const textMuted = { base: 'dd.text.muted', _dark: 'dd.text.muted' };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={12} gap={3}>
        <Spinner size="lg" color="dd.brand" />
        <Text color={textMuted} fontSize="13px" fontWeight="medium">Memuat daftar ujian...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Text color="dd.status.danger.text" fontSize="13px" fontWeight="bold">Gagal memuat daftar ujian</Text>
      </Flex>
    );
  }

  const now = new Date();
  const upcomingExams = getUpcomingExams(exams || [], now);
  const activeExams = (exams || []).filter((exam) => {
    const status = classifyExam(exam, now);
    return status === 'active' || status === 'ended' || status === 'completed' || status === 'locked';
  });

  const getTeacherName = (exam: Exam) =>
    exam.teacher?.user?.fullName || exam.teacher?.user?.username || '-';

  return (
    <Stack gap={6} fontFamily="body">
      {upcomingExams.length > 0 && (
        <Box bg="dd.surface" border="1px solid" borderColor="dd.border" borderRadius="card" p={5} boxShadow={{ base: 'card-light', _dark: 'card-dark' }}>
          <Stack gap={1.5} mb={4}>
            <Heading size="sm" fontWeight="bold" color="dd.text">Ujian Akan Datang</Heading>
            <Text color={textMuted} fontSize="12px">Jadwal ujian berikut belum bisa dikerjakan.</Text>
          </Stack>
          <Stack gap={3}>
            {upcomingExams.map((exam) => {
              const startTime = new Date(exam.startTime);
              const endTime = new Date(exam.endTime);
              return (
                <Flex key={exam.id} justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }} p={4} borderRadius="md" bg="dd.surface.alt" border="1px solid" borderColor="dd.border">
                  <Box>
                    <Heading size="xs" color="dd.text" fontWeight="bold">{exam.title}</Heading>
                    <Text fontSize="12px" color={textMuted}>{exam.subject?.name || '-'}</Text>
                  </Box>
                  <Stack gap={0.5} fontSize="11px" color={textMuted} textAlign={{ base: 'left', md: 'right' }}>
                    <HStack gap={1.5}><Calendar size={12} color="var(--chakra-colors-dd-brand)" /><Text>Mulai: {startTime.toLocaleString('id-ID')}</Text></HStack>
                    <HStack gap={1.5}><Clock size={12} color="var(--chakra-colors-dd-brand)" /><Text>Selesai: {endTime.toLocaleString('id-ID')}</Text></HStack>
                    <HStack gap={1.5}><Text fontSize="11px" color={textMuted}>Guru: {getTeacherName(exam)}</Text></HStack>
                  </Stack>
                </Flex>
              );
            })}
          </Stack>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5} fontFamily="body">
        {activeExams.map((exam) => {
          const now = new Date();
          const startTime = new Date(exam.startTime);
          const endTime = new Date(exam.endTime);

          const userSession = exam.examSessions?.[0];
          const isCompleted = userSession?.status === 'SUBMITTED' || userSession?.status === 'FINISHED' || userSession?.status === 'LOCKED';
          const isLocked = userSession?.status === 'LOCKED';
          const isInProgress = userSession?.status === 'IN_PROGRESS';
          const isNotStarted = now < startTime;
          const isEnded = now > endTime;

          return (
            <Box
            key={exam.id}
            p={5}
            bg={cardBg}
            borderRadius="card"
            boxShadow={{ base: 'card-light', _dark: 'card-dark' }}
            border="1px solid"
            borderColor="dd.border"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            transition="all 150ms ease"
            _hover={{
              borderColor: 'dd.brand',
              transform: 'translateY(-2px)',
              boxShadow: { base: 'card-light', _dark: 'card-dark' },
            }}
          >
            <Box>
              <Flex justify="space-between" align="start" mb={4} gap={2}>
                <HStack gap={1.5} flexWrap="wrap">
                  <Badge bg="dd.status.info.bg" color="dd.status.info.text" border="1px solid" borderColor="dd.border" px={2.5} py={0.5} borderRadius="badge" textTransform="uppercase" fontWeight="bold" fontSize="10px">
                    {exam.subject?.name || '-'}
                  </Badge>
                  <Badge bg="dd.brand.subtle" color="dd.brand" border="1px solid" borderColor="dd.border" px={2.5} py={0.5} borderRadius="badge" textTransform="uppercase" fontWeight="bold" fontSize="10px">
                    {getAvailabilityLabel(exam)}
                  </Badge>
                </HStack>
                <HStack gap={1.5} flexWrap="wrap" justify="flex-end">
                  {isLocked && (
                    <Badge bg="dd.status.danger.bg" color="dd.status.danger.text" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                      TERKUNCI
                    </Badge>
                  )}
                  {!isLocked && isCompleted && (
                    <Badge bg="dd.status.success.bg" color="dd.status.success.text" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                      SELESAI
                    </Badge>
                  )}
                  {isInProgress && (
                    <Badge bg="dd.status.warning.bg" color="dd.status.warning.text" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold" className="animate-pulse">
                      AKTIF
                    </Badge>
                  )}
                  {!isCompleted && !isInProgress && isNotStarted && (
                    <Badge bg="dd.surface.alt" color="dd.text.muted" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                      BELUM DIMULAI
                    </Badge>
                  )}
                  {!isCompleted && !isInProgress && !isNotStarted && isEnded && (
                    <Badge bg="dd.surface.alt" color="dd.text.muted" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                      SUDAH BERAKHIR
                    </Badge>
                  )}
                  <Text fontSize="12px" color={textMuted} fontWeight="semibold">
                    {exam.duration} Menit
                  </Text>
                </HStack>
              </Flex>

              <Heading size="sm" fontWeight="bold" color="dd.text" mb={2} lineClamp={1}>
                {exam.title}
              </Heading>

              <Text color={textMuted} fontSize="12px" mb={4} lineClamp={2}>
                {exam.description}
              </Text>

              <Stack gap={1.5} fontSize="11px" color={textMuted} fontWeight="semibold" mb={6}>
                <HStack gap={1.5}>
                  <Calendar size={12} color="var(--chakra-colors-dd-text-muted)" />
                  <Text>Mulai: {startTime.toLocaleString('id-ID')}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <Clock size={12} color="var(--chakra-colors-dd-text-muted)" />
                  <Text>Selesai: {endTime.toLocaleString('id-ID')}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <Text color="dd.text.muted">Guru: {getTeacherName(exam)}</Text>
                </HStack>
              </Stack>
            </Box>

            {isLocked ? (
              <Button
                w="full"
                height="38px"
                bg="dd.status.danger.bg"
                color="dd.status.danger.text"
                border="1px solid"
                borderColor="dd.border"
                borderRadius="md"
                fontWeight="bold"
                fontSize="13px"
                cursor="not-allowed"
                disabled
              >
                Sesi Ujian Terkunci
              </Button>
            ) : isCompleted ? (
              <Button
                w="full"
                height="38px"
                bg="dd.status.success.bg"
                color="dd.status.success.text"
                border="1px solid"
                borderColor="dd.border"
                borderRadius="md"
                fontWeight="bold"
                fontSize="13px"
                cursor="not-allowed"
                disabled
              >
                Sudah Dikerjakan
              </Button>
            ) : isEnded ? (
              <Button
                w="full"
                height="38px"
                bg="dd.surface.alt"
                color="dd.text.muted"
                border="1px solid"
                borderColor="dd.border"
                borderRadius="md"
                fontWeight="bold"
                fontSize="13px"
                cursor="not-allowed"
                disabled
              >
                Sudah Berakhir
              </Button>
            ) : isNotStarted ? (
              <Button
                w="full"
                height="38px"
                bg="dd.surface.alt"
                color="dd.text.muted"
                border="1px dashed"
                borderColor="dd.border"
                borderRadius="md"
                fontWeight="bold"
                fontSize="13px"
                cursor="not-allowed"
                disabled
              >
                Belum Dimulai
              </Button>
            ) : isInProgress ? (
              <Link href={`/exams/${exam.id}`} passHref style={{ width: '100%' }}>
                <Button
                  w="full"
                  height="38px"
                  bg="dd.status.warning.solid"
                  color="dd.text.onBrand"
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="13px"
                  _hover={{ bg: 'dd.status.warning.solid', textDecoration: 'none' }}
                  textAlign="center"
                  display="block"
                  cursor="pointer"
                >
                  Lanjutkan Ujian
                </Button>
              </Link>
            ) : (
              <Link href={`/exams/${exam.id}`} passHref style={{ width: '100%' }}>
                <Button
                  w="full"
                  height="38px"
                  bg="dd.brand"
                  color="dd.text.onBrand"
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="13px"
                  _hover={{ bg: 'dd.brand.hover', textDecoration: 'none' }}
                  textAlign="center"
                  display="block"
                  cursor="pointer"
                >
                  Ikuti Ujian
                </Button>
              </Link>
            )}
          </Box>
        );
      })}
      {exams?.length === 0 && (
        <Box gridColumn="1 / -1" textAlign="center" py={12} color="dd.text.muted" fontStyle="italic" fontSize="13px">
          Belum ada ujian yang tersedia.
        </Box>
      )}
    </SimpleGrid>
    </Stack>
  );
}
