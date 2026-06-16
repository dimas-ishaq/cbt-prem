'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, Pencil, Calendar, Bookmark, Clock, Search, Filter } from 'lucide-react';
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
import toast from 'react-hot-toast';

interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  semester: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    exams: number;
    classes: number;
  };
}

export default function ExamGroupsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExamGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYear: '',
    semester: 'Ganjil',
    startDate: null as Date | null,
    endDate: null as Date | null,
    isActive: true,
  });

  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const { data: groups, isLoading } = useQuery<ExamGroup[]>({
    queryKey: ['exam-groups'],
    queryFn: async () => {
      const res = await api.get('/exam-groups');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => api.post('/exam-groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Kelompok ujian berhasil dibuat');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat kelompok ujian');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) =>
      api.patch(`/exam-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Kelompok ujian berhasil diubah');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah kelompok ujian');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/exam-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-groups'] });
      toast.success('Kelompok ujian berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus kelompok ujian');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kelompok ujian ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openEditModal = (group: ExamGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      academicYear: group.academicYear || '',
      semester: group.semester || 'Ganjil',
      startDate: group.startDate ? new Date(group.startDate) : null,
      endDate: group.endDate ? new Date(group.endDate) : null,
      isActive: group.isActive,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      academicYear: '',
      semester: 'Ganjil',
      startDate: null,
      endDate: null,
      isActive: true,
    });
    setEditingGroup(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredGroups = groups?.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesYear = selectedYear ? group.academicYear === selectedYear : true;
    const matchesSemester = selectedSemester ? group.semester === selectedSemester : true;
    return matchesSearch && matchesYear && matchesSemester;
  });

  return (
    <Stack gap={6} p={6}>
      <Flex align="center" justify="space-between">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Kelompok Ujian / Event
          </Heading>
          <Text color="gray.500" mt={1}>
            Kelola kelompok ujian akademik (UTS, UAS, dll) beserta tahun ajaran.
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
          onClick={openCreateModal}
          cursor="pointer"
        >
          <Plus size={20} style={{ marginRight: '6px' }} />
          Tambah Kelompok
        </Button>
      </Flex>

      <Flex direction={{ base: 'column', md: 'row' }} gap={4} justify="space-between" align={{ md: 'center' }}>
        <HStack gap={3} flexWrap="wrap">
          <Flex align="center" gap={2} bg="gray.50" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
            <Search size={16} className="text-gray-500" />
            <Input
              placeholder="Cari event..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="sm"
              variant="unstyled"
              flex={1}
              minW="180px"
              _placeholder={{ color: 'gray.400' }}
            />
          </Flex>
          <Flex align="center" gap={2} bg="gray.50" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#4a5568',
              }}
            >
              <option value="">Semua Tahun</option>
              {Array.from({ length: 7 }, (_, i) => {
                const y = new Date().getFullYear() - 3 + i;
                return <option key={y} value={`${y}/${y + 1}`}>{y}/{y + 1}</option>;
              })}
            </select>
          </Flex>
          <Flex align="center" gap={2} bg="gray.50" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#4a5568',
              }}
            >
              <option value="">Semua Semester</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </Flex>
        </HStack>
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
              {filteredGroups?.map((group) => (
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
              {filteredGroups?.length === 0 && (
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
                {editingGroup ? 'Edit Event Ujian' : 'Tambah Event Ujian'}
              </Heading>
              <Button variant="ghost" color="gray.400" onClick={closeModal} fontSize="xl" p={0} minW={0} cursor="pointer">×</Button>
            </Flex>
            <form onSubmit={handleSubmit}>
              <Stack gap={4} p={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Nama Event <span style={{ color: 'red' }}>*</span></Text>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Cth. ASAT Genap 2024" borderRadius="lg" />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Deskripsi</Text>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Opsional" borderRadius="lg" />
                </Box>
                <Flex gap={3}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Tahun Ajaran</Text>
                    <Input value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })} placeholder="Cth. 2024/2025" borderRadius="lg" />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Semester</Text>
                    <Input value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} placeholder="Cth. Genap" borderRadius="lg" />
                  </Box>
                </Flex>
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Mulai</Text>
                    <ChakraDatePicker 
                      value={formData.startDate} 
                      onChange={(date) => setFormData({ ...formData, startDate: date })} 
                      placeholder="Pilih waktu"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Berakhir</Text>
                    <ChakraDatePicker 
                      value={formData.endDate} 
                      onChange={(date) => setFormData({ ...formData, endDate: date })} 
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
