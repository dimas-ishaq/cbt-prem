'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Input,
  Spinner,
  IconButton,
  HStack,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { Plus, Pencil, Trash2, Search, Users, GraduationCap, Mail, ArrowLeft, X } from 'lucide-react';

interface Student {
  id: string;
  nis: string;
  rombelId?: string | null;
  majorId?: string | null;
  user: {
    fullName: string;
    email: string;
    username: string;
  };
}

interface Rombel {
  id: string;
  name: string;
  majorId: string;
  major?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    students: number;
  };
  students?: Student[];
}

interface Major {
  id: string;
  name: string;
}

export default function RombelsPage() {
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
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    majorId: '',
  });

  // Student list view state
  const [selectedRombelId, setSelectedRombelId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Manage members modal state
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [allStudentsSearchTerm, setAllStudentsSearchTerm] = useState('');
  const [filterMajorId, setFilterMajorId] = useState<string>('');
  const [filterRombelId, setFilterRombelId] = useState<string>('');

  // Fetch rombels
  const { data: rombels, isLoading } = useQuery<Rombel[]>({
    queryKey: ['rombels'],
    queryFn: async () => {
      const response = await api.get('/rombels');
      return response.data;
    },
  });

  // Fetch majors for dropdown
  const { data: majors } = useQuery<Major[]>({
    queryKey: ['majors'],
    queryFn: async () => {
      const response = await api.get('/majors');
      return response.data;
    },
  });

  // Fetch single rombel detail (with students list) when selected
  const { data: rombelDetail, isLoading: isLoadingDetail } = useQuery<Rombel>({
    queryKey: ['rombel-detail', selectedRombelId],
    queryFn: async () => {
      if (!selectedRombelId) return null;
      const response = await api.get(`/rombels/${selectedRombelId}`);
      return response.data;
    },
    enabled: !!selectedRombelId,
  });

  // Fetch all students in the school for assignment
  const { data: allStudents, isLoading: isLoadingAllStudents } = useQuery<Student[]>({
    queryKey: ['all-students', filterMajorId, filterRombelId],
    queryFn: async () => {
      const response = await api.get('/students', {
        params: {
          majorId: filterMajorId || undefined,
          rombelId: filterRombelId || undefined,
        },
      });
      return response.data;
    },
    enabled: isManageOpen,
  });

  // Initialize selectedStudentIds when opening the manage modal
  useEffect(() => {
    if (isManageOpen && rombelDetail?.students) {
      setSelectedStudentIds(rombelDetail.students.map((s) => s.id));
    }
  }, [isManageOpen, rombelDetail]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newRombel: typeof formData) => api.post('/rombels', newRombel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Rombel berhasil ditambahkan!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan rombel');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      api.patch(`/rombels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Rombel berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui rombel');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rombels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      toast.success('Rombel berhasil dihapus!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus rombel');
    },
  });

  // Update Rombel Students mutation
  const updateRombelStudentsMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      api.post(`/rombels/${selectedRombelId}/students`, { studentIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rombel-detail', selectedRombelId] });
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      setIsManageOpen(false);
      toast.success('Anggota rombel berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui anggota rombel');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', majorId: '' });
    setEditingRombel(null);
  };

  const handleEdit = (rombel: Rombel) => {
    setEditingRombel(rombel);
    setFormData({
      name: rombel.name,
      majorId: rombel.majorId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.majorId) {
      toast.error('Silakan pilih jurusan terlebih dahulu.');
      return;
    }

    if (editingRombel) {
      updateMutation.mutate({ id: editingRombel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredRombels = rombels?.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.major?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = rombelDetail?.students?.filter((student) =>
    student.user.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.nis.includes(studentSearchTerm)
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat data rombel...</Text>
      </Flex>
    );
  }

  // DETAILED VIEW FOR REGISTERED STUDENTS (INLINE CONTENT)
  if (selectedRombelId) {
    return (
      <Stack gap={6}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Button
              variant="outline"
              size="sm"
              borderRadius="lg"
              onClick={() => setSelectedRombelId(null)}
              cursor="pointer"
              mb={2}
            >
              <ArrowLeft size={16} style={{ marginRight: '6px' }} />
              Kembali ke Rombel
            </Button>
            <Heading size="xl" fontWeight="bold" color="indigo.700">
              Anggota Kelas: {rombelDetail?.name || 'Memuat...'}
            </Heading>
            <Text color="gray.500" mt={1}>
              Jurusan: {rombelDetail?.major?.name || '-'}
            </Text>
          </Box>
          {!isLoadingDetail && (
            <Button
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
              size="sm"
              onClick={() => {
                setAllStudentsSearchTerm('');
                setFilterMajorId(rombelDetail?.majorId || '');
                setFilterRombelId('no-class');
                setIsManageOpen(true);
              }}
              cursor="pointer"
            >
              + Kelola Anggota Kelas
            </Button>
          )}
        </Flex>

        {isLoadingDetail ? (
          <Flex justify="center" align="center" py={16}>
            <Spinner size="lg" color="indigo.600" />
            <Text ml={3} color="gray.500">Memuat daftar siswa...</Text>
          </Flex>
        ) : (
          <Stack gap={6}>
            {/* Search box inside page */}
            <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" p={4}>
              <Box position="relative" flex={1} maxW="md">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
                  <Search size={18} />
                </Box>
                <Input
                  pl={10}
                  placeholder="Cari berdasarkan nama atau NIS siswa..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  borderRadius="lg"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                />
              </Box>
            </Box>

            {/* List container */}
            {!filteredStudents || filteredStudents.length === 0 ? (
              <Box
                bg="gray.50"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="gray.200"
                borderRadius="xl"
                p={12}
                textAlign="center"
              >
                <Flex display="inline-flex" p={4} bg="gray.100" borderRadius="full" color="gray.400" mb={4}>
                  <GraduationCap size={32} />
                </Flex>
                <Heading size="md" fontWeight="medium" color="gray.900">
                  Tidak Ada Anggota Kelas
                </Heading>
                <Text color="gray.500" mt={2}>
                  Tidak ada siswa terdaftar dalam rombel ini. Klik tombol "+ Kelola Anggota Kelas" untuk menambahkan siswa.
                </Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
                {filteredStudents.map((student) => (
                  <Flex
                    key={student.id}
                    align="center"
                    gap={4}
                    p={4.5}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    bg="white"
                    shadow="sm"
                    transition="all 0.15s"
                    _hover={{ shadow: 'md', borderColor: 'indigo.100' }}
                  >
                    <Flex
                      w={12}
                      h={12}
                      bg="indigo.50"
                      color="indigo.600"
                      borderRadius="full"
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      fontSize="lg"
                      flexShrink={0}
                    >
                      {student.user.fullName.charAt(0).toUpperCase()}
                    </Flex>
                    <Box overflow="hidden">
                      <Text fontWeight="bold" color="gray.800" className="truncate" fontSize="md">
                        {student.user.fullName}
                      </Text>
                      <Badge colorPalette="gray" variant="subtle" fontSize="xs" borderRadius="md" px={2} mt={1}>
                        NIS: {student.nis}
                      </Badge>
                      <Flex align="center" gap={1} mt={1.5} color="gray.400" fontSize="xs">
                        <Mail size={12} />
                        <Text className="truncate" color="gray.500">{student.user.email}</Text>
                      </Flex>
                    </Box>
                  </Flex>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        )}

        {/* MANAGE STUDENTS MODAL OVERLAY (WITH CHECKBOXES) */}
        {isManageOpen && (
          <Box
            position="fixed"
            inset={0}
            bg="blackAlpha.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={100}
          >
            <Box
              bg="white"
              borderRadius="2xl"
              p={6}
              w="full"
              maxW="2xl"
              maxHeight="85vh"
              display="flex"
              flexDirection="column"
              shadow="2xl"
            >
              <Flex justify="space-between" align="center" pb={4} borderBottom="1px solid" borderColor="gray.100" mb={4}>
                <Box>
                  <Heading size="md" color="indigo.700">
                    Kelola Anggota Kelas: {rombelDetail?.name}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" mt={0.5}>
                    Filter siswa berdasarkan Jurusan / Kelas, lalu centang untuk memasukkan ke rombel ini.
                  </Text>
                </Box>
                <IconButton
                  aria-label="Tutup"
                  variant="ghost"
                  borderRadius="full"
                  onClick={() => setIsManageOpen(false)}
                  cursor="pointer"
                >
                  <X size={20} />
                </IconButton>
              </Flex>

              {isLoadingAllStudents ? (
                <Flex justify="center" align="center" flex={1} py={12}>
                  <Spinner size="lg" color="indigo.600" />
                  <Text ml={3} color="gray.500">Memuat semua data siswa...</Text>
                </Flex>
              ) : (
                <>
                  {/* Filters block */}
                  <Stack gap={3} mb={4}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                      {/* Filter by Major */}
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Filter Jurusan</Text>
                        <select
                          value={filterMajorId}
                          onChange={(e) => setFilterMajorId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            backgroundColor: 'white',
                            outline: 'none',
                          }}
                        >
                          <option value="">Semua Jurusan</option>
                          {majors?.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </Box>
                      {/* Filter by Rombel */}
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>Filter Rombel (Kelas)</Text>
                        <select
                          value={filterRombelId}
                          onChange={(e) => setFilterRombelId(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            backgroundColor: 'white',
                            outline: 'none',
                          }}
                        >
                          <option value="">Semua Rombel</option>
                          <option value="no-class">Belum Memiliki Rombel</option>
                          {rombels?.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </Box>
                    </SimpleGrid>

                    {/* Text Search */}
                    <Box position="relative" w="full">
                      <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
                        <Search size={15} />
                      </Box>
                      <Input
                        pl={9}
                        size="sm"
                        placeholder="Cari nama atau NIS siswa..."
                        value={allStudentsSearchTerm}
                        onChange={(e) => setAllStudentsSearchTerm(e.target.value)}
                        borderRadius="md"
                        borderColor="gray.200"
                      />
                    </Box>
                  </Stack>

                  {/* List with Checkboxes */}
                  <Box flex={1} overflowY="auto" pr={1} className="custom-scrollbar mb-4">
                    {(() => {
                      const filtered = allStudents?.filter((student) => {
                        const matchesSearch = student.user.fullName.toLowerCase().includes(allStudentsSearchTerm.toLowerCase()) ||
                          student.nis.includes(allStudentsSearchTerm);

                        const matchesMajor = !filterMajorId || student.majorId === filterMajorId;

                        let matchesRombel = true;
                        if (filterRombelId === 'no-class') {
                          matchesRombel = !student.rombelId;
                        } else if (filterRombelId) {
                          matchesRombel = student.rombelId === filterRombelId;
                        }

                        return matchesSearch && matchesMajor && matchesRombel;
                      });

                      if (!filtered || filtered.length === 0) {
                        return (
                          <Flex direction="column" align="center" justify="center" py={12} bg="gray.50" borderRadius="xl">
                            <GraduationCap size={40} className="text-gray-300 mb-2" />
                            <Text color="gray.500" fontSize="sm" fontWeight="medium">
                              Tidak ada siswa yang cocok dengan kriteria filter.
                            </Text>
                          </Flex>
                        );
                      }

                      return (
                        <Stack gap={2}>
                          {filtered.map((student) => {
                            const isSelected = selectedStudentIds.includes(student.id);
                            return (
                              <Flex
                                key={student.id}
                                align="center"
                                justify="space-between"
                                p={3}
                                borderRadius="xl"
                                borderWidth="1px"
                                borderColor={isSelected ? 'indigo.150' : 'gray.100'}
                                bg={isSelected ? 'indigo.50/20' : 'white'}
                                transition="all 0.15s"
                                _hover={{ bg: isSelected ? 'indigo.50/30' : 'gray.50/60' }}
                                cursor="pointer"
                                onClick={() => {
                                  setSelectedStudentIds((prev) =>
                                    prev.includes(student.id)
                                      ? prev.filter((id) => id !== student.id)
                                      : [...prev, student.id]
                                  );
                                }}
                              >
                                <Flex align="center" gap={3}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by row onClick
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      cursor: 'pointer',
                                      accentColor: 'var(--chakra-colors-indigo-600)',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Box>
                                    <Text fontWeight="semibold" color="gray.850" fontSize="sm">
                                      {student.user.fullName}
                                    </Text>
                                    <Badge colorPalette="gray" fontSize="2xs" borderRadius="sm" px={1.5} mt={0.5}>
                                      NIS: {student.nis}
                                    </Badge>
                                  </Box>
                                </Flex>
                              </Flex>
                            );
                          })}
                        </Stack>
                      );
                    })()}
                  </Box>

                  {/* Footer */}
                  <Flex justify="flex-end" gap={3} pt={4} borderTop="1px solid" borderColor="gray.100">
                    <Button
                      variant="outline"
                      onClick={() => setIsManageOpen(false)}
                      borderRadius="lg"
                      cursor="pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      bg="indigo.600"
                      color="white"
                      _hover={{ bg: 'indigo.700' }}
                      borderRadius="lg"
                      onClick={() => updateRombelStudentsMutation.mutate(selectedStudentIds)}
                      loading={updateRombelStudentsMutation.isPending}
                      cursor="pointer"
                    >
                      Simpan Anggota ({selectedStudentIds.length})
                    </Button>
                  </Flex>
                </>
              )}
            </Box>
          </Box>
        )}
      </Stack>
    );
  }

  // DEFAULT GRID VIEW OF ROMBELS
  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Rombongan Belajar (Rombel)
          </Heading>
          <Text color="gray.500" mt={1}>
            Kelola daftar kelas dan kelompok belajar yang terintegrasi dengan jurusan.
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
          Tambah Rombel
        </Button>
      </Flex>

      {/* Search Bar */}
      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" p={4}>
        <Box position="relative" flex={1} maxW="md">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
            <Search size={18} />
          </Box>
          <Input
            pl={10}
            placeholder="Cari kelas (contoh: RPL, X, dsb)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            borderRadius="lg"
            borderColor="gray.200"
            _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
          />
        </Box>
      </Box>

      {/* Grid of Rombels */}
      {filteredRombels?.length === 0 ? (
        <Box
          bg="gray.50"
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="gray.200"
          borderRadius="xl"
          p={12}
          textAlign="center"
        >
          <Flex display="inline-flex" p={4} bg="gray.100" borderRadius="full" color="gray.400" mb={4}>
            <Users size={32} />
          </Flex>
          <Heading size="md" fontWeight="medium" color="gray.900">
            Tidak Ada Rombel
          </Heading>
          <Text color="gray.500" mt={2}>
            Belum ada kelas rombongan belajar yang terdaftar.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {filteredRombels?.map((rombel) => (
            <Box
              key={rombel.id}
              bg="white"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              shadow="sm"
              p={5}
              transition="all 0.2s"
              _hover={{ shadow: 'md', borderColor: 'indigo.200', transform: 'translateY(-1px)' }}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              minHeight="170px"
              cursor="pointer"
              onClick={() => {
                setSelectedRombelId(rombel.id);
                setStudentSearchTerm('');
              }}
            >
              <Box>
                <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
                  <Heading size="md" fontWeight="bold" color="indigo.700">
                    {rombel.name}
                  </Heading>
                  <HStack gap={1} onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      aria-label="Edit Rombel"
                      size="xs"
                      variant="ghost"
                      color="gray.500"
                      _hover={{ bg: 'gray.100', color: 'indigo.600' }}
                      borderRadius="md"
                      onClick={() => handleEdit(rombel)}
                      cursor="pointer"
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton
                      aria-label="Hapus Rombel"
                      size="xs"
                      variant="ghost"
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      borderRadius="md"
                      onClick={async () => {
                        const confirmed = await confirmDialog({
                          title: 'Hapus Rombel',
                          description: `Apakah Anda yakin ingin menghapus rombel "${rombel.name}"? Siswa di dalamnya akan kehilangan rombel terkait.`,
                          confirmText: 'Hapus',
                        });
                        if (confirmed) {
                          deleteMutation.mutate(rombel.id);
                        }
                      }}
                      cursor="pointer"
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </HStack>
                </Flex>
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                  {rombel.major?.name || 'Belum ada jurusan'}
                </Text>
              </Box>

              <Flex justify="space-between" align="center" mt={4} pt={3} borderTopWidth="1px" borderColor="gray.50">
                <Badge colorPalette="indigo" variant="subtle" borderRadius="md" px={2.5} py={0.5}>
                  {rombel._count?.students || 0} Siswa
                </Badge>
                <Text fontSize="xs" fontWeight="semibold" color="indigo.600" _hover={{ color: 'indigo.800' }}>
                  Lihat Anggota Kelas &rarr;
                </Text>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}

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
              {editingRombel ? 'Ubah Rombel' : 'Tambah Rombel Baru'}
            </Heading>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Nama Rombel / Kelas <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: X RPL 1, XI TKJ 2"
                    borderRadius="lg"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Pilih Jurusan <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <select
                    required
                    value={formData.majorId}
                    onChange={(e) => setFormData({ ...formData, majorId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--chakra-colors-gray-200)',
                      backgroundColor: 'white',
                      color: 'var(--chakra-colors-gray-800)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="" disabled>-- Pilih Jurusan --</option>
                    {majors?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
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
