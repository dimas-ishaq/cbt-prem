'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Stack,
  Input,
  Textarea,
  Spinner,
  IconButton,
  HStack,
  Grid,
  Badge,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { Plus, Pencil, Trash2, Search, GraduationCap } from 'lucide-react';
import { TablePagination } from '@/components/ui/pagination';

interface Major {
  id: string;
  name: string;
  code: string;
  description: string | null;
  _count?: {
    students: number;
  };
}

export default function MajorsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Fetch majors
  const { data: majors, isLoading } = useQuery<Major[]>({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await api.get('/majors');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newMajor: typeof formData) => api.post('/majors', newMajor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Jurusan berhasil ditambahkan!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan jurusan');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      api.put(`/majors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Jurusan berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui jurusan');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/majors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['majors'] });
      toast.success('Jurusan berhasil dihapus!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus jurusan');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
    setEditingMajor(null);
  };

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setFormData({
      name: major.name,
      code: major.code,
      description: major.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMajor) {
      updateMutation.mutate({ id: editingMajor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredMajors = useMemo(() => {
    return (majors || []).filter((m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [majors, searchTerm]);

  const paginatedMajors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMajors.slice(start, start + pageSize);
  }, [filteredMajors, currentPage, pageSize]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat data jurusan...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Konsentrasi Keahlian (Jurusan)
          </Heading>
          <Text color="gray.500" mt={1}>
            Kelola daftar jurusan dan konsentrasi keahlian akademik sekolah.
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
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          cursor="pointer"
        >
          <Plus size={20} style={{ marginRight: '6px' }} />
          Tambah Jurusan
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Flex p={4} borderBottom="1px solid" borderColor="gray.100" align="center" bg="gray.50">
          <Box position="relative" flex={1} maxW="md">
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
              <Search size={18} />
            </Box>
            <Input
              pl={10}
              placeholder="Cari jurusan berdasarkan nama atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
              borderColor="gray.200"
              _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
            />
          </Box>
        </Flex>

        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Kode Jurusan
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Nama Konsentrasi Keahlian
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Deskripsi
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Total Siswa
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign="end">
                Aksi
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {paginatedMajors?.map((major) => (
              <Table.Row key={major.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                <Table.Cell px={6} py={4} fontFamily="mono" fontSize="sm" fontWeight="bold" color="indigo.600">
                  {major.code}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontWeight="semibold" color="gray.900">
                  {major.name}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.500" maxW="xs" truncate>
                  {major.description || '-'}
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Badge colorPalette="blue" variant="subtle" borderRadius="md" px={2} py={0.5}>
                    {major._count?.students || 0} Siswa
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
                      aria-label="Edit Jurusan"
                      onClick={() => handleEdit(major)}
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
                      aria-label="Delete Jurusan"
                      onClick={async () => {
                        const confirmed = await confirmDialog({
                          title: 'Hapus Jurusan',
                          description: `Apakah Anda yakin ingin menghapus jurusan "${major.name}"? Siswa yang terikat akan kehilangan asosiasi jurusan.`,
                          confirmText: 'Hapus'
                        });
                        if (confirmed) {
                          deleteMutation.mutate(major.id);
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
            {filteredMajors?.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
                  Tidak ada data jurusan yang ditemukan.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
        <TablePagination
          currentPage={currentPage}
          totalCount={filteredMajors.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p={8}
            w="full"
            maxW="md"
            shadow="2xl"
          >
            <Heading size="lg" fontWeight="bold" mb={6}>
              {editingMajor ? 'Ubah Konsentrasi Keahlian' : 'Tambah Jurusan Baru'}
            </Heading>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Kode Jurusan <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. RPL, TKJ, MM"
                    borderRadius="lg"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Nama Jurusan <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rekayasa Perangkat Lunak"
                    borderRadius="lg"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Deskripsi Ringkas
                  </Text>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Keterangan mengenai konsentrasi keahlian..."
                    borderRadius="lg"
                    rows={3}
                  />
                </Box>

                <Flex justify="flex-end" gap={3} pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    borderRadius="lg"
                    cursor="pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    loading={createMutation.isPending || updateMutation.isPending}
                    cursor="pointer"
                  >
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
