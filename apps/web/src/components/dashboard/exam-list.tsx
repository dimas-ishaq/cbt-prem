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

interface Exam {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  subject: {
    name: string;
  };
  examSessions?: Array<{
    id: string;
    status: string;
  }>;
}

export function ExamList() {
  const { data: exams, isLoading, error } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Spinner size="lg" color="#9C55E8" />
        <Text ml={3} color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="13px" fontWeight="medium">Memuat daftar ujian...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Text color="#EF4444" fontSize="13px" fontWeight="bold">Gagal memuat daftar ujian</Text>
      </Flex>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6} fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
      {exams?.map((exam) => {
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
            bg={{ base: '#ffffff', _dark: '#242424' }}
            borderRadius="md"
            boxShadow="0 1px 4px rgba(0,0,0,0.05)"
            border="1px solid"
            borderColor={{ base: '#dde1ea', _dark: '#3D3D3D' }}
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            transition="all 0.15s ease"
            _hover={{
              borderColor: '#9C55E8',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            <Box>
              <Flex justify="space-between" align="start" mb={4} gap={2}>
                <Badge bg="rgba(45, 155, 240, 0.12)" color="#2D9BF0" border="1px solid" borderColor="rgba(45, 155, 240, 0.2)" px={2.5} py={0.5} borderRadius="md" textTransform="uppercase" fontWeight="bold" fontSize="10px">
                  {exam.subject.name}
                </Badge>
                <HStack gap={1.5} flexWrap="wrap" justify="flex-end">
                  {isLocked && (
                    <Badge bg="rgba(239, 68, 68, 0.12)" color="#EF4444" border="1px solid" borderColor="rgba(239, 68, 68, 0.2)" px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                      TERKUNCI
                    </Badge>
                  )}
                  {!isLocked && isCompleted && (
                    <Badge bg="rgba(26, 190, 113, 0.12)" color="#1ABE71" border="1px solid" borderColor="rgba(26, 190, 113, 0.2)" px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                      SELESAI
                    </Badge>
                  )}
                  {isInProgress && (
                    <Badge bg="rgba(245, 166, 35, 0.12)" color="#F5A623" border="1px solid" borderColor="rgba(245, 166, 35, 0.2)" px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold" className="animate-pulse">
                      AKTIF
                    </Badge>
                  )}
                  {!isCompleted && !isInProgress && isNotStarted && (
                    <Badge bg={{ base: '#f0f4f8', _dark: '#2D2D2D' }} color={{ base: '#4a5468', _dark: '#8A8A8A' }} border="1px solid" borderColor={{ base: '#dde1ea', _dark: '#3D3D3D' }} px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                      BELUM DIMULAI
                    </Badge>
                  )}
                  {!isCompleted && !isInProgress && !isNotStarted && isEnded && (
                    <Badge bg={{ base: '#f0f4f8', _dark: '#2D2D2D' }} color={{ base: '#4a5468', _dark: '#8A8A8A' }} border="1px solid" borderColor={{ base: '#dde1ea', _dark: '#3D3D3D' }} px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                      SUDAH BERAKHIR
                    </Badge>
                  )}
                  <Text fontSize="12px" color={{ base: '#4a5468', _dark: '#8A8A8A' }} fontWeight="semibold">
                    {exam.duration} Menit
                  </Text>
                </HStack>
              </Flex>

              <Heading size="sm" fontWeight="bold" color={{ base: '#0d1226', _dark: '#E0E0E0' }} mb={2} lineClamp={1}>
                {exam.title}
              </Heading>

              <Text color={{ base: '#4a5468', _dark: '#8A8A8A' }} fontSize="12px" mb={4} lineClamp={2}>
                {exam.description}
              </Text>

              <Stack gap={1.5} fontSize="11px" color={{ base: '#4a5468', _dark: '#8A8A8A' }} fontWeight="semibold" mb={6}>
                <HStack gap={1.5}>
                  <Calendar size={12} color="#9AA3B2" />
                  <Text>Mulai: {startTime.toLocaleString('id-ID')}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <Clock size={12} color="#9AA3B2" />
                  <Text>Selesai: {endTime.toLocaleString('id-ID')}</Text>
                </HStack>
              </Stack>
            </Box>

            {isLocked ? (
              <Button
                w="full"
                height="38px"
                bg="rgba(239, 68, 68, 0.08)"
                color="#EF4444"
                border="1px solid"
                borderColor="rgba(239, 68, 68, 0.2)"
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
                bg="rgba(26, 190, 113, 0.08)"
                color="#1ABE71"
                border="1px solid"
                borderColor="rgba(26, 190, 113, 0.2)"
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
                bg={{ base: '#f0f4f8', _dark: '#1B1B1B' }}
                color={{ base: '#94A3B8', _dark: '#8A8A8A' }}
                border="1px solid"
                borderColor={{ base: '#dde1ea', _dark: '#3D3D3D' }}
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
                bg={{ base: '#f0f4f8', _dark: '#1B1B1B' }}
                color={{ base: '#94A3B8', _dark: '#8A8A8A' }}
                border="1px dashed"
                borderColor={{ base: '#dde1ea', _dark: '#3D3D3D' }}
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
                  bg="#F5A623"
                  color="white"
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="13px"
                  _hover={{ bg: '#fbb33c', textDecoration: 'none' }}
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
                  bg="#9C55E8"
                  color="white"
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="13px"
                  _hover={{ bg: '#a86bf5', textDecoration: 'none' }}
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
        <Box gridColumn="1 / -1" textAlign="center" py={12} color={{ base: '#57606A', _dark: '#8A8A8A' }} fontStyle="italic" fontSize="13px">
          Belum ada ujian yang tersedia.
        </Box>
      )}
    </SimpleGrid>
  );
}
