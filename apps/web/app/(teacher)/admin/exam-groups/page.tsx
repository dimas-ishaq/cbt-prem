'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Plus, Trash2, Pencil, Calendar, Bookmark, Clock, Search, Filter,
  FolderKanban, BookOpen, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { ChakraDatePicker } from '@/components/ui/chakra-date-picker';
import { TablePagination } from '@/components/ui/pagination';

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
  Select,
  createListCollection,
  Grid,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';

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

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent: string }) {
  return (
    <Box
      bg="bg.surface"
      p={4}
      borderRadius="card"
      border="1px solid"
      borderColor="border.default"
      shadow="sm"
      flex={1}
      minW="140px"
    >
      <Flex align="center" gap={3}>
        <Flex
          w={10} h={10}
          borderRadius="lg"
          bg={accent}
          align="center"
          justify="center"
          color="text.inverted"
          shadow="sm"
        >
          <Icon size={20} strokeWidth={2.5} color="currentColor" />
        </Flex>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="text.primary" lineHeight="1.2">
            {value}
          </Text>
          <Text fontSize="xs" color="text.secondary" fontWeight="medium">
            {label}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

const accentMap = {
  brand: 'brand.solid',
  green: 'status.success.text',
  amber: 'status.warning.text',
  blue: 'info.500',
};

export default function ExamGroupsPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedYear, selectedSemester]);
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

  const { data: groups, isLoading } = useQuery<ExamGroup[]>({
    queryKey: ['exam-groups'],
    queryFn: async () => {
      const res = await api.get('/exam-groups');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const filteredGroups = useMemo(() => {
    return (groups || []).filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchText.toLowerCase());
      const matchesYear = selectedYear ? group.academicYear === selectedYear : true;
      const matchesSemester = selectedSemester ? group.semester === selectedSemester : true;
      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [groups, searchText, selectedYear, selectedSemester]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredGroups.slice(start, start + pageSize);
  }, [filteredGroups, currentPage, pageSize]);

  // ── Stats ──
  const totalGroups = groups?.length ?? 0;
  const totalExams = groups?.reduce((s, g) => s + (g._count?.exams ?? 0), 0) ?? 0;
  const activeGroups = groups?.filter((g) => g.isActive).length ?? 0;
  const now = new Date();
  const upcomingGroups = groups?.filter((g) => g.startDate && new Date(g.startDate) > now).length ?? 0;

  // ── Collections ──
  const yearOptions = createListCollection({
    items: [
      { label: 'Semua Tahun', value: '' },
      ...Array.from({ length: 7 }, (_, i) => {
        const y = new Date().getFullYear() - 3 + i;
        return { label: `${y}/${y + 1}`, value: `${y}/${y + 1}` };
      }),
    ],
  });

  const semesterOptions = createListCollection({
    items: [
      { label: 'Semua Semester', value: '' },
      { label: 'Ganjil', value: 'Ganjil' },
      { label: 'Genap', value: 'Genap' },
    ],
  });

  // ── Mutations ──
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

  // ── Handlers ──
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

  return (
    <Stack gap={6} p={6}>
      {/* ── Header ── */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" fontWeight="extrabold" color="text.primary" letterSpacing="tight">
            Kelompok Ujian / Event
          </Heading>
          <Text color="text.secondary" mt={1} fontSize="sm">
            Kelola kelompok ujian akademik (UTS, UAS, dll) beserta tahun ajaran.
          </Text>
        </Box>
        <Button
          bg="brand.solid"
          color="text.inverted"
          _hover={{ bg: 'brand.text' }}
          borderRadius="xl"
          px={5}
          h={11}
          fontWeight="semibold"
          shadow="md"
          onClick={openCreateModal}
          cursor="pointer"
        >
          <Plus size={20} />
          <Box as="span" ml={2}>Tambah Kelompok</Box>
        </Button>
      </Flex>

      {/* ── Stat Cards ── */}
      <Flex gap={4} wrap="wrap">
        <StatCard icon={FolderKanban} label="Total Event" value={totalGroups} accent={accentMap.brand} />
        <StatCard icon={CheckCircle2} label="Aktif" value={activeGroups} accent={accentMap.green} />
        <StatCard icon={BookOpen} label="Total Ujian" value={totalExams} accent={accentMap.amber} />
        <StatCard icon={Calendar} label="Akan Datang" value={upcomingGroups} accent={accentMap.blue} />
      </Flex>

      {/* ── Filters ── */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} justify="space-between" align={{ md: 'center' }}>
        <HStack gap={3} flexWrap="wrap">
          <Flex
            align="center"
            gap={2}
            bg="bg.subtle"
            px={3}
            py={2}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Search size={16} color="var(--chakra-colors-text-muted)" />
            <Input
              placeholder="Cari event..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="sm"
              border="none"
              outline="none"
              _focus={{ boxShadow: 'none' }}
              flex={1}
              minW="180px"
              _placeholder={{ color: 'text.muted' }}
              bg="transparent"
            />
          </Flex>
          <Flex
            align="center"
            gap={2}
            bg="bg.subtle"
            px={3}
            py={2}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Filter size={16} color="var(--chakra-colors-text-muted)" />
            <Select.Root
              collection={yearOptions}
              value={selectedYear ? [selectedYear] : []}
              onValueChange={(details) => setSelectedYear(details.value[0] || '')}
              positioning={{ sameWidth: true }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Semua Tahun" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                  <Select.ClearTrigger />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {yearOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Flex>
          <Flex
            align="center"
            gap={2}
            bg="bg.subtle"
            px={3}
            py={2}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Select.Root
              collection={semesterOptions}
              value={selectedSemester ? [selectedSemester] : []}
              onValueChange={(details) => setSelectedSemester(details.value[0] || '')}
              positioning={{ sameWidth: true }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Semua Semester" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                  <Select.ClearTrigger />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner>
                <Select.Content>
                  {semesterOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      {item.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          </Flex>
        </HStack>
      </Flex>

      {/* ── Table ── */}
      <Box
        bg="bg.surface"
        borderRadius="card"
        shadow="sm"
        borderWidth="1px"
        borderColor="border.default"
        overflow="hidden"
      >
        {isLoading ? (
          <Flex justify="center" align="center" py={20} direction="column" gap={3}>
            <Spinner size="lg" color="brand.solid" />
            <Text color="text.secondary" fontSize="sm">Memuat data...</Text>
          </Flex>
        ) : (
          <>
            <Table.Root size="md">
              <Table.Header>
                <Table.Row bg="bg.subtle">
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">
                    Nama Event
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">
                    Tahun Ajaran / Semester
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase">
                    Total Ujian
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase" textAlign="end">
                    Aksi
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginatedGroups?.map((group) => {
                  const isNowActive = group.isActive && (!group.endDate || new Date(group.endDate) >= now) && (!group.startDate || new Date(group.startDate) <= now);
                  return (
                    <Table.Row
                      key={group.id}
                      _hover={{ bg: 'bg.subtle' }}
                      transition="background 0.15s"
                    >
                      <Table.Cell px={6} py={4}>
                        <Flex align="center" gap={2.5}>
                          <Flex
                            w={9} h={9}
                            borderRadius="lg"
                            bg={isNowActive ? 'status.success.bg' : 'brand.subtle'}
                            align="center"
                            justify="center"
                            color={isNowActive ? 'status.success.text' : 'brand.text'}
                            flexShrink={0}
                          >
                            {isNowActive ? <CheckCircle2 size={18} /> : <Calendar size={18} />}
                          </Flex>
                          <Box>
                            <Flex align="center" gap={2}>
                              <Text fontWeight="semibold" color="text.primary" fontSize="sm">
                                {group.name}
                              </Text>
                              {group.isActive && (
                                <Badge
                                  bg={isNowActive ? 'status.success.bg' : 'status.warning.bg'}
                                  color={isNowActive ? 'status.success.text' : 'status.warning.text'}
                                  borderRadius="full"
                                  px={2}
                                  fontSize="10px"
                                >
                                  {isNowActive ? 'Berlangsung' : 'Aktif'}
                                </Badge>
                              )}
                            </Flex>
                            {group.description && (
                              <Text color="text.muted" fontSize="xs" mt={0.5} lineClamp={1}>
                                {group.description}
                              </Text>
                            )}
                          </Box>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell px={6} py={4}>
                        <Stack gap={1.5}>
                          <HStack gap={1.5}>
                            <Badge
                              bg="brand.subtle"
                              color="brand.text"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              fontWeight="medium"
                              fontSize="11px"
                            >
                              {group.academicYear || '-'}
                            </Badge>
                            <Badge
                              bg="bg.subtle"
                              color="text.secondary"
                              px={2.5}
                              py={0.5}
                              borderRadius="md"
                              fontWeight="medium"
                              fontSize="11px"
                            >
                              {group.semester || '-'}
                            </Badge>
                          </HStack>
                          {(group.startDate || group.endDate) && (
                            <Text color="text.muted" fontSize="10px" display="flex" alignItems="center" gap={1}>
                              <Clock size={11} />
                              {group.startDate
                                ? new Date(group.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                : '...'}
                              {' — '}
                              {group.endDate
                                ? new Date(group.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '...'}
                            </Text>
                          )}
                        </Stack>
                      </Table.Cell>
                      <Table.Cell px={6} py={4}>
                        <Badge
                          bg="brand.subtle"
                          color="brand.text"
                          borderRadius="full"
                          px={3}
                          py={1}
                          fontWeight="semibold"
                        >
                          {group._count.exams} Mapel
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={6} py={4} textAlign="end">
                        <HStack gap={1.5} justify="flex-end">
                          <IconButton
                            variant="ghost"
                            color="brand.text"
                            _hover={{ bg: 'brand.subtle' }}
                            size="sm"
                            borderRadius="lg"
                            aria-label={`Edit ${group.name}`}
                            onClick={() => openEditModal(group)}
                            cursor="pointer"
                          >
                            <Pencil size={17} />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            color="status.danger.text"
                            _hover={{ bg: 'status.danger.bg' }}
                            size="sm"
                            borderRadius="lg"
                            aria-label={`Hapus ${group.name}`}
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus kelompok ujian ini? Ujian yang ada di dalamnya tidak akan terhapus, hanya labelnya yang hilang.')) {
                                deleteMutation.mutate(group.id);
                              }
                            }}
                            cursor="pointer"
                          >
                            <Trash2 size={17} />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
                {filteredGroups?.length === 0 && !isLoading && (
                  <Table.Row>
                    <Table.Cell colSpan={4} px={6} py={16}>
                      <Flex direction="column" align="center" gap={3}>
                        <Box
                          p={4}
                          borderRadius="full"
                          bg="bg.subtle"
                          color="text.muted"
                        >
                          <FolderKanban size={32} />
                        </Box>
                        <Text color="text.muted" fontWeight="medium" fontSize="sm">
                          {searchText || selectedYear || selectedSemester
                            ? 'Tidak ada event yang cocok dengan filter.'
                            : 'Belum ada kelompok ujian.'}
                        </Text>
                        {!searchText && !selectedYear && !selectedSemester && (
                          <Button
                            size="sm"
                            bg="brand.solid"
                            color="text.inverted"
                            _hover={{ bg: 'brand.text' }}
                            borderRadius="lg"
                            onClick={openCreateModal}
                            cursor="pointer"
                          >
                            <Plus size={16} />
                            <Box as="span" ml={1.5}>Buat Event Baru</Box>
                          </Button>
                        )}
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
            <TablePagination
              currentPage={currentPage}
              totalCount={filteredGroups.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </Box>

      {/* ── Modal ── */}
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
          <Box
            bg="bg.surface"
            borderRadius="card"
            shadow="xl"
            w="full"
            maxW="md"
            overflow="hidden"
            border="1px solid"
            borderColor="border.default"
          >
            <Flex
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="border.default"
              justify="space-between"
              align="center"
              bg="bg.subtle"
            >
              <Heading size="md" fontWeight="bold" color="text.primary">
                {editingGroup ? 'Edit Event Ujian' : 'Tambah Event Ujian'}
              </Heading>
              <Button variant="ghost" color="text.muted" onClick={closeModal} fontSize="xl" p={0} minW={0} cursor="pointer" _hover={{ bg: 'bg.muted' }}>
                ✕
              </Button>
            </Flex>
            <form onSubmit={handleSubmit}>
              <Stack gap={4} p={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1.5}>
                    Nama Event <Box as="span" color="status.danger.text">*</Box>
                  </Text>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Cth. ASAT Genap 2024"
                    borderRadius="lg"
                    bg="input.bg"
                    borderColor="input.border"
                    _focus={{ borderColor: 'input.focus.border' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1.5}>Deskripsi</Text>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Opsional"
                    borderRadius="lg"
                    bg="input.bg"
                    borderColor="input.border"
                  />
                </Box>
                <Grid gap={3} templateColumns="1fr 1fr">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1.5}>Tahun Ajaran</Text>
                    <Select.Root
                      collection={yearOptions}
                      value={formData.academicYear ? [formData.academicYear] : []}
                      onValueChange={(details) => setFormData({ ...formData, academicYear: details.value[0] || '' })}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger borderRadius="lg">
                          <Select.ValueText placeholder="Pilih tahun ajaran" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                          <Select.ClearTrigger />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {yearOptions.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1.5}>Semester</Text>
                    <Select.Root
                      collection={semesterOptions}
                      value={formData.semester && formData.semester !== 'Ganjil' ? [formData.semester] : formData.semester === 'Ganjil' ? ['Ganjil'] : []}
                      onValueChange={(details) => setFormData({ ...formData, semester: details.value[0] || 'Ganjil' })}
                      positioning={{ sameWidth: true }}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger borderRadius="lg">
                          <Select.ValueText placeholder="Pilih semester" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                          <Select.ClearTrigger />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Select.Positioner>
                        <Select.Content>
                          {semesterOptions.items.filter((item) => item.value !== '').map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  </Box>
                </Grid>
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1.5}>Mulai</Text>
                    <ChakraDatePicker
                      value={formData.startDate}
                      onChange={(date) => setFormData({ ...formData, startDate: date })}
                      placeholder="Pilih tanggal"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1.5}>Berakhir</Text>
                    <ChakraDatePicker
                      value={formData.endDate}
                      onChange={(date) => setFormData({ ...formData, endDate: date })}
                      placeholder="Pilih tanggal"
                    />
                  </Box>
                </SimpleGrid>
                <Flex gap={3} pt={4}>
                  <Button type="button" onClick={closeModal} flex={1} variant="outline" borderRadius="lg" cursor="pointer" borderColor="border.default">
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    flex={1}
                    bg="brand.solid"
                    color="text.inverted"
                    _hover={{ bg: 'brand.text' }}
                    borderRadius="lg"
                    cursor="pointer"
                    loading={createMutation.isPending || updateMutation.isPending}
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
