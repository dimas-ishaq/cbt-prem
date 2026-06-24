'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { use } from 'react';
import { ChevronLeft, User, Award, Clock, FileText, FileDown, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Stack,
  Table,
  HStack,
  Spinner,
} from '@chakra-ui/react';

interface Student {
  user: {
    fullName: string;
    username: string;
  };
}

interface ExamSession {
  id: string;
  student: {
    user: {
      fullName: string;
      username: string;
    };
    nisn: string;
  };
  startTime: string;
  endTime: string;
  score: number | null;
  status: string;
  answers: any[];
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: exam } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}`);
      return response.data;
    },
  });

  const { data: sessions, isLoading } = useQuery<ExamSession[]>({
    queryKey: ['exam-sessions', id],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${id}`);
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${id}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results-${exam?.title || id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh">
        <Spinner size="lg" color="indigo.600" />
        <Text color="gray.600" mt={3} fontWeight="semibold">Loading results...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
        <Flex align="center" gap={4}>
          <Link href="/admin/exams" passHref>
            <Button variant="ghost" p={2} borderRadius="full" cursor="pointer">
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <Box>
            <Heading size="lg" fontWeight="bold" color="gray.900">
              Hasil Ujian: {exam?.title}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {exam?.subject.name} • {sessions?.length} Lembar Jawaban
            </Text>
          </Box>
        </Flex>
        <HStack gap={3}>
          <Link href={`/admin/results/${id}/essay-grading`} passHref>
            <Button
              variant="outline"
              colorPalette="orange"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              px={4}
              py={5}
              cursor="pointer"
            >
              <FileText size={20} />
              <Text>Koreksi Essay</Text>
            </Button>
          </Link>
          <Link href={`/admin/results/${id}/analytics`} passHref>
            <Button
              variant="outline"
              colorPalette="indigo"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              px={4}
              py={5}
              cursor="pointer"
            >
              <BarChart3 size={20} />
              <Text>Analisis Grafik</Text>
            </Button>
          </Link>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            colorPalette="green"
            borderRadius="xl"
            fontWeight="bold"
            fontSize="sm"
            px={4}
            py={5}
            cursor="pointer"
          >
            <FileDown size={20} />
            <Text>{exportMutation.isPending ? 'Mengekspor...' : 'Ekspor Excel'}</Text>
          </Button>
        </HStack>
      </Flex>

      <Box bg="white" borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" overflow="hidden">
        <Table.Root interactive>
          <Table.Header bg="gray.50">
            <Table.Row>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Siswa</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Durasi Pengerjaan</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Status</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600">Nilai Akhir</Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" textAlign="right">Aksi</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body color="gray.700">
            {sessions?.map((session) => {
              const start = new Date(session.startTime);
              const end = session.endTime ? new Date(session.endTime) : null;
              const diff = end ? Math.round((end.getTime() - start.getTime()) / 60000) : '-';

              return (
                <Table.Row key={session.id} _hover={{ bg: 'gray.50/40' }} transition="all 0.2s">
                  <Table.Cell px={6} py={4}>
                    <HStack gap={3}>
                      <Flex w={8} h={8} borderRadius="full" bg="blue.50" align="center" justify="center" color="blue.650">
                        <User size={16} />
                      </Flex>
                      <Box>
                        <Text fontWeight="bold" color="gray.900" fontSize="sm">{session.student.user.fullName}</Text>
                        <Text fontSize="3xs" color="gray.400" fontWeight="medium">@{session.student.user.username}</Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    <HStack gap={1}>
                      <Clock size={14} className="text-gray-400" />
                      <Text fontWeight="medium">{diff} menit</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <Badge
                      colorPalette={
                        session.status === 'FINISHED' || session.status === 'SUBMITTED' ? 'green' :
                        session.status === 'ONGOING' || session.status === 'IN_PROGRESS' ? 'blue' : 'gray'
                      }
                      px={2.5}
                      py={1}
                      borderRadius="full"
                      fontSize="3xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      {session.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <HStack gap={1}>
                      <Award size={16} className={session.score !== null ? 'text-amber-500' : 'text-gray-300'} />
                      <Text fontWeight="bold" color="gray.800">{session.score ?? '--'}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} textAlign="right">
                    <Link href={`/admin/results/sessions/${session.id}`} passHref>
                      <Button
                        as="span"
                        variant="ghost"
                        size="sm"
                        color="indigo.650"
                        _hover={{ bg: 'indigo.50', color: 'indigo.700' }}
                        borderRadius="lg"
                        fontWeight="bold"
                        fontSize="xs"
                        cursor="pointer"
                      >
                        <FileText size={16} />
                        <Text>Detail & Nilai</Text>
                      </Button>
                    </Link>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  );
}
