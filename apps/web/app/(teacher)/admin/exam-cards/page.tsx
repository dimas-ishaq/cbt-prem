'use client';

import { useQuery } from '@tanstack/react-query';
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
  Spinner,
  HStack,
  SimpleGrid,
  Input,
  Badge,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { Printer, Users, CheckSquare, Square, Info, ShieldAlert, Award } from 'lucide-react';
import { toast } from '@/lib/toaster';

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
  rombel?: {
    name: string;
  };
  major?: {
    name: string;
  };
}

interface Rombel {
  id: string;
  name: string;
}

export default function ExamCardsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const [selectedRombelId, setSelectedRombelId] = useState<string>('');
  const [selectedExamGroupId, setSelectedExamGroupId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [headmasterName, setHeadmasterName] = useState<string>('Kepala Sekolah');
  const [cardLayout, setCardLayout] = useState<'grid-4' | 'grid-2'>('grid-4');

  // Fetch settings for school name / logo
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  // Fetch exam groups for event title
  const { data: examGroups } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['exam-groups'],
    queryFn: async () => {
      const response = await api.get('/exam-groups');
      return response.data;
    },
  });

  // Fetch rombels
  const { data: rombels, isLoading: isLoadingRombels } = useQuery<Rombel[]>({
    queryKey: ['rombels'],
    queryFn: async () => {
      const response = await api.get('/rombels');
      return response.data;
    },
  });

  const selectedRombel = rombels?.find((rombel) => rombel.id === selectedRombelId);
  const selectedExamGroup = examGroups?.find((group) => group.id === selectedExamGroupId);
  const activeEventTitle = selectedExamGroup?.name || 'BELUM ADA KELOMPOK UJIAN TERPILIH';

  const cardLayoutOptions = createListCollection({
    items: [
      { label: 'Double Column (4 Kartu per Halaman)', value: 'grid-4' },
      { label: 'Single Column (2 Kartu per Halaman)', value: 'grid-2' },
    ],
  });

  const examGroupOptions = createListCollection({
    items: examGroups?.map((group) => ({ label: group.name, value: group.id })) || [],
  });

  const rombelOptions = createListCollection({
    items: rombels?.map((rombel) => ({ label: rombel.name, value: rombel.id })) || [],
  });

  useEffect(() => {
    if (!selectedExamGroupId && examGroups?.length) {
      setSelectedExamGroupId(examGroups[0].id);
    }
  }, [examGroups, selectedExamGroupId]);

  // Fetch students for selection only after rombel is chosen
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['students-for-cards', selectedRombelId],
    queryFn: async () => {
      const response = await api.get('/students', {
        params: {
          rombelId: selectedRombelId,
        },
      });
      return response.data;
    },
    enabled: !!selectedRombelId,
  });

  // Automatically select all when students list updates
  useEffect(() => {
    if (students) {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  }, [students]);

  const handleSelectAll = () => {
    if (students) {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleSelectNone = () => {
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePrint = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Pilih setidaknya satu siswa untuk dicetak!');
      return;
    }
    window.print();
  };

  const getAssetUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('/uploads/')) {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '');
      return `${apiBase}${url}`;
    }
    return url;
  };

  const filteredStudentsForPrint = students?.filter((s) =>
    selectedStudentIds.includes(s.id)
  );

  return (
    <Box minH="100vh" p={{ base: 4, md: 6 }} bg="bg.canvas">
      {/* Dynamic print-only style overrides */}
      <style jsx global>{`
        @media print {
          /* Hide all UI elements */
          body, html {
            background: #fff !important;
            color: #000 !important;
            font-family: 'Times New Roman', Times, serif;
          }
          nav, aside, header, footer, button, select, input, .no-print, .chakra-button, .chakra-select, .chakra-input {
            display: none !important;
          }
          .main-content, #__next, .chakra-portal, [data-overlay] {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 15px !important;
            padding: 10px !important;
            width: 100% !important;
          }
          .card-layout-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .print-card {
            border: 1.5px dashed #000 !important;
            border-radius: 8px !important;
            padding: 12px !important;
            background: #fff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            font-size: 11px !important;
            color: #000 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 280px !important;
          }
          .print-card-header {
            border-bottom: 2px solid #000 !important;
            padding-bottom: 6px !important;
            margin-bottom: 8px !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }
          .print-school-logo {
            width: 45px !important;
            height: 45px !important;
            object-fit: contain !important;
          }
          .print-header-text {
            flex-grow: 1 !important;
            text-align: center !important;
          }
          .print-school-name {
            font-size: 11px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
          }
          .print-event-title {
            font-size: 10px !important;
            font-weight: bold !important;
          }
          .print-academic-year {
            font-size: 8px !important;
          }
          .print-card-body {
            display: flex !important;
            gap: 10px !important;
            flex-grow: 1 !important;
          }
          .print-student-avatar {
            width: 70px !important;
            height: 90px !important;
            border: 1px solid #000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 8px !important;
            text-align: center !important;
            background: #f8f8f8 !important;
          }
          .print-details-table {
            flex-grow: 1 !important;
            width: 100% !important;
          }
          .print-details-table td {
            padding: 2px 0 !important;
            vertical-align: top !important;
          }
          .print-credentials-box {
            background: #f0f4f8 !important;
            border: 1px solid #c8d6e5 !important;
            padding: 6px !important;
            border-radius: 4px !important;
            margin-top: 6px !important;
            font-family: monospace !important;
            font-size: 10px !important;
          }
          .print-card-footer {
            margin-top: 8px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
          }
          .print-qr-code {
            width: 45px !important;
            height: 45px !important;
          }
          .print-signature-space {
            text-align: center !important;
            width: 120px !important;
            font-size: 8px !important;
          }
          .print-signature-line {
            margin-top: 25px !important;
            border-top: 1px solid #000 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* ── Screen UI: Non-Printable Elements ──────────────────── */}
      <Box className="no-print" mb={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={6}>
          <Box>
            <Heading size="xl" fontWeight="black" color="indigo.700">
              Cetak Kartu Ujian Siswa
            </Heading>
            <Text color="text.muted" mt={1}>
              Buat, filter, dan cetak kartu identitas ujian peserta CBT dengan layout A4 siap cetak.
            </Text>
          </Box>
          <Button
            onClick={handlePrint}
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="xl"
            shadow="lg"
            fontWeight="bold"
            gap={2}
            px={5}
            py={5.5}
            cursor="pointer"
            disabled={selectedStudentIds.length === 0}
          >
            <Printer size={18} />
            Cetak Kartu ({selectedStudentIds.length})
          </Button>
        </Flex>

        {/* Configurations Form */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5} mb={6}>
          {/* Card settings */}
          <Box bg="white" p={5} borderRadius="2xl" borderWidth="1px" borderColor="border.default" shadow="sm">
            <Text fontWeight="bold" fontSize="sm" color="gray.700" mb={3}>
              ⚙️ Pengaturan Kartu
            </Text>
            <Stack gap={3.5}>
              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.500" mb={1.5} textTransform="uppercase">
                  Kelompok Ujian Aktif
                </Text>
                <Box
                  px={3}
                  py={2}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="gray.50"
                >
                  <Text fontWeight="bold" color="gray.900" fontSize="sm">
                    {selectedExamGroup?.name || 'Belum ada kelompok ujian terpilih'}
                  </Text>
                </Box>
              </Box>

              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.500" mb={1.5} textTransform="uppercase">
                  Nama Kepala Sekolah
                </Text>
                <Input
                  size="sm"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  borderRadius="lg"
                  borderColor="gray.200"
                />
              </Box>

              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.500" mb={1.5} textTransform="uppercase">
                  Layout Cetak per Baris
                </Text>
                <Select.Root
                  collection={cardLayoutOptions}
                  value={[cardLayout]}
                  onValueChange={(details) => setCardLayout(details.value[0] as 'grid-4' | 'grid-2')}
                  positioning={{ sameWidth: true }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Pilih layout" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {cardLayoutOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>
            </Stack>
          </Box>

          {/* Filter Student */}
          <Box bg="white" p={5} borderRadius="2xl" borderWidth="1px" borderColor="border.default" shadow="sm">
            <Text fontWeight="bold" fontSize="sm" color="gray.700" mb={3}>
              📁 Filter Rombel
            </Text>
            <Stack gap={4}>
              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.500" mb={1.5} textTransform="uppercase">
                  Kelompok Ujian
                </Text>
                <Select.Root
                  collection={examGroupOptions}
                  value={selectedExamGroupId ? [selectedExamGroupId] : []}
                  onValueChange={(details) => setSelectedExamGroupId(details.value[0] || '')}
                  positioning={{ sameWidth: true }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Pilih kelompok ujian" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {examGroupOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>

              <Box>
                <Text fontSize="2xs" fontWeight="black" color="gray.500" mb={1.5} textTransform="uppercase">
                  Rombongan Belajar
                </Text>
                {isLoadingRombels ? (
                  <Spinner size="xs" />
                ) : (
                  <Select.Root
                    collection={rombelOptions}
                    value={selectedRombelId ? [selectedRombelId] : []}
                    onValueChange={(details) => setSelectedRombelId(details.value[0] || '')}
                    positioning={{ sameWidth: true }}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Belum ada rombel terpilih" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                        <Select.ClearTrigger />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {rombelOptions.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                )}
              </Box>

              <Box bg="blue.50" p={4} borderRadius="xl" border="1px solid" borderColor="blue.100">
                <Text fontSize="xs" fontWeight="bold" color="blue.800" mb={1} textTransform="uppercase">
                  Event Ujian Aktif
                </Text>
                <Text fontWeight="black" color="blue.900" fontSize="lg">
                  {selectedExamGroup?.name || 'Pilih kelompok ujian dulu'}
                </Text>
                <Text fontSize="2xs" color="blue.700" mt={1}>
                  Judul kartu mengikuti nama kelompok ujian yang sudah tersedia.
                </Text>
              </Box>

              <HStack gap={3} pt={2}>
                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="lg"
                  onClick={handleSelectAll}
                  cursor="pointer"
                  disabled={!students || students.length === 0}
                  gap={1.5}
                >
                  <CheckSquare size={12} />
                  Pilih Semua
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="lg"
                  onClick={handleSelectNone}
                  cursor="pointer"
                  disabled={!students || students.length === 0}
                  gap={1.5}
                >
                  <Square size={12} />
                  Kosongkan
                </Button>
              </HStack>
            </Stack>
          </Box>

          {/* Info Banner */}
          <Box
            bg="blue.50"
            p={5}
            borderRadius="2xl"
            border="1px solid"
            borderColor="blue.100"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            gap={3}
          >
            <Flex gap={2.5} align="flex-start">
              <Info className="text-blue-600" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <Box>
                <Text fontWeight="bold" color="blue.800" fontSize="xs">
                  Panduan Cetak
                </Text>
                <Text fontSize="2xs" color="blue.650" mt={1} lineHeight="relaxed">
                  Gunakan browser Chrome/Edge, atur Paper Size ke <b>A4</b>, Margin ke <b>None / Default</b>, dan centang opsi <b>Background graphics</b> pada dialog cetak agar warna latar belakang tercetak.
                </Text>
              </Box>
            </Flex>
            <Text fontSize="3xs" fontWeight="semibold" color="blue.500">
              * Password siswa yang dienkripsi akan diganti dengan instruksi penggunaan akun utama demi keamanan.
            </Text>
          </Box>
        </SimpleGrid>

        {/* Selection student list table */}
        <Box bg="white" borderRadius="2xl" borderWidth="1px" borderColor="border.default" shadow="sm" overflow="hidden">
          <Box px={5} py={4} borderBottom="1px solid" borderColor="gray.100" bg="gray.50/50">
            <Text fontWeight="bold" color="gray.700" fontSize="sm">
              Daftar Peserta Kelas ({students?.length || 0} Siswa ditemukan)
            </Text>
          </Box>
          <Box maxH="400px" overflowY="auto" p={4}>
            {isLoadingStudents ? (
              <Flex justify="center" align="center" py={8}>
                <Spinner size="md" color="indigo.600" />
                <Text ml={3} color="gray.500">Memuat data siswa...</Text>
              </Flex>
            ) : !students || students.length === 0 ? (
              <Flex direction="column" align="center" py={8}>
                <Users size={32} className="text-gray-300 mb-2" />
                <Text color="gray.500" fontSize="sm">
                  Tidak ada siswa dalam rombel ini.
                </Text>
              </Flex>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={3}>
                {students.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <Flex
                      key={student.id}
                      align="center"
                      gap={3}
                      p={3}
                      borderRadius="xl"
                      borderWidth="1.5px"
                      borderColor={isChecked ? 'indigo.500' : 'gray.100'}
                      bg={isChecked ? 'indigo.50/15' : 'white'}
                      cursor="pointer"
                      onClick={() => handleToggleStudent(student.id)}
                      _hover={{ bg: isChecked ? 'indigo.50/20' : 'gray.50/50' }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#4f46e5',
                          cursor: 'pointer',
                        }}
                      />
                      <Box overflow="hidden">
                        <Text fontWeight="bold" fontSize="xs" color="gray.850" className="truncate">
                          {student.user.fullName}
                        </Text>
                        <Text fontSize="3xs" color="gray.500">
                          NIS: {student.nis} • {student.rombel?.name || 'Belum ada Rombel'}
                        </Text>
                      </Box>
                    </Flex>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Visual Screen Preview (Also the printable region) ────────────────── */}
      <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" borderWidth="1px" borderColor="border.default" shadow="sm" className="no-print">
        <Flex justify="space-between" align="center" mb={4} borderBottom="1px solid" borderColor="gray.100" pb={3}>
          <Text fontWeight="extrabold" fontSize="md" color="gray.700">
            Pratinjau Halaman Cetak
          </Text>
          <Badge colorPalette="indigo" fontSize="2xs" px={2.5} py={0.5} borderRadius="md">
            Preview
          </Badge>
        </Flex>
        {selectedStudentIds.length === 0 ? (
          <Flex justify="center" py={12} color="gray.450" fontStyle="italic">
            Pilih siswa untuk menampilkan pratinjau kartu.
          </Flex>
        ) : (
          <Box bg="gray.100" p={4} borderRadius="xl" border="1px inset" borderColor="gray.200">
            <SimpleGrid columns={cardLayout === 'grid-4' ? { base: 1, lg: 2 } : 1} gap={4}>
              {filteredStudentsForPrint?.map((student) => (
                <Box
                  key={student.id}
                  bg="white"
                  border="2px solid"
                  borderColor="gray.400"
                  borderRadius="xl"
                  p={0}
                  shadow="sm"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  h="560px"
                  overflow="hidden"
                >
                  <Box px={4} pt={3} pb={2} bg="blue.50" borderBottom="1px solid" borderColor="gray.300" position="relative">
                    <Flex align="center" gap={3}>
                      <Box w="48px" h="48px" borderRadius="md" overflow="hidden" flexShrink={0} bg="white" border="1px solid" borderColor="gray.300" display="flex" alignItems="center" justifyContent="center">
                        {settings?.logoUrl ? (
                          <img
                            src={getAssetUrl(settings.logoUrl)}
                            alt="School Logo"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <ShieldAlert size={28} className="text-indigo-600" />
                        )}
                      </Box>
                      <Box textAlign="center" flex={1} pr={10}>
                        <Text fontWeight="black" fontSize="xs" color="gray.900" textTransform="uppercase" letterSpacing="tight">
                          {settings?.appName || 'SMK PLUS PELITA NUSANTARA BOGOR'}
                        </Text>
                        <Text fontWeight="extrabold" fontSize="sm" color="gray.900" textTransform="uppercase">
                          KARTU PESERTA UJIAN {selectedExamGroup?.name || activeEventTitle}
                        </Text>
                        <Text fontSize="2xs" color="gray.700" fontWeight="bold">
                          TAHUN PELAJARAN {settings?.academicYear || '2025 - 2026'}
                        </Text>
                      </Box>
                      <Box position="absolute" top={2} right={3} w="72px" h="72px" borderRadius="full" bg="blue.100" border="2px solid" borderColor="blue.400" display="flex" alignItems="center" justifyContent="center">
                        <Text fontWeight="black" color="blue.800" fontSize="2xl">
                          {String(selectedStudentIds.length).padStart(2, '0')}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>

                  <Box px={4} pt={3} pb={2}>
                    <Flex justify="space-between" fontSize="xs" color="gray.800" mb={2}>
                      <Text>No. Peserta</Text>
                      <Text fontWeight="bold">: {student.nis || '-'}</Text>
                    </Flex>
                    <Flex justify="space-between" fontSize="xs" color="gray.800" mb={2}>
                      <Text>Nama</Text>
                      <Text fontWeight="bold" textTransform="capitalize">: {student.user.fullName}</Text>
                    </Flex>
                    <Flex justify="space-between" fontSize="xs" color="gray.800" mb={2}>
                      <Text>Kelas</Text>
                      <Text fontWeight="bold">: {student.rombel?.name || '-'}</Text>
                    </Flex>
                    <Flex justify="space-between" fontSize="xs" color="gray.800">
                      <Text>Ruang</Text>
                      <Text fontWeight="bold">: -</Text>
                    </Flex>
                  </Box>

                  <Box px={4} pb={2}>
                    <Box border="1px solid" borderColor="gray.500" borderRadius="sm" overflow="hidden">
                      <Box bg="gray.100" px={3} py={2} borderBottom="1px solid" borderColor="gray.500">
                        <Text fontWeight="black" textAlign="center" fontSize="sm" color="gray.900">
                          JADWAL UJIAN {selectedExamGroup?.name || activeEventTitle}
                        </Text>
                        <Text fontWeight="black" textAlign="center" fontSize="xs" color="gray.900">
                          TAHUN PELAJARAN {settings?.academicYear || '2025 - 2026'}
                        </Text>
                      </Box>
                      <Box as="table" width="100%" fontSize="2xs">
                        <Box as="tbody">
                          <Box as="tr">
                            <Box as="td" borderBottom="1px solid" borderColor="gray.500" p={2} w="28%" fontWeight="bold">Hari/Tanggal</Box>
                            <Box as="td" borderBottom="1px solid" borderColor="gray.500" p={2} w="20%" fontWeight="bold">Waktu</Box>
                            <Box as="td" borderBottom="1px solid" borderColor="gray.500" p={2} fontWeight="bold">Mata Pelajaran</Box>
                            <Box as="td" borderBottom="1px solid" borderColor="gray.500" p={2} w="16%" fontWeight="bold">Tanda Tangan Pengawas</Box>
                          </Box>
                          {['Senin, 08-06-2026', 'Selasa, 09-06-2026', 'Rabu, 10-06-2026', 'Kamis, 11-06-2026', 'Jumat, 12-06-2026', 'Sabtu, 13-06-2026'].map((day, index) => (
                            <Box as="tr" key={day}>
                              <Box as="td" borderBottom="1px solid" borderColor="gray.300" p={2} verticalAlign="top">{day}</Box>
                              <Box as="td" borderBottom="1px solid" borderColor="gray.300" p={2} verticalAlign="top">07.30 - 09.00</Box>
                              <Box as="td" borderBottom="1px solid" borderColor="gray.300" p={2} verticalAlign="top">{index === 0 ? 'Pendidikan Agama dan Budi Pekerti' : index === 1 ? 'Bahasa Indonesia' : index === 2 ? 'Matematika' : index === 3 ? 'Bahasa Inggris' : index === 4 ? 'Pendidikan Pancasila' : 'Seni Budaya'}</Box>
                              <Box as="td" borderBottom="1px solid" borderColor="gray.300" p={2} verticalAlign="top"></Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box px={4} pb={3}>
                    <Box bg="gray.50" border="1px solid" borderColor="gray.300" borderRadius="md" p={2}>
                      <Text fontSize="2xs" fontWeight="bold" color="gray.700" textTransform="uppercase">
                        Akun CBT
                      </Text>
                      <Text fontSize="2xs" color="gray.800" mt={1}>
                        Username: <b>{student.user.username}</b>
                      </Text>
                      <Text fontSize="2xs" color="gray.800">
                        Password: <b>{student.user.username}</b>
                      </Text>
                    </Box>
                  </Box>

                  <Flex px={4} pb={4} align="flex-end" justify="space-between" gap={4}>
                    <Box w="56px" h="56px" border="1px solid" borderColor="gray.300" borderRadius="md" p={0.5} bg="white">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${student.user.username}`}
                        alt="QR Code"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                    <Box textAlign="center" w="45%" fontSize="2xs">
                      <Text color="gray.600">Sibing, 8 Juni 2026</Text>
                      <Text color="gray.600">Kepala Sekolah</Text>
                      <Box h="34px" />
                      <Text fontWeight="bold" borderTop="1px solid" borderColor="gray.700" pt={1} color="gray.900">
                        {headmasterName}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* ── PRINT-ONLY CONTAINER (Fully hidden in standard screen view) ── */}
      <Box display="none" className="print-container">
        <div className={`print-grid ${cardLayout === 'grid-2' ? 'card-layout-grid-2' : ''}`}>
          {filteredStudentsForPrint?.map((student) => (
            <div key={student.id} className="print-card">
              <div className="print-card-header">
                {settings?.logoUrl ? (
                  <img
                    src={getAssetUrl(settings.logoUrl)}
                    alt="Logo"
                    className="print-school-logo"
                  />
                ) : (
                  <div style={{ width: '45px', height: '45px', border: '1px solid #000' }} />
                )}
                <div className="print-header-text">
                  <div className="print-school-name">{settings?.appName || 'SMK PLUS PELITA NUSANTARA BOGOR'}</div>
                  <div className="print-event-title">KARTU PESERTA UJIAN {selectedExamGroup?.name || activeEventTitle}</div>
                  <div className="print-academic-year">
                    TAHUN PELAJARAN {settings?.academicYear || '2025 - 2026'}
                  </div>
                </div>
              </div>

              <div className="print-card-body">
                <div className="print-participant-number">{String(selectedStudentIds.length).padStart(2, '0')}</div>
                <table className="print-details-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '70px', fontWeight: 'bold' }}>No. Peserta</td>
                      <td style={{ width: '8px' }}>:</td>
                      <td>{student.nis || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Nama</td>
                      <td>:</td>
                      <td>{student.user.fullName}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Kelas</td>
                      <td>:</td>
                      <td>{student.rombel?.name || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Ruang</td>
                      <td>:</td>
                      <td>-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="print-schedule-title">Jadwal Ujian {selectedExamGroup?.name || activeEventTitle}</div>
              <div className="print-credentials-box">
                <div><b>Akun CBT</b></div>
                <div style={{ marginTop: '3px' }}>Username: <b>{student.user.username}</b></div>
                <div>Password: <b>{student.user.username}</b></div>
              </div>

              <div className="print-card-footer">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${student.user.username}`}
                  alt="QR Code"
                  className="print-qr-code"
                />
                <div className="print-signature-space">
                  <div>Sibing, 8 Juni 2026</div>
                  <div>Kepala Sekolah</div>
                  <div className="print-signature-line">{headmasterName}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Box>
    </Box>
  );
}
