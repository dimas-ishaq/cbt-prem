'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
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
  Select,
  createListCollection,
  Checkbox,
  NativeSelect,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { Plus, Pencil, Trash2, Search, Users, GraduationCap, Mail, ArrowLeft, X, Download, Upload, Sparkles } from 'lucide-react';
import { useRombelQueries } from './hooks/useRombels';
import { filterRombels, filterRombelStudents } from './rombel-utils';
import type { Rombel, RombelFormData } from './rombel-types';
import { RombelFormModal } from './_components/rombel-form-modal';

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export function RombelContainer() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/rombels/template/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template-import-rombel.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/rombels/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      const data = res.data;
      const warningNote = data.warnings?.length > 0 ? ` dengan ${data.warnings.length} peringatan` : '';
      toast.success(`Berhasil mengimpor ${data.imported} rombel${warningNote}!`);
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Gagal mengimpor rombel');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
    e.target.value = '';
  };

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajorId, setFilterMajorId] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRombel, setEditingRombel] = useState<Rombel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    majorId: '',
    grade: '',
  });

  // Student list view state
  const [selectedRombelId, setSelectedRombelId] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Manage members modal state
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [allStudentsSearchTerm, setAllStudentsSearchTerm] = useState('');
  const [modalFilterMajorId, setModalFilterMajorId] = useState<string>('');
  const [modalFilterGrade, setModalFilterGrade] = useState<string>('');
  const [filterRombelId, setFilterRombelId] = useState<string>('');

  const {
    rombels,
    isLoading,
    majors,
    rombelDetail,
    isLoadingDetail,
    allStudents,
    isLoadingAllStudents,
  } = useRombelQueries(
    selectedRombelId,
    isManageOpen,
    modalFilterMajorId,
    filterRombelId,
    modalFilterGrade,
  );

  const majorOptions = useMemo(() => createListCollection({
    items: (majors || []).map((item) => ({ label: item.name, value: item.id }))
  }), [majors]);

  // Initialize selectedStudentIds when opening the manage modal
  useEffect(() => {
    if (isManageOpen && rombelDetail?.students) {
      setSelectedStudentIds(rombelDetail.students.map((s) => s.id));
    }
  }, [isManageOpen, rombelDetail]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newRombel: { name: string; majorId: string }) => api.post('/rombels', newRombel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Rombel berhasil ditambahkan!');
    },
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message || 'Gagal menambahkan rombel');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; majorId: string } }) =>
      api.patch(`/rombels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rombels'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Rombel berhasil diperbarui!');
    },
    onError: (err: ApiError) => {
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
    onError: (err: ApiError) => {
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
    onError: (err: ApiError) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui anggota rombel');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', majorId: '', grade: '' });
    setEditingRombel(null);
  };

  const handleEdit = (rombel: Rombel) => {
    setEditingRombel(rombel);
    let grade = '';
    let baseName = rombel.name;
    const parts = rombel.name.split(' ');
    if (['X', 'XI', 'XII'].includes(parts[0])) {
      grade = parts[0];
      baseName = parts.slice(1).join(' ');
    }
    setFormData({
      name: baseName,
      majorId: rombel.majorId,
      grade: grade,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.majorId) {
      toast.error('Silakan pilih jurusan terlebih dahulu.');
      return;
    }
    if (!formData.grade) {
      toast.error('Silakan pilih tingkat kelas terlebih dahulu.');
      return;
    }

    const payload = {
      name: `${formData.grade} ${formData.name.trim()}`,
      majorId: formData.majorId,
    };

    if (editingRombel) {
      updateMutation.mutate({ id: editingRombel.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredRombels = filterRombels(rombels, searchTerm, filterMajorId, filterGrade);
  const filteredStudents = filterRombelStudents(rombelDetail?.students, studentSearchTerm);

  if (isLoading) {
    return (
      <Flex minH="100vh" justify="center" align="center" bg="bg.canvas" color='text.primary'>
        <Spinner size="lg" color='brand.text' />
        <Text ml={3} color='text.secondary'>Memuat data rombel...</Text>
      </Flex>
    );
  }

  // DETAILED VIEW FOR REGISTERED STUDENTS (INLINE CONTENT)
  if (selectedRombelId) {
    return (
      <Stack gap={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
          <Box>
            <Button
              variant="outline"
              size="sm"
              borderRadius="md"
              borderColor="border.default"
              color="text.primary"
              bg="transparent"
              _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }}
              onClick={() => setSelectedRombelId(null)}
              cursor="pointer"
              mb={2}
            >
              <ArrowLeft size={14} style={{ marginRight: '4px' }} />
              Kembali ke Rombel
            </Button>
            <Heading size="lg" fontWeight="bold" color="text.primary">
              Anggota Kelas: {rombelDetail?.name || 'Memuat...'}
            </Heading>
            <Text color='text.secondary' fontSize="xs" mt={1}>
              Jurusan: {rombelDetail?.major?.name || '-'}
            </Text>
          </Box>
          {!isLoadingDetail && (
            <Button
              bg="brand.solid"
              color="text.inverted"
              _hover={{ bg: 'brand.solid' }}
              borderRadius="md"
              size="sm"
              onClick={() => {
                setAllStudentsSearchTerm('');
                setModalFilterMajorId(rombelDetail?.majorId || '');
                setModalFilterGrade('');
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
          <Flex justify="center" align="center" py={12}>
            <Spinner size="lg" color="brand.text" />
            <Text ml={3} color='text.secondary' fontSize="xs">Memuat daftar siswa...</Text>
          </Flex>
        ) : (
          <Stack gap={4}>
            {/* Search box inside page */}
            <Box bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" p={4}>
              <Box position="relative" flex={1} maxW="md">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color='text.secondary'>
                  <Search size={16} />
                </Box>
                <Input
                  pl={9}
                  placeholder="Cari berdasarkan nama atau NIS siswa..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  borderRadius="md"
                  borderColor="border.default"
                  bg="bg.canvas"
                  color="text.primary"
                  _placeholder={{ color: 'text.secondary' }}
                  _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                  size="sm"
                />
              </Box>
            </Box>

            {/* List container */}
            {!filteredStudents || filteredStudents.length === 0 ? (
              <Box
                bg="bg.surface"
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="border.default"
                borderRadius="lg"
                p={10}
                textAlign="center"
              >
                <Flex display="inline-flex" p={3} bg="bg.elevated" borderRadius="full" color='brand.text' mb={3}>
                  <GraduationCap size={24} />
                </Flex>
                <Heading size="sm" fontWeight="medium" color="text.primary">
                  Tidak Ada Anggota Kelas
                </Heading>
                <Text color='text.secondary' fontSize="xs" mt={1.5}>
                  Tidak ada siswa terdaftar dalam rombel ini. Klik tombol "+ Kelola Anggota Kelas" untuk menambahkan siswa.
                </Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {filteredStudents.map((student) => (
                  <Flex
                    key={student.id}
                    align="center"
                    gap={3}
                    p={3.5}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border.default"
                    bg="bg.surface"
                    shadow="shadows.card"
                    transition="all 0.15s"
                    _hover={{ shadow: 'shadows.elevated', borderColor: 'brand.text' }}
                  >
                    <Flex
                      w={9}
                      h={9}
                      bg="brand.subtle"
                      color="brand.text"
                      borderRadius="md"
                      align="center"
                      justify="center"
                      fontWeight="bold"
                      fontSize="md"
                      flexShrink={0}
                    >
                      {student.user.fullName.charAt(0).toUpperCase()}
                    </Flex>
                    <Box overflow="hidden">
                      <Text fontWeight="bold" color="text.primary" className="truncate" fontSize="sm">
                        {student.user.fullName}
                      </Text>
                      <Badge colorPalette="purple" variant="subtle" fontSize="2xs" borderRadius="sm" px={1.5} mt={0.5}>
                        NIS: {student.nis}
                      </Badge>
                      <Flex align="center" gap={1} mt={1} color='text.secondary' fontSize="2xs">
                        <Mail size={10} />
                        <Text className="truncate" color='text.secondary'>{student.user.email}</Text>
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
            bg="blackAlpha.700"
            backdropFilter="blur(10px)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={100}
          >
            <Box
              bg="bg.surface"
              borderRadius="lg"
              p={5}
              w="full"
              maxW="2xl"
              maxHeight="85vh"
              display="flex"
              flexDirection="column"
              shadow="shadows.elevated"
              borderWidth="1px"
              borderColor="border.default"
            >
              <Flex justify="space-between" align="center" pb={3} borderBottom="1px solid" borderColor="border.default" mb={3.5}>
                <Box>
                  <Heading size="md" color="text.primary">
                    Kelola Anggota Kelas: {rombelDetail?.name}
                  </Heading>
                  <Text fontSize="xs" color='text.secondary' mt={0.5}>
                    Filter siswa berdasarkan Jurusan / Kelas, lalu centang untuk memasukkan ke rombel ini.
                  </Text>
                </Box>
                <IconButton
                  aria-label="Tutup"
                  variant="ghost"
                  color='text.secondary'
                  _hover={{ bg: 'bg.elevated', color: 'text.primary' }}
                  borderRadius="sm"
                  onClick={() => setIsManageOpen(false)}
                  cursor="pointer"
                  size="sm"
                >
                  <X size={18} />
                </IconButton>
              </Flex>

              {isLoadingAllStudents ? (
                <Flex justify="center" align="center" flex={1} py={10}>
                  <Spinner size="lg" color="brand.text" />
                  <Text ml={3} color='text.secondary' fontSize="xs">Memuat semua data siswa...</Text>
                </Flex>
              ) : (
                <>
                  <Stack gap={2.5} mb={3.5}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={2.5}>
                      {/* Filter by Major */}
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color='text.secondary' mb={1}>Filter Jurusan</Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            value={modalFilterMajorId}
                            onChange={(e) => setModalFilterMajorId(e.target.value)}
                            borderRadius="md"
                            borderColor="border.default"
                            bg="bg.canvas"
                            color="text.primary"
                            _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                          >
                            <option value="" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Semua Jurusan</option>
                            {majors?.map((m) => (
                              <option key={m.id} value={m.id} style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>{m.name}</option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator color="text.secondary" />
                        </NativeSelect.Root>
                      </Box>
                      {/* Filter by Grade */}
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color='text.secondary' mb={1}>Tingkat Kelas</Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            value={modalFilterGrade}
                            onChange={(e) => {
                              setModalFilterGrade(e.target.value);
                              setFilterRombelId(''); // Reset rombel selection when grade changes
                            }}
                            borderRadius="md"
                            borderColor="border.default"
                            bg="bg.canvas"
                            color="text.primary"
                            _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                          >
                            <option value="" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Semua Tingkat</option>
                            <option value="X" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Kelas X</option>
                            <option value="XI" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Kelas XI</option>
                            <option value="XII" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Kelas XII</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator color="text.secondary" />
                        </NativeSelect.Root>
                      </Box>
                      {/* Filter by Rombel */}
                      <Box>
                        <Text fontSize="2xs" fontWeight="bold" color='text.secondary' mb={1}>Filter Rombel (Kelas)</Text>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            value={filterRombelId}
                            onChange={(e) => setFilterRombelId(e.target.value)}
                            borderRadius="md"
                            borderColor="border.default"
                            bg="bg.canvas"
                            color="text.primary"
                            _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                          >
                            <option value="" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Semua Rombel</option>
                            <option value="no-class" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Belum Memiliki Rombel</option>
                            {rombels
                              ?.filter((r) => !modalFilterGrade || r.name.toLowerCase().startsWith(modalFilterGrade.toLowerCase() + ' '))
                              ?.map((r) => (
                                <option key={r.id} value={r.id} style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>{r.name}</option>
                              ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator color="text.secondary" />
                        </NativeSelect.Root>
                      </Box>
                    </SimpleGrid>

                    <Box position="relative" w="full">
                      <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color='text.secondary' pointerEvents="none">
                        <Search size={14} />
                      </Box>
                      <Input
                        id="rombel-members-search-input"
                        pl={9}
                        size="sm"
                        placeholder="Cari nama atau NIS siswa..."
                        value={allStudentsSearchTerm}
                        onChange={(e) => setAllStudentsSearchTerm(e.target.value)}
                        borderRadius="md"
                        borderColor="border.default"
                        bg="bg.canvas"
                        color="text.primary"
                        _placeholder={{ color: 'text.secondary' }}
                        _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                      />
                    </Box>
                  </Stack>

                  {/* List with Checkboxes */}
                  <Box flex={1} overflowY="auto" pr={1} className="custom-scrollbar mb-3.5">
                    {(() => {
                      const filtered = allStudents?.filter((student) => {
                        const matchesSearch = student.user.fullName.toLowerCase().includes(allStudentsSearchTerm.toLowerCase()) ||
                          student.nis.includes(allStudentsSearchTerm);

                        const matchesMajor = !modalFilterMajorId || student.majorId === modalFilterMajorId;

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
                          <Flex direction="column" align="center" justify="center" py={8} bg="bg.elevated" borderRadius="md">
                            <GraduationCap size={32} className="text-gray-300 mb-1.5" />
                            <Text color='text.secondary' fontSize="xs" fontWeight="medium">
                              Tidak ada siswa yang cocok dengan kriteria filter.
                            </Text>
                          </Flex>
                        );
                      }

                      return (
                        <Stack gap={1.5}>
                          {filtered.map((student) => {
                            const isSelected = selectedStudentIds.includes(student.id);
                            return (
                              <Flex
                                key={student.id}
                                align="center"
                                justify="space-between"
                                p={2.5}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={isSelected ? 'brand.muted' : 'border.default'}
                                bg={isSelected ? 'brand.subtle' : 'bg.surface'}
                                transition="all 0.15s"
                                _hover={{ bg: isSelected ? 'brand.subtle' : 'bg.elevated' }}
                                cursor="pointer"
                                onClick={() => {
                                  setSelectedStudentIds((prev) =>
                                    prev.includes(student.id)
                                      ? prev.filter((id) => id !== student.id)
                                      : [...prev, student.id]
                                  );
                                }}
                              >
                                <Flex align="center" gap={2.5}>
                                  <Checkbox.Root
                                    checked={isSelected}
                                    onCheckedChange={() => {}} // handled by row onClick
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control cursor="pointer" />
                                  </Checkbox.Root>
                                  <Box>
                                    <Text fontWeight="semibold" color="text.primary" fontSize="xs">
                                      {student.user.fullName}
                                    </Text>
                                    <Badge colorPalette="purple" variant="subtle" fontSize="2xs" borderRadius="sm" px={1.5} mt={0.5}>
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

                  <Flex justify="flex-end" gap={2.5} pt={3} borderTop="1px solid" borderColor="border.default">
                    <Button
                      variant="outline"
                      onClick={() => setIsManageOpen(false)}
                      borderRadius="md"
                      cursor="pointer"
                      borderColor="border.default"
                      color="text.primary"
                      bg="transparent"
                      _hover={{ bg: 'bg.elevated' }}
                      size="sm"
                    >
                      Batal
                    </Button>
                    <Button
                      bg="brand.solid"
                      color="text.inverted"
                      _hover={{ bg: 'brand.solid' }}
                      borderRadius="md"
                      onClick={() => updateRombelStudentsMutation.mutate(selectedStudentIds)}
                      loading={updateRombelStudentsMutation.isPending}
                      cursor="pointer"
                      size="sm"
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
    <Stack gap={4} bg="bg.canvas" color='text.primary' p={{ base: 3, md: 4 }} minH="100vh">
      <Box bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" p={{ base: 4, md: 5 }} shadow="shadows.card">
        <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
          <Box maxW="2xl">
            <HStack gap={2} mb={1.5} color='brand.text' fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.12em">
              <Sparkles size={14} />
              <Text>Rombel dashboard</Text>
            </HStack>
            <Heading size="lg" fontWeight="bold" color='text.primary'>Rombongan Belajar</Heading>
            <Text color='text.secondary' fontSize="xs" mt={1}>Kelola kelas, jurusan, dan anggota siswa dalam tampilan dashboard yang padat dan cepat dipindai.</Text>
          </Box>
          <HStack gap={2} flexWrap="wrap" justify="flex-end">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" style={{ display: 'none' }} />
            <Button variant="outline" borderColor="border.default" color='text.primary' bg="transparent" _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }} borderRadius="md" size="sm" onClick={handleDownloadTemplate} cursor="pointer"><Download size={15} />Unduh Template</Button>
            <Button variant="outline" borderColor="border.default" color='text.primary' bg="transparent" _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }} borderRadius="md" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} cursor="pointer"><Upload size={15} />{importMutation.isPending ? 'Mengimpor...' : 'Impor CSV'}</Button>
            <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.solid' }} borderRadius="md" size="sm" onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer"><Plus size={16} />Tambah Rombel</Button>
          </HStack>
        </Flex>
      </Box>

      <Box bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" p={4}>
        <Flex gap={3} wrap="wrap" align="flex-end">
          <Box flex="1" minW={{ base: 'full', md: '18rem' }}>
            <Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={1.5}>Pencarian</Text>
            <Box position="relative" w="full"><Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color='text.secondary' pointerEvents="none"><Search size={14} /></Box><Input pl={9} size="sm" placeholder="Cari kelas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} borderRadius="md" borderColor="border.default" bg="bg.elevated" color='text.primary' _placeholder={{ color: 'text.secondary' }} _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }} /></Box>
          </Box>
          <Box minW={{ base: 'full', sm: '180px' }} flex={{ base: '1', sm: 'none' }}><Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={1.5}>Filter Tingkatan</Text>{(() => { const gradeItems = [{ label: 'Semua Tingkatan', value: '' }, { label: 'Kelas X', value: 'X' }, { label: 'Kelas XI', value: 'XI' }, { label: 'Kelas XII', value: 'XII' }]; const gradeCollection = createListCollection({ items: gradeItems }); const currentItem = gradeItems.find(item => item.value === filterGrade); return <Select.Root collection={gradeCollection} value={[filterGrade]} onValueChange={(details) => setFilterGrade(details.value[0] || '')} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Tingkatan">{currentItem?.label}</Select.ValueText></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content zIndex={100}>{gradeCollection.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root>; })()}</Box>
          <Box minW={{ base: 'full', sm: '220px' }} flex={{ base: '1', sm: 'none' }}><Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={1.5}>Filter Jurusan</Text>{(() => { const items = [{ label: 'Semua Jurusan', value: '' }, ...(majors || []).map((m) => ({ label: m.name, value: m.id }))]; const majorCollection = createListCollection({ items }); const currentItem = items.find(item => item.value === filterMajorId); return <Select.Root collection={majorCollection} value={[filterMajorId]} onValueChange={(details) => setFilterMajorId(details.value[0] || '')} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Jurusan">{currentItem?.label}</Select.ValueText></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content zIndex={100}>{majorCollection.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root>; })()}</Box>
        </Flex>
      </Box>

      {filteredRombels?.length === 0 ? (
        <Box bg="bg.surface" borderWidth="1px" borderStyle="dashed" borderColor="border.default" borderRadius="lg" p={10} textAlign="center">
          <Flex display="inline-flex" p={3} bg="bg.elevated" borderRadius="full" color='brand.text' mb={3}><Users size={24} /></Flex>
          <Heading size="sm" fontWeight="medium" color='text.primary'>Tidak Ada Rombel</Heading>
          <Text color='text.secondary' fontSize="xs" mt={1.5}>Belum ada kelas rombongan belajar yang terdaftar.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap={4}>
          {filteredRombels?.map((rombel) => (
            <Box key={rombel.id} bg="bg.surface" borderRadius="md" borderWidth="1px" borderColor="border.default" shadow="shadows.card" p={4} transition="all 0.15s" _hover={{ shadow: 'shadows.elevated', borderColor: 'brand.text' }} display="flex" flexDirection="column" justifyContent="space-between" minHeight="140px" cursor="pointer" onClick={() => { setSelectedRombelId(rombel.id); setStudentSearchTerm(''); }}>
              <Box>
                <Flex justify="space-between" align="flex-start" gap={2} mb={1.5}><Heading size="sm" fontWeight="bold" color='text.primary'>{rombel.name}</Heading><HStack gap={1} onClick={(e) => e.stopPropagation()}><IconButton aria-label="Edit Rombel" size="xs" variant="ghost" color='text.secondary' _hover={{ bg: 'bg.elevated', color: 'text.primary' }} borderRadius="sm" onClick={() => handleEdit(rombel)} cursor="pointer"><Pencil size={14} /></IconButton><IconButton aria-label="Hapus Rombel" size="xs" variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} borderRadius="sm" onClick={async () => { const confirmed = await confirmDialog({ title: 'Hapus Rombel', description: `Apakah Anda yakin ingin menghapus rombel "${rombel.name}"? Siswa di dalamnya akan kehilangan rombel terkait.`, confirmText: 'Hapus' }); if (confirmed) deleteMutation.mutate(rombel.id); }} cursor="pointer"><Trash2 size={14} /></IconButton></HStack></Flex>
                <Text fontSize="xs" fontWeight="medium" color='text.secondary'>{rombel.major?.name || 'Belum ada jurusan'}</Text>
              </Box>
              <Flex justify="space-between" align="center" mt={3} pt={2} borderTopWidth="1px" borderColor="border.default"><Badge colorPalette="purple" variant="subtle" borderRadius="sm" px={2} py={0.5} fontSize="2xs">{rombel._count?.students || 0} Siswa</Badge><Text fontSize="2xs" fontWeight="semibold" color='brand.text'>Lihat Anggota Kelas →</Text></Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <RombelFormModal isOpen={isModalOpen} editingName={editingRombel?.name} formData={formData} majorOptions={majorOptions} isSubmitting={createMutation.isPending || updateMutation.isPending} onClose={() => { setIsModalOpen(false); resetForm(); }} onSubmit={handleSubmit} onFormChange={setFormData} />
    </Stack>
  );
}

