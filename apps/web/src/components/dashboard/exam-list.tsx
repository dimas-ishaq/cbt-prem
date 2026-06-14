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
  Button,
  Spinner,
} from '@chakra-ui/react';

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
      {exams?.map((exam) => (
        <Box
          key={exam.id}
          p={6}
          bg="white"
          borderRadius="2xl"
          boxShadow="md"
          border="1px solid"
          borderColor="gray.100"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          transition="all 0.2s"
          _hover={{ translateY: '-4px', boxShadow: 'lg', borderColor: 'indigo.100' }}
        >
          <Box>
            <Flex justify="between" align="start" mb={4}>
              <Badge colorPalette="blue" px={2.5} py={1} borderRadius="lg" textTransform="uppercase" fontWeight="bold" fontSize="2xs">
                {exam.subject.name}
              </Badge>
              <Text fontSize="sm" color="gray.450" fontWeight="semibold">
                {exam.duration} Menit
              </Text>
            </Flex>
            
            <Heading size="md" fontWeight="bold" color="gray.800" mb={2} lineClamp={1}>
              {exam.title}
            </Heading>
            
            <Text color="gray.600" fontSize="sm" mb={4} lineClamp={2}>
              {exam.description}
            </Text>
            
            <Stack gap={1} fontSize="xs" color="gray.450" fontWeight="semibold" mb={6}>
              <Text>Mulai: {new Date(exam.startTime).toLocaleString('id-ID')}</Text>
              <Text>Selesai: {new Date(exam.endTime).toLocaleString('id-ID')}</Text>
            </Stack>
          </Box>

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
        </Box>
      ))}
      {exams?.length === 0 && (
        <Box gridColumn="1 / -1" textAlign="center" py={12} color="gray.500" fontStyle="italic">
          Belum ada ujian yang tersedia.
        </Box>
      )}
    </SimpleGrid>
  );
}
