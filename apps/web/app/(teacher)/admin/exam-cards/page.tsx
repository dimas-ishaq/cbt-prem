'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
  Input,
  HStack,
  Select,
  createListCollection,
  Grid,
} from '@chakra-ui/react';
import {
  Download,
  Printer,
  Settings,
  Users,
  Calendar,
  FileText,
  UserCheck,
  LayoutGrid,
} from 'lucide-react';
import { ExamCardTemplate, StudentCardData } from './exam-card-template';
import { CARD_LAYOUTS, ExamCardLayout } from './exam-card.constants';

// Chunk students helper for paging/layout
const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export default function ExamCardsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Redirect if not teacher/admin
  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU'].includes(user.role)) {
      router.push('/admin');
    }
  }, [user, router]);

  // States
  const [selectedExamGroupId, setSelectedExamGroupId] = useState<string>('');
  const [selectedRombelId, setSelectedRombelId] = useState<string>('');
  const [cardLayout, setCardLayout] = useState<ExamCardLayout>('grid-6');
  const [headmasterName, setHeadmasterName] = useState<string>('Drs. H. Ahmad Fauzi, M.Pd.');
  const [headmasterNip, setHeadmasterNip] = useState<string>('197508122003121002');
  const [cardDate, setCardDate] = useState<string>('Jakarta, 22 Juni 2026');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Queries
  const { data: examGroups = [], isLoading: isLoadingExamGroups } = useQuery<any[]>({
    queryKey: ['exam-groups-list'],
    queryFn: async () => {
      const res = await api.get('/exam-groups');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const { data: rombels = [], isLoading: isLoadingRombels } = useQuery<any[]>({
    queryKey: ['rombels-list-exam-cards'],
    queryFn: async () => {
      const res = await api.get('/rombels');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const { data: students = [], isLoading: isLoadingStudents, refetch: refetchStudents } = useQuery<StudentCardData[]>({
    queryKey: ['exam-cards-students', selectedRombelId],
    queryFn: async () => {
      if (!selectedRombelId) return [];
      const res = await api.get(`/rombels/${selectedRombelId}/exam-cards`);
      return res.data || [];
    },
    enabled: !!selectedRombelId,
  });

  // Collections for Chakra Select
  const examGroupList = Array.isArray(examGroups) ? examGroups : [];
  const rombelList = Array.isArray(rombels) ? rombels : [];

  const examGroupCollection = createListCollection({
    items: examGroupList.map((eg) => ({ label: eg.name, value: eg.id })),
  });

  const rombelCollection = createListCollection({
    items: rombelList.map((r) => ({ label: r.name, value: r.id })),
  });

  const layoutCollection = createListCollection({
    items: CARD_LAYOUTS,
  });

  // Get active exam group name
  const activeExamGroupName = examGroupList.find(eg => eg.id === selectedExamGroupId)?.name || 'UJIAN BERBASIS KOMPUTER';
  const activeRombelName = rombelList.find(r => r.id === selectedRombelId)?.name || '';

  // PDF Download Handler using dynamic html2pdf.js import
  const handleDownloadPDF = async () => {
    if (!selectedRombelId) {
      toast.error('Silakan pilih rombel terlebih dahulu');
      return;
    }
    if (students.length === 0) {
      toast.error('Tidak ada siswa di rombel ini');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // Dynamic import to prevent SSR/window errors
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('printable-exam-cards-container');

      if (!element) {
        throw new Error('Elemen kartu cetak tidak ditemukan');
      }

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `kartu-ujian-${activeRombelName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();
      toast.success('Kartu ujian berhasil diunduh dalam format PDF!');
    } catch (error: any) {
      console.error(error);
      toast.error('Gagal membuat PDF: ' + error.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Chunk students according to selected layout
  const cardsPerPage = cardLayout === 'grid-6' ? 6 : 4;
  const studentPages = chunkArray(students, cardsPerPage);

  return (
    <Stack gap={6} h="100%">
      {/* Page Title */}
      <Box>
        <Heading size="xl" fontWeight="extrabold" color="gray.950" letterSpacing="tight">
          Cetak Kartu Peserta Ujian
        </Heading>
        <Text color="gray.500" mt={1} fontSize="sm">
          Cetak kartu ujian satu rombel sekaligus dengan layout presisi, tanda tangan kepala sekolah, dan barcode/QR Code.
        </Text>
      </Box>

      {/* Main Content Split Layout */}
      <Grid templateColumns={{ base: '1fr', lg: '350px 1fr' }} gap={6} alignItems="stretch">
        
        {/* Left Side: Control Panel */}
        <Stack gap={5}>
          {/* Card Filter */}
          <Box bg="white" p={5} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <Heading size="md" fontWeight="bold" mb={4} color="gray.900" display="flex" alignItems="center" gap={2}>
              <Settings size={18} className="text-indigo-600" />
              Filter & Pengaturan
            </Heading>
            
            <Stack gap={4}>
              {/* Select Kegiatan Ujian */}
              <Stack gap={1.5}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Kegiatan Ujian (Exam Group)</Text>
                {isLoadingExamGroups ? <Spinner size="xs" /> : (
                  <Select.Root
                    collection={examGroupCollection}
                    value={selectedExamGroupId ? [selectedExamGroupId] : []}
                    onValueChange={(details) => setSelectedExamGroupId(details.value[0] ?? '')}
                    size="sm"
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="-- Pilih Kegiatan --" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {examGroupCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                )}
              </Stack>

              {/* Select Rombongan Belajar */}
              <Stack gap={1.5}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Rombongan Belajar (Kelas)</Text>
                {isLoadingRombels ? <Spinner size="xs" /> : (
                  <Select.Root
                    collection={rombelCollection}
                    value={selectedRombelId ? [selectedRombelId] : []}
                    onValueChange={(details) => setSelectedRombelId(details.value[0] ?? '')}
                    size="sm"
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="-- Pilih Rombel --" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {rombelCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            {item.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                )}
              </Stack>

              {/* Layout Cards */}
              <Stack gap={1.5}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Tata Letak (Layout)</Text>
                <Select.Root
                  collection={layoutCollection}
                  value={[cardLayout]}
                  onValueChange={(details) => setCardLayout((details.value[0] as ExamCardLayout) ?? 'grid-6')}
                  size="sm"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {layoutCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Stack>
            </Stack>
          </Box>

          {/* Card Customization Info (Kepala Sekolah) */}
          <Box bg="white" p={5} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <Heading size="md" fontWeight="bold" mb={4} color="gray.900" display="flex" alignItems="center" gap={2}>
              <UserCheck size={18} className="text-indigo-600" />
              Tanda Tangan & Detail
            </Heading>

            <Stack gap={4}>
              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Nama Kepala Sekolah</Text>
                <Input
                  size="sm"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  placeholder="Nama Kepala Sekolah beserta gelar"
                  borderRadius="lg"
                />
              </Stack>

              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">NIP Kepala Sekolah</Text>
                <Input
                  size="sm"
                  value={headmasterNip}
                  onChange={(e) => setHeadmasterNip(e.target.value)}
                  placeholder="NIP Kepala Sekolah"
                  borderRadius="lg"
                />
              </Stack>

              <Stack gap={1}>
                <Text fontSize="xs" fontWeight="bold" color="gray.600">Kota & Tanggal Kartu</Text>
                <Input
                  size="sm"
                  value={cardDate}
                  onChange={(e) => setCardDate(e.target.value)}
                  placeholder="Contoh: Jakarta, 22 Juni 2026"
                  borderRadius="lg"
                />
              </Stack>
            </Stack>
          </Box>

          {/* Download Trigger */}
          <Button
            bg="indigo.650"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            h={12}
            borderRadius="xl"
            fontWeight="bold"
            shadow="md"
            cursor="pointer"
            onClick={handleDownloadPDF}
            loading={isGeneratingPdf || isLoadingStudents}
            disabled={!selectedRombelId || students.length === 0}
            gap={2}
          >
            <Download size={18} />
            Unduh Kartu (PDF)
          </Button>
        </Stack>

        {/* Right Side: Virtual Sheet WYSIWYG Preview */}
        <Box
          bg="gray.50"
          borderRadius="2xl"
          p={6}
          border="1px solid"
          borderColor="gray.100"
          minH="500px"
          position="relative"
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontWeight="bold" color="gray.850" display="flex" alignItems="center" gap={2}>
              <LayoutGrid size={18} className="text-indigo-600" />
              Pratinjau Halaman Cetak
            </Heading>
            {students.length > 0 && (
              <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                Total: {students.length} Siswa ({studentPages.length} Halaman PDF)
              </Text>
            )}
          </Flex>

          {/* Loader or Empty State */}
          {isLoadingStudents ? (
            <Flex justify="center" align="center" h="400px" direction="column" gap={3}>
              <Spinner size="xl" color="indigo.600" />
              <Text fontSize="sm" color="gray.500">Memuat data siswa...</Text>
            </Flex>
          ) : !selectedRombelId ? (
            <Flex justify="center" align="center" h="400px" direction="column" gap={3} border="2px dashed" borderColor="gray.200" borderRadius="2xl" p={8}>
              <Users size={48} className="text-gray-300" />
              <Text fontSize="sm" color="gray.500" textAlign="center" maxW="300px">
                Silakan pilih Rombongan Belajar di panel kiri untuk memuat pratinjau kartu ujian.
              </Text>
            </Flex>
          ) : students.length === 0 ? (
            <Flex justify="center" align="center" h="400px" direction="column" gap={3} border="2px dashed" borderColor="gray.200" borderRadius="2xl" p={8}>
              <Users size={48} className="text-gray-300" />
              <Text fontSize="sm" color="gray.500">
                Tidak ada data siswa ditemukan di rombel ini.
              </Text>
            </Flex>
          ) : (
            <Stack gap={8} maxW="794px" mx="auto">
              {/* WYSIWYG Page View */}
              {studentPages.map((pageChunk, pageIndex) => (
                <Box
                  key={pageIndex}
                  bg="white"
                  boxShadow="md"
                  border="1px solid"
                  borderColor="gray.200"
                  p={6}
                  borderRadius="lg"
                  position="relative"
                >
                  {/* Page indicator */}
                  <Box
                    position="absolute"
                    top={2}
                    right={4}
                    fontSize="10px"
                    fontWeight="bold"
                    color="gray.400"
                  >
                    Halaman {pageIndex + 1} dari {studentPages.length}
                  </Box>

                  <Grid
                    templateColumns="repeat(2, 1fr)"
                    gap={4}
                    mt={4}
                  >
                    {pageChunk.map((student) => (
                      <ExamCardTemplate
                        key={student.id}
                        student={student}
                        examGroupName={activeExamGroupName}
                        headmasterName={headmasterName}
                        headmasterNip={headmasterNip}
                        cardDate={cardDate}
                      />
                    ))}
                  </Grid>
                </Box>
              ))}
            </Stack>
          )}

          {/* Hidden PDF Render Target (Specifically formatted for html2pdf.js A4 layout) */}
          <Box style={{ display: 'none' }}>
            <Box id="printable-exam-cards-container" style={{ width: '100%', color: 'black', background: 'white' }}>
              {studentPages.map((pageChunk, pageIndex) => (
                <Box
                  key={pageIndex}
                  style={{
                    pageBreakAfter: pageIndex < studentPages.length - 1 ? 'always' : 'auto',
                    breakAfter: pageIndex < studentPages.length - 1 ? 'page' : 'auto',
                    paddingBottom: pageIndex < studentPages.length - 1 ? '10px' : '0px',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <Grid
                    templateColumns="repeat(2, 1fr)"
                    gap="12px"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
                  >
                    {pageChunk.map((student) => (
                      <ExamCardTemplate
                        key={student.id}
                        student={student}
                        examGroupName={activeExamGroupName}
                        headmasterName={headmasterName}
                        headmasterNip={headmasterNip}
                        cardDate={cardDate}
                      />
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Grid>
    </Stack>
  );
}
