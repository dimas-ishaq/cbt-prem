'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, Pencil, Calendar, Bookmark, Clock } from 'lucide-react';
import { useState, useRef } from 'react';
import { ChakraDatePicker } from '@/components/ui/chakra-date-picker';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Stack,
  Input,
  Spinner,
  IconButton,
  HStack,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';

interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  _count: {
    exams: number;
  };
}

export default function ExamGroupsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    academicYear: '',
    semester: '',
    startDateTime: null as Date | null,
    endDateTime: null as Date | null,
  });



  const { data: groups, isLoading } = useQuery<ExamGroup[]>({
    queryKey: ['exam-groups'],
    queryFn: async () => {
      const response = await api.get('/exam-groups');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/exam-groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] });
      alert("Berhasil menyimpan data kelompok ujian!");
      closeModal();
    },
    onError: (error: any) => {
      alert("Gagal menyimpan data: " + (error.response?.data?.message || error.message));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => api.patch(`/exam-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] });
      alert("Berhasil memperbarui data kelompok ujian!");
      closeModal();
    },
    onError: (error: any) => {
      alert("Gagal memperbarui data: " + (error.response?.data?.message || error.message));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exam-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] });
      alert("Data berhasil dihapus!");
    },
    onError: (error: any) => {
      alert("Gagal menghapus data: " + (error.response?.data?.message || error.message));
    }
  });

  const openCreateModal = () => {
    setForm({ name: '', description: '', academicYear: '', semester: '', startDateTime: null, endDateTime: null });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (group: ExamGroup) => {
    setForm({
      name: group.name,
      description: group.description || '',
      academicYear: group.academicYear || '',
      semester: group.semester || '',
      startDateTime: group.startDate ? new Date(group.startDate) : null,
      endDateTime: group.endDate ? new Date(group.endDate) : null,
    });
    setEditingId(group.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name,
      description: form.description,
      academicYear: form.academicYear,
      semester: form.semester,
    };
    
    if (form.startDateTime) {
      payload.startDate = form.startDateTime.toISOString();
    }
    if (form.endDateTime) {
      payload.endDate = form.endDateTime.toISOString();
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Event / Kelompok Ujian
          </Heading>
          <Text color="gray.500" mt={1}>
            Kelola pengelompokan ujian seperti ASAT, ASTS, Try Out, dll.
          </Text>
        </Box>
        <Button
          bg="indigo.600"
          color="white"
          _hover={{ bg: 'indigo.700' }}
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="medium"
          cursor="pointer"
          onClick={openCreateModal}
        >
          <Plus size={20} style={{ marginRight: '8px' }} />
          Tambah Event
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        {isLoading ? (
          <Flex justify="center" align="center" py={16}>
            <Spinner size="lg" color="indigo.600" />
            <Text ml={3} color="gray.500">Loading...</Text>
          </Flex>
        ) : (
          <Table.Root size="md">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                  Nama Event
                </Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                  Tahun Ajaran / Semester
                </Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                  Total Ujian
                </Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign="end">
                  Aksi
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {groups?.map((group) => (
                <Table.Row key={group.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                  <Table.Cell px={6} py={4}>
                    <Text fontWeight="medium" color="gray.900">{group.name}</Text>
                    {group.description && (
                      <Text color="gray.500" fontSize="xs" mt={0.5}>{group.description}</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    <HStack gap={2}>
                      <Badge bg="blue.50" color="blue.700" px={2} py={1} borderRadius="md" fontWeight="medium">
                        {group.academicYear || '-'}
                      </Badge>
                      <Badge bg="teal.50" color="teal.700" px={2} py={1} borderRadius="md" fontWeight="medium">
                        {group.semester || '-'}
                      </Badge>
                    </HStack>
                    {(group.startDate || group.endDate) && (
                      <Text color="gray.500" fontSize="xs" mt={1.5}>
                        {group.startDate ? new Date(group.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '...'} - {group.endDate ? new Date(group.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '...'}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell px={6} py={4}>
                    <Badge bg="indigo.50" color="indigo.700" borderRadius="full" px={3} py={1}>
                      {group._count.exams} Mapel
                    </Badge>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} textAlign="end">
                    <HStack gap={2} justify="flex-end">
                      <IconButton
                        variant="ghost"
                        color="indigo.600"
                        _hover={{ bg: 'indigo.50' }}
                        size="sm"
                        borderRadius="lg"
                        aria-label="Edit"
                        onClick={() => openEditModal(group)}
                        cursor="pointer"
                      >
                        <Pencil size={18} />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        color="red.600"
                        _hover={{ bg: 'red.50' }}
                        size="sm"
                        borderRadius="lg"
                        aria-label="Delete"
                        onClick={() => {
                          if (confirm('Yakin ingin menghapus kelompok ujian ini? Ujian yang ada di dalamnya tidak akan terhapus, hanya labelnya yang hilang.')) {
                            deleteMutation.mutate(group.id);
                          }
                        }}
                        cursor="pointer"
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
              {groups?.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={4} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
                    Belum ada kelompok ujian.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Modal Form */}
      {isModalOpen && (
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
              <Heading size="md" fontWeight="bold" color="gray.900">
                {editingId ? 'Edit Event Ujian' : 'Tambah Event Ujian'}
              </Heading>
              <Button variant="ghost" color="gray.400" onClick={closeModal} fontSize="xl" p={0} minW={0} cursor="pointer">×</Button>
            </Flex>
            <form onSubmit={handleSubmit}>
              <Stack gap={4} p={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Nama Event <span style={{ color: 'red' }}>*</span></Text>
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cth. ASAT Genap 2024" borderRadius="lg" />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Deskripsi</Text>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opsional" borderRadius="lg" />
                </Box>
                <Flex gap={3}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Tahun Ajaran</Text>
                    <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="Cth. 2024/2025" borderRadius="lg" />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Semester</Text>
                    <Input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="Cth. Genap" borderRadius="lg" />
                  </Box>
                </Flex>
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Mulai</Text>
                    <ChakraDatePicker 
                      value={form.startDateTime} 
                      onChange={(date) => setForm({ ...form, startDateTime: date })} 
                      placeholder="Pilih waktu"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Berakhir</Text>
                    <ChakraDatePicker 
                      value={form.endDateTime} 
                      onChange={(date) => setForm({ ...form, endDateTime: date })} 
                      placeholder="Pilih waktu"
                    />
                  </Box>
                </SimpleGrid>
                <Flex gap={3} pt={4}>
                  <Button type="button" onClick={closeModal} flex={1} variant="outline" borderRadius="lg" cursor="pointer">Batal</Button>
                  <Button type="submit" flex={1} bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" cursor="pointer" loading={createMutation.isPending || updateMutation.isPending}>
                    Simpan
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
