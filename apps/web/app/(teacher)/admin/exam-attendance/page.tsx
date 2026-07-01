'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Spinner,
  Stack,
  Text,
  Badge,
  createListCollection,
  SimpleGrid,
} from '@chakra-ui/react';
import { QrCode, Users, CheckCircle2, XCircle, RefreshCw, ScanLine, Camera } from 'lucide-react';
import { toast } from '@/lib/toaster';

type ExamItem = { id: string; title: string; status?: string; subject?: { name: string } };

type AttendanceStudent = {
  id: string;
  nis: string;
  fullName: string;
  username: string;
  rombel: string;
  major: string;
  attendance: null | {
    status: string;
    checkedInAt: string;
    checkedInByUser?: { fullName: string } | null;
  };
};

export default function ExamAttendancePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedExamId, setSelectedExamId] = useState('');
  const [qrPayload, setQrPayload] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (user && !['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU', 'PENGAWAS'].includes(user.role)) {
      router.push('/admin');
    }
  }, [user, router]);

  const { data: examsData, isLoading: examsLoading, refetch: refetchExams } = useQuery({
    queryKey: ['exam-attendance-exams'],
    queryFn: async () => {
      const res = await api.get('/exams?take=200');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const exams = useMemo(() => (Array.isArray(examsData) ? examsData : []) as ExamItem[], [examsData]);

  const examCollection = createListCollection({
    items: exams.map((exam) => ({
      label: `${exam.title}${exam.subject?.name ? ` — ${exam.subject.name}` : ''}`,
      value: exam.id,
    })),
  });

  const { data: attendanceData, isLoading: attendanceLoading, refetch } = useQuery({
    queryKey: ['exam-attendance', selectedExamId],
    queryFn: async () => {
      const res = await api.get(`/exam-attendance/exam/${selectedExamId}`);
      return res.data;
    },
    enabled: !!selectedExamId,
  });

  const students = (attendanceData?.students || []) as AttendanceStudent[];
  const totalStudents = attendanceData?.totalStudents ?? 0;
  const checkedInCount = attendanceData?.checkedInCount ?? 0;

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    isScanningRef.current = false;

    if (!scanner) return;

    try {
      await scanner.stop();
    } catch {}
    try {
      await scanner.clear();
    } catch {}
  };

  const submitCheckIn = async (payload: string) => {
    if (!selectedExamId) {
      toast.error('Pilih ujian dulu');
      return;
    }
    if (!payload.trim()) {
      toast.error('QR payload kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/exam-attendance/check-in', {
        examId: selectedExamId,
        qrPayload: payload.trim(),
      });
      toast.success(res.data?.message || 'Check-in berhasil');
      setQrPayload('');
      await refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Gagal check-in');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckIn = async () => {
    await submitCheckIn(qrPayload);
  };

  useEffect(() => {
    if (!isScannerOpen || !selectedExamId) {
      void stopScanner();
      setScannerReady(false);
      return;
    }

    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('exam-attendance-scanner');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (isScanningRef.current) return;
            isScanningRef.current = true;
            setQrPayload(decodedText);
            setIsScannerOpen(false);
            await stopScanner();
            try {
              await submitCheckIn(decodedText);
            } catch {
              // toast already shown
            }
          },
          () => {}
        );

        if (mounted) setScannerReady(true);
      } catch (error: any) {
        console.error(error);
        toast.error('Kamera tidak bisa dibuka');
        setIsScannerOpen(false);
        setScannerReady(false);
      }
    };

    void startScanner();

    return () => {
      mounted = false;
      void stopScanner();
    };
  }, [isScannerOpen, selectedExamId]);

  if (!user) return null;

  return (
    <Container maxW="7xl" py={6}>
      <Stack gap={6}>
        <Box>
          <HStack gap={2} mb={2}>
            <QrCode size={20} color="var(--chakra-colors-brand-text)" />
            <Heading size="xl" fontWeight="extrabold">Daftar Hadir Ujian</Heading>
          </HStack>
          <Text color="text.secondary">Pilih mapel / ujian, lalu scan kartu siswa untuk check-in hadir.</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
          <Box bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={5}>
            <Text fontSize="xs" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing="wider" mb={2}>
              Pilih Ujian
            </Text>
            {examsLoading ? (
              <Spinner size="sm" />
            ) : (
              <Select.Root collection={examCollection} value={selectedExamId ? [selectedExamId] : []} onValueChange={(details) => {
                setSelectedExamId(details.value[0] ?? '');
                setIsScannerOpen(false);
              }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="-- Pilih Ujian --" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {examCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>{item.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            )}
            <Button mt={3} variant="ghost" size="sm" onClick={() => refetchExams()} gap={2}>
              <RefreshCw size={14} /> Muat Ulang
            </Button>
          </Box>

          <Box bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={5}>
            <Text fontSize="xs" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing="wider" mb={2}>
              Scan / Input QR
            </Text>
            <Stack gap={3}>
              <Input
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                placeholder="Tempel hasil scan QR di sini, atau ketik kode siswa"
                borderRadius="lg"
              />
              <HStack gap={2}>
                <Button onClick={handleCheckIn} loading={isSubmitting} disabled={!selectedExamId} bg="brand.solid" color="text.inverted" gap={2} flex={1}>
                  <ScanLine size={16} /> Check-in
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsScannerOpen((v) => !v)}
                  disabled={!selectedExamId}
                  gap={2}
                  flex={1}
                >
                  <Camera size={16} /> {isScannerOpen ? 'Tutup Kamera' : 'Scan Kamera'}
                </Button>
              </HStack>
              <Text fontSize="xs" color="text.secondary">
                {selectedExamId ? 'Bisa scan pakai kamera HP guru/pengawas.' : 'Pilih ujian dulu untuk aktifkan scanner.'}
              </Text>
            </Stack>
          </Box>

          <Box bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={5}>
            <Text fontSize="xs" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing="wider" mb={2}>
              Ringkasan
            </Text>
            <Stack gap={2}>
              <Text fontSize="sm" color="text.primary">Total siswa: <b>{totalStudents}</b></Text>
              <Text fontSize="sm" color="text.primary">Sudah check-in: <b>{checkedInCount}</b></Text>
              <Text fontSize="sm" color="text.primary">Belum check-in: <b>{Math.max(totalStudents - checkedInCount, 0)}</b></Text>
            </Stack>
          </Box>
        </SimpleGrid>

        {isScannerOpen && selectedExamId && (
          <Box bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={5}>
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
              <HStack gap={2}>
                <Camera size={18} color="var(--chakra-colors-brand-text)" />
                <Heading size="md" fontWeight="bold">Kamera Scan</Heading>
              </HStack>
              <Text fontSize="xs" color="text.secondary">
                Arahkan QR ke kamera. Scan berhenti otomatis setelah cocok.
              </Text>
            </Flex>
            <Box
              id="exam-attendance-scanner"
              minH="320px"
              borderRadius="xl"
              overflow="hidden"
              border="1px solid"
              borderColor="border.default"
              bg="black"
            />
            {!scannerReady && (
              <Flex justify="center" align="center" py={4} gap={2}>
                <Spinner size="sm" />
                <Text fontSize="sm" color="text.secondary">Membuka kamera...</Text>
              </Flex>
            )}
          </Box>
        )}

        <Box bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={5}>
          <Flex justify="space-between" align="center" mb={4}>
            <HStack gap={2}>
              <Users size={18} color="var(--chakra-colors-brand-text)" />
              <Heading size="md" fontWeight="bold">Status Kehadiran</Heading>
            </HStack>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={!selectedExamId}>
              Refresh
            </Button>
          </Flex>

          {!selectedExamId ? (
            <Flex justify="center" align="center" py={12} direction="column" gap={3} border="2px dashed" borderColor="border.default" borderRadius="2xl">
              <QrCode size={40} color="var(--chakra-colors-text-muted)" />
              <Text color="text.secondary">Pilih ujian dulu.</Text>
            </Flex>
          ) : attendanceLoading ? (
            <Flex justify="center" align="center" py={12} gap={3}>
              <Spinner size="lg" color="brand.solid" />
              <Text color="text.secondary">Memuat data hadir...</Text>
            </Flex>
          ) : students.length === 0 ? (
            <Flex justify="center" align="center" py={12} direction="column" gap={3} border="2px dashed" borderColor="border.default" borderRadius="2xl">
              <XCircle size={40} color="var(--chakra-colors-text-muted)" />
              <Text color="text.secondary">Tidak ada siswa untuk ujian ini.</Text>
            </Flex>
          ) : (
            <Stack gap={3}>
              {students.map((student, index) => {
                const attendance = student.attendance;
                const present = !!attendance;
                return (
                  <Flex key={student.id} justify="space-between" align="center" p={4} border="1px solid" borderColor="border.default" borderRadius="xl" bg={present ? 'green.50' : 'bg.surface'}>
                    <Box>
                      <HStack gap={2} mb={1}>
                        <Badge colorPalette={present ? 'green' : 'gray'}>{present ? 'HADIR' : 'BELUM HADIR'}</Badge>
                        <Text fontSize="xs" color="text.secondary">#{index + 1}</Text>
                      </HStack>
                      <Text fontWeight="bold" color="text.primary">{student.fullName}</Text>
                      <Text fontSize="sm" color="text.secondary">NIS {student.nis} • {student.rombel} • {student.major}</Text>
                    </Box>
                    <Stack gap={1} align="end">
                      {attendance ? (
                        <HStack gap={1} color="green.600"><CheckCircle2 size={14} /><Text fontSize="sm" fontWeight="bold">{new Date(attendance.checkedInAt).toLocaleTimeString('id-ID')}</Text></HStack>
                      ) : (
                        <HStack gap={1} color="red.500"><XCircle size={14} /><Text fontSize="sm" fontWeight="bold">Belum scan</Text></HStack>
                      )}
                      {attendance?.checkedInByUser?.fullName && (
                        <Text fontSize="xs" color="text.secondary">oleh {attendance.checkedInByUser.fullName}</Text>
                      )}
                    </Stack>
                  </Flex>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </Container>
  );
}
