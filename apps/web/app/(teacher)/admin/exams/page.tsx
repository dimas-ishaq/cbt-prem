'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, FileText, Trash2, Calendar, Clock, Lock } from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Badge,
  HStack,
  Stack,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/ui/confirmation-dialog';

interface Exam {
  id: string;
  title: string;
  subject: {
    name: string;
  };
  examGroup?: {
    name: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  token?: string;
}

const statusColorMap: Record<string, { bg: string; color: string }> = {
  PUBLISHED: { bg: 'green.100', color: 'green.700' },
  ONGOING: { bg: 'blue.100', color: 'blue.700' },
  COMPLETED: { bg: 'gray.100', color: 'gray.700' },
  DRAFT: { bg: 'yellow.100', color: 'yellow.700' },
};

export default function ExamsPage() {
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Ujian berhasil dihapus!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus ujian');
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat data ujian...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Ujian
          </Heading>
          <Text color="gray.500" mt={1}>
            Jadwalkan dan kelola ujian mata pelajaran.
          </Text>
        </Box>
        <Button
          asChild
          bg="indigo.600"
          color="white"
          _hover={{ bg: 'indigo.700' }}
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="medium"
          cursor="pointer"
        >
          <Link href="/admin/exams/create">
            <Plus size={20} />
            Jadwalkan Ujian
          </Link>
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Judul Ujian
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Mata Pelajaran
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Jadwal
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Status
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign="end">
                Aksi
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {exams?.map((exam) => {
              const sc = statusColorMap[exam.status] ?? { bg: 'yellow.100', color: 'yellow.700' };
              return (
                <Table.Row key={exam.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                  <Table.Cell px={6} py={4}>
                    <Text fontWeight="medium" color="gray.900">{exam.title}</Text>
                    {exam.examGroup && (
                      <Badge bg="indigo.50" color="indigo.700" fontSize="2xs" mt={1} mr={2}>
                        {exam.examGroup.name}
                      </Badge>
                    )}
                    {exam.token && (
                      <HStack gap={1} mt={1} color="gray.400" fontSize="xs" display="inline-flex">
                        <Lock size={12} />
                        <Text>Token: {exam.token}</Text>
                      </HStack>
                    )}
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">{exam.subject.name}</Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    <HStack gap={1}>
                      <Calendar size={14} style={{ color: '#9ca3af' }} />
                      <Text>{new Date(exam.startTime).toLocaleDateString()}</Text>
                    </HStack>
                    <HStack gap={1} mt={1} color="gray.500">
                      <Clock size={14} style={{ color: '#9ca3af' }} />
                      <Text>{exam.duration} menit</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <Badge
                      px={2}
                      py={1}
                      fontSize="xs"
                      fontWeight="bold"
                      borderRadius="full"
                      bg={sc.bg}
                      color={sc.color}
                    >
                      {exam.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} textAlign="end">
                    <HStack gap={2} justify="flex-end">
                      <IconButton
                        asChild
                        variant="ghost"
                        color="indigo.600"
                        _hover={{ bg: 'indigo.50' }}
                        size="sm"
                        borderRadius="lg"
                        aria-label="Lihat Hasil"
                      >
                        <Link href={`/admin/results/${exam.id}`}>
                          <FileText size={18} />
                        </Link>
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        color="red.500"
                        _hover={{ bg: 'red.50' }}
                        size="sm"
                        borderRadius="lg"
                        aria-label="Delete Exam"
                        onClick={async () => {
                          const confirmed = await confirmDialog({
                            title: 'Hapus Ujian',
                            description: 'Apakah Anda yakin ingin menghapus ujian ini?',
                            confirmText: 'Hapus'
                          });
                          if (confirmed) {
                            deleteMutation.mutate(exam.id);
                          }
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              );
            })}
            {exams?.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
                  Belum ada ujian yang dijadwalkan.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Stack>
  );
}
