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
    mutationFn: (newRombel: typeof formData) => api.post('/rombels', newRombel),
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
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
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
            <Text color='text.secondary' mt={1}>
              Jurusan: {rombelDetail?.major?.name || '-'}
            </Text>
          </Box>
          {!isLoadingDetail && (
            <Button
              bg="indigo.600"
              color="text.inverted"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
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
          <Flex justify="center" align="center" py={16}>
            <Spinner size="lg" color="indigo.600" />
            <Text ml={3} color='text.secondary'>Memuat daftar siswa...</Text>
          </Flex>
        ) : (
          <Stack gap={6}>
            {/* Search box inside page */}
            <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" p={4}>
              <Box position="relative" flex={1} maxW="md">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color='text.secondary'>
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
                <Flex display="inline-flex" p={4} bg="gray.100" borderRadius="full" color='text.secondary' mb={4}>
                  <GraduationCap size={32} />
                </Flex>
                <Heading size="md" fontWeight="medium" color="gray.900">
                  Tidak Ada Anggota Kelas
                </Heading>
                <Text color='text.secondary' mt={2}>
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
                      <Flex align="center" gap={1} mt={1.5} color='text.secondary' fontSize="xs">
                        <Mail size={12} />
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
                  <Text fontSize="sm" color='text.secondary' mt={0.5}>
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
                  <Text ml={3} color='text.secondary'>Memuat semua data siswa...</Text>
                </Flex>
              ) : (
                <>
                  <Stack gap={3} mb={4}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                      {/* Filter by Major */}
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={1}>Filter Jurusan</Text>
                        <select
                          value={modalFilterMajorId}
                          onChange={(e) => setModalFilterMajorId(e.target.value)}
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
                      {/* Filter by Grade */}
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={1}>Tingkat Kelas</Text>
                        <select
                          value={modalFilterGrade}
                          onChange={(e) => {
                            setModalFilterGrade(e.target.value);
                            setFilterRombelId(''); // Reset rombel selection when grade changes
                          }}
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
                          <option value="">Semua Tingkat</option>
                          <option value="X">Kelas X</option>
                          <option value="XI">Kelas XI</option>
                          <option value="XII">Kelas XII</option>
                        </select>
                      </Box>
                      {/* Filter by Rombel */}
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={1}>Filter Rombel (Kelas)</Text>
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
                          {rombels
                            ?.filter((r) => !modalFilterGrade || r.name.toLowerCase().startsWith(modalFilterGrade.toLowerCase() + ' '))
                            ?.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                      </Box>
                    </SimpleGrid>

                    <Box position="relative" w="full">
                      <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color='text.secondary' pointerEvents="none">
                        <Search size={15} />
                      </Box>
                      <Input
                        id="rombel-members-search-input"
                        pl={9}
                        size="sm"
                        placeholder="Cari nama atau NIS siswa..."
                        value={allStudentsSearchTerm}
                        onChange={(e) => setAllStudentsSearchTerm(e.target.value)}
                        borderRadius="md"
                        borderColor="gray.200"
                        bg="white"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                  </Stack>

                  {/* List with Checkboxes */}
                  <Box flex={1} overflowY="auto" pr={1} className="custom-scrollbar mb-4">
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
                          <Flex direction="column" align="center" justify="center" py={12} bg="gray.50" borderRadius="xl">
                            <GraduationCap size={40} className="text-gray-300 mb-2" />
                            <Text color='text.secondary' fontSize="sm" fontWeight="medium">
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
                                  <Checkbox.Root
                                    checked={isSelected}
                                    onCheckedChange={() => {}} // handled by row onClick
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control cursor="pointer" />
                                  </Checkbox.Root>
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

                  <Flex justify="flex-end" gap={3} pt={4} borderTop="1px solid" borderColor="gray.100">
                    <Button
                      variant="outline"
                      onClick={() => setIsManageOpen(false)}
                      borderRadius="lg"
                      cursor="pointer"
                      borderColor="gray.200"
                      color="gray.700"
                      _hover={{ bg: 'gray.50' }}
                    >
                      Batal
                    </Button>
                    <Button
                      bg="indigo.600"
                      color="text.inverted"
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
    <Stack gap={6} bg="bg.canvas" color='text.primary' p={{ base: 4, md: 6 }} minH="100vh">
      <Box bg="bg.surface" borderRadius="2xl" borderWidth="1px" borderColor="border.default" p={{ base: 5, md: 6 }} shadow="0 4px 16px rgba(0,0,0,0.5)">
        <Flex justify="space-between" align="flex-start" gap={4} wrap="wrap">
          <Box maxW="2xl">
            <HStack gap={2} mb={2} color='brand.text' fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.12em">
              <Sparkles size={14} />
              <Text>Rombel dashboard</Text>
            </HStack>
            <Heading size="xl" fontWeight="bold" color='text.primary'>Rombongan Belajar</Heading>
            <Text color='text.secondary' mt={2}>Kelola kelas, jurusan, dan anggota siswa dalam tampilan dashboard yang padat dan cepat dipindai.</Text>
          </Box>
          <HStack gap={3} flexWrap="wrap" justify="flex-end">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" style={{ display: 'none' }} />
            <Button variant="outline" borderColor="border.default" color='text.primary' bg="transparent" _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }} borderRadius="lg" onClick={handleDownloadTemplate} cursor="pointer"><Download size={18} />Unduh Template</Button>
            <Button variant="outline" borderColor="border.default" color='text.primary' bg="transparent" _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }} borderRadius="lg" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending} cursor="pointer"><Upload size={18} />{importMutation.isPending ? 'Mengimpor...' : 'Impor CSV'}</Button>
            <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.solid' }} borderRadius="lg" onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer"><Plus size={20} />Tambah Rombel</Button>
          </HStack>
        </Flex>
      </Box>

      <Box bg="bg.surface" borderRadius="2xl" borderWidth="1px" borderColor="border.default" p={5}>
        <Flex gap={4} wrap="wrap" align="flex-end">
          <Box flex="1" minW={{ base: 'full', md: '18rem' }}>
            <Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={2}>Pencarian</Text>
            <Box position="relative" w="full"><Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color='text.secondary' pointerEvents="none"><Search size={16} /></Box><Input pl={10} size="sm" placeholder="Cari kelas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} borderRadius="lg" borderColor="border.default" bg="bg.elevated" color='text.primary' _placeholder={{ color: 'text.secondary' }} _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }} /></Box>
          </Box>
          <Box minW={{ base: 'full', sm: '180px' }} flex={{ base: '1', sm: 'none' }}><Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={2}>Filter Tingkatan</Text>{(() => { const gradeItems = [{ label: 'Semua Tingkatan', value: '' }, { label: 'Kelas X', value: 'X' }, { label: 'Kelas XI', value: 'XI' }, { label: 'Kelas XII', value: 'XII' }]; const gradeCollection = createListCollection({ items: gradeItems }); const currentItem = gradeItems.find(item => item.value === filterGrade); return <Select.Root collection={gradeCollection} value={[filterGrade]} onValueChange={(details) => setFilterGrade(details.value[0] || '')} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Tingkatan">{currentItem?.label}</Select.ValueText></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content zIndex={100}>{gradeCollection.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root>; })()}</Box>
          <Box minW={{ base: 'full', sm: '220px' }} flex={{ base: '1', sm: 'none' }}><Text fontSize="xs" fontWeight="bold" color='text.secondary' mb={2}>Filter Jurusan</Text>{(() => { const items = [{ label: 'Semua Jurusan', value: '' }, ...(majors || []).map((m) => ({ label: m.name, value: m.id }))]; const majorCollection = createListCollection({ items }); const currentItem = items.find(item => item.value === filterMajorId); return <Select.Root collection={majorCollection} value={[filterMajorId]} onValueChange={(details) => setFilterMajorId(details.value[0] || '')} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Jurusan">{currentItem?.label}</Select.ValueText></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content zIndex={100}>{majorCollection.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root>; })()}</Box>
        </Flex>
      </Box>

      {filteredRombels?.length === 0 ? (
        <Box bg="bg.surface" borderWidth="1px" borderStyle="dashed" borderColor="border.default" borderRadius="2xl" p={12} textAlign="center">
          <Flex display="inline-flex" p={4} bg="bg.elevated" borderRadius="full" color='brand.text' mb={4}><Users size={32} /></Flex>
          <Heading size="md" fontWeight="medium" color='text.primary'>Tidak Ada Rombel</Heading>
          <Text color='text.secondary' mt={2}>Belum ada kelas rombongan belajar yang terdaftar.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 2 }} gap={6}>
          {filteredRombels?.map((rombel) => (
            <Box key={rombel.id} bg="bg.surface" borderRadius="2xl" borderWidth="1px" borderColor="border.default" shadow="0 1px 4px rgba(0,0,0,0.4)" p={5} transition="all 0.2s" _hover={{ shadow: '0 4px 16px rgba(0,0,0,0.5)', borderColor: 'brand.text', transform: 'translateY(-1px)' }} display="flex" flexDirection="column" justifyContent="space-between" minHeight="180px" cursor="pointer" onClick={() => { setSelectedRombelId(rombel.id); setStudentSearchTerm(''); }}>
              <Box>
                <Flex justify="space-between" align="flex-start" gap={2} mb={2}><Heading size="md" fontWeight="bold" color='text.primary'>{rombel.name}</Heading><HStack gap={1} onClick={(e) => e.stopPropagation()}><IconButton aria-label="Edit Rombel" size="xs" variant="ghost" color='text.secondary' _hover={{ bg: 'bg.elevated', color: 'text.primary' }} borderRadius="md" onClick={() => handleEdit(rombel)} cursor="pointer"><Pencil size={15} /></IconButton><IconButton aria-label="Hapus Rombel" size="xs" variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} borderRadius="md" onClick={async () => { const confirmed = await confirmDialog({ title: 'Hapus Rombel', description: `Apakah Anda yakin ingin menghapus rombel "${rombel.name}"? Siswa di dalamnya akan kehilangan rombel terkait.`, confirmText: 'Hapus' }); if (confirmed) deleteMutation.mutate(rombel.id); }} cursor="pointer"><Trash2 size={15} /></IconButton></HStack></Flex>
                <Text fontSize="sm" fontWeight="medium" color='text.secondary'>{rombel.major?.name || 'Belum ada jurusan'}</Text>
              </Box>
              <Flex justify="space-between" align="center" mt={4} pt={3} borderTopWidth="1px" borderColor="border.default"><Badge colorPalette="purple" variant="subtle" borderRadius="md" px={2.5} py={0.5}>{rombel._count?.students || 0} Siswa</Badge><Text fontSize="xs" fontWeight="semibold" color='brand.text'>Lihat Anggota Kelas →</Text></Flex>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <RombelFormModal isOpen={isModalOpen} editingName={editingRombel?.name} formData={formData} majorOptions={majorOptions} isSubmitting={createMutation.isPending || updateMutation.isPending} onClose={() => { setIsModalOpen(false); resetForm(); }} onSubmit={handleSubmit} onFormChange={setFormData} />
    </Stack>
  );
}
