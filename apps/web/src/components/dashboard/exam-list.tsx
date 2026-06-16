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
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.600" fontWeight="medium">Memuat daftar ujian...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Text color="red.500" fontWeight="bold">Gagal memuat daftar ujian</Text>
      </Flex>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
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
            p={6}
            bg="white"
            borderRadius="2xl"
            boxShadow="md"
            border="1px solid"
            borderColor={isCompleted ? (isLocked ? 'red.100' : 'emerald.100') : (isInProgress ? 'amber.100' : (isEnded ? 'gray.200' : 'gray.100'))}
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg', borderColor: isCompleted ? (isLocked ? 'red.200' : 'emerald.200') : (isInProgress ? 'amber.200' : 'indigo.100') }}
          >
            <Box>
              <Flex justify="space-between" align="start" mb={4}>
                <Badge colorPalette="blue" px={2.5} py={1} borderRadius="lg" textTransform="uppercase" fontWeight="bold" fontSize="2xs">
                  {exam.subject.name}
                </Badge>
                <HStack gap={2}>
                  {isLocked && (
                    <Badge colorPalette="red" px={2} py={0.5} borderRadius="md" fontSize="3xs" fontWeight="black">
                      TERKUNCI
                    </Badge>
                  )}
                  {!isLocked && isCompleted && (
                    <Badge colorPalette="emerald" px={2} py={0.5} borderRadius="md" fontSize="3xs" fontWeight="black">
                      SELESAI
                    </Badge>
                  )}
                  {isInProgress && (
                    <Badge colorPalette="amber" px={2} py={0.5} borderRadius="md" fontSize="3xs" fontWeight="black" className="animate-pulse">
                      AKTIF
                    </Badge>
                  )}
                  {!isCompleted && !isInProgress && isNotStarted && (
                    <Badge colorPalette="blue" px={2} py={0.5} borderRadius="md" fontSize="3xs" fontWeight="black">
                      BELUM DIMULAI
                    </Badge>
                  )}
                  {!isCompleted && !isInProgress && !isNotStarted && isEnded && (
                    <Badge colorPalette="gray" px={2} py={0.5} borderRadius="md" fontSize="3xs" fontWeight="black">
                      SUDAH BERAKHIR
                    </Badge>
                  )}
                  <Text fontSize="sm" color="gray.450" fontWeight="semibold">
                    {exam.duration} Menit
                  </Text>
                </HStack>
              </Flex>
              
              <Heading size="md" fontWeight="bold" color="gray.800" mb={2} lineClamp={1}>
                {exam.title}
              </Heading>
              
              <Text color="gray.600" fontSize="sm" mb={4} lineClamp={2}>
                {exam.description}
              </Text>
              
              <Stack gap={1.5} fontSize="xs" color="gray.500" fontWeight="semibold" mb={6}>
                <HStack gap={1.5}>
                  <Calendar size={13} className="text-gray-400" />
                  <Text>Mulai: {startTime.toLocaleString('id-ID')}</Text>
                </HStack>
                <HStack gap={1.5}>
                  <Clock size={13} className="text-gray-400" />
                  <Text>Selesai: {endTime.toLocaleString('id-ID')}</Text>
                </HStack>
              </Stack>
            </Box>

            {isLocked ? (
              <Button
                w="full"
                py={5}
                bg="red.50"
                color="red.700"
                border="1px solid"
                borderColor="red.200"
                borderRadius="xl"
                fontWeight="extrabold"
                fontSize="sm"
                cursor="not-allowed"
                disabled
              >
                Sesi Ujian Terkunci
              </Button>
            ) : isCompleted ? (
              <Button
                w="full"
                py={5}
                bg="emerald.50"
                color="emerald.700"
                border="1px solid"
                borderColor="emerald.200"
                borderRadius="xl"
                fontWeight="extrabold"
                fontSize="sm"
                cursor="not-allowed"
                disabled
              >
                Sudah Dikerjakan
              </Button>
            ) : isEnded ? (
              <Button
                w="full"
                py={5}
                bg="gray.100"
                color="gray.500"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                fontWeight="extrabold"
                fontSize="sm"
                cursor="not-allowed"
                disabled
              >
                Sudah Berakhir
              </Button>
            ) : isNotStarted ? (
              <Button
                w="full"
                py={5}
                bg="gray.50"
                color="gray.400"
                border="1px dashed"
                borderColor="gray.200"
                borderRadius="xl"
                fontWeight="extrabold"
                fontSize="sm"
                cursor="not-allowed"
                disabled
              >
                Belum Dimulai
              </Button>
            ) : isInProgress ? (
              <Link href={`/exams/${exam.id}`} passHref style={{ width: '100%' }}>
                <Button
                  w="full"
                  py={5}
                  bg="amber.500"
                  color="white"
                  borderRadius="xl"
                  fontWeight="bold"
                  _hover={{ bg: 'amber.600', textDecoration: 'none' }}
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
                  py={5}
                  bg="indigo.600"
                  color="white"
                  borderRadius="xl"
                  fontWeight="bold"
                  _hover={{ bg: 'indigo.700', textDecoration: 'none' }}
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
        <Box gridColumn="1 / -1" textAlign="center" py={12} color="gray.500" fontStyle="italic">
          Belum ada ujian yang tersedia.
        </Box>
      )}
    </SimpleGrid>
  );
}
