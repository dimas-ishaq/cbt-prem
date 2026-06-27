'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Clock3,
  FileText,
  ServerCrash,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';

function StatCard({ name, value, icon: Icon, trend }: { name: string; value: string | number; icon: any; trend?: 'up' | 'down' }) {
  return (
    <Box position="relative" overflow="hidden" bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" p={6} shadow="card-light" transition="all 0.2s ease" _hover={{ transform: 'translateY(-2px)', shadow: 'glow-brand', borderColor: 'border.brand' }}>
      <Box position="absolute" inset="auto -24px -24px auto" boxSize="84px" borderRadius="full" bg="brand.subtle" />
      <Flex justify="space-between" align="flex-start" gap={4} position="relative">
        <Box>
          <Text fontSize="xs" fontWeight="bold" letterSpacing="0.14em" textTransform="uppercase" color="text.muted">{name}</Text>
          <Text mt={3} fontSize="3xl" fontWeight="black" color="text.primary" lineHeight="1">{value}</Text>
        </Box>
        <Flex boxSize={11} align="center" justify="center" borderRadius="xl" bg="bg.elevated" borderWidth="1px" borderColor="border.default" color="brand.solid"><Icon size={18} /></Flex>
      </Flex>
      {trend && <Badge mt={5} colorPalette={trend === 'up' ? 'green' : 'red'} variant="subtle" borderRadius="full" px={3} py={1}>{trend === 'up' ? 'Naik' : 'Turun'}</Badge>}
    </Box>
  );
}

function StatusChip({ label, value, tone, icon: Icon }: { label: string; value: string; tone: 'green' | 'orange' | 'red' | 'blue'; icon: any }) {
  return (
    <Flex align="center" gap={3} p={4} bg="bg.elevated" border="1px solid" borderColor="border.default" borderRadius="xl">
      <Flex boxSize={10} align="center" justify="center" borderRadius="lg" color={`${tone}.600`} bg={`${tone}.50`}>
        <Icon size={16} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="xs" fontWeight="bold" letterSpacing="0.12em" textTransform="uppercase" color="text.muted">{label}</Text>
        <Text mt={1} fontSize="sm" fontWeight="semibold" color="text.primary">{value}</Text>
      </Box>
    </Flex>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: async () => (await api.get('/dashboard/stats')).data });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get('/settings')).data });

  const nowLabel = useMemo(() => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()), []);
  const liveAlerts = dashboardData?.liveAlerts ?? [];
  const recentExams = dashboardData?.recentExams ?? [];
  const activeExams = dashboardData?.activeExams ?? 0;
  const totalStudents = dashboardData?.totalStudents ?? 0;
  const totalSubjects = dashboardData?.totalSubjects ?? 0;
  const avgScore = dashboardData?.avgScore ?? 0;
  const urgentAlerts = liveAlerts.filter((item: any) => item.level === 'KRITIS' || item.level === 'BERAT');
  const warningAlerts = liveAlerts.filter((item: any) => item.level === 'SEDANG' || item.level === 'RINGAN');
  const priorityActions = [
    { label: 'Ujian aktif', value: `${activeExams} berjalan`, tone: 'blue' as const, icon: FileText },
    { label: 'Alert kritis', value: `${urgentAlerts.length} butuh tindak lanjut`, tone: urgentAlerts.length ? 'red' : 'green', icon: ShieldAlert },
    { label: 'Peringatan lain', value: `${warningAlerts.length} non-kritis`, tone: warningAlerts.length ? 'orange' : 'green', icon: AlertTriangle },
    { label: 'Last refresh', value: nowLabel, tone: 'blue' as const, icon: Clock3 },
  ];

  if (isLoading) {
    return <Flex minH="60vh" justify="center" align="center" bg="bg.canvas"><Stack align="center" gap={4}><Spinner size="lg" color="brand.solid" /><Text color="text.secondary">Memuat dashboard…</Text></Stack></Flex>;
  }

  const stats = [
    { name: t('totalStudents'), value: totalStudents, icon: Users, trend: 'up' as const },
    { name: t('activeExams'), value: activeExams, icon: FileText, trend: 'up' as const },
    { name: t('subjectsLabel'), value: totalSubjects, icon: BookOpen },
    { name: t('avgScore'), value: `${avgScore}/100`, icon: Activity },
  ];

  return (
    <Stack gap={6} bg="bg.canvas" color="text.primary" minH="100%" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 4, md: 6 }}>
      <Box>
        <Heading size="xl" fontWeight="black" letterSpacing="tight" color="text.primary">{t('dashboardOverview')}</Heading>
        <Text color="text.secondary" mt={2} maxW="3xl">{t('welcomeCbt')}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>{stats.map((stat, index) => <StatCard key={stat.name} name={stat.name} value={stat.value} icon={stat.icon} trend={index < 2 ? 'up' : undefined} />)}</SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2, xl: 4 }} gap={4}>
        <Box gridColumn={{ xl: 'span 2' }} bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Flex align="center" justify="space-between" mb={4} gap={3} wrap="wrap">
            <Box>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="brand.text">System Health</Text>
              <Heading size="md" fontWeight="black" color="text.primary" mt={1}>Ringkasan operasional</Heading>
            </Box>
            <Badge colorPalette={urgentAlerts.length ? 'red' : 'green'} variant="subtle" borderRadius="full" px={3}>{urgentAlerts.length ? 'Perlu perhatian' : 'Normal'}</Badge>
          </Flex>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <StatusChip label="Aktif sekarang" value={`${activeExams} ujian`} tone="blue" icon={FileText} />
            <StatusChip label="Siswa terdaftar" value={`${totalStudents} akun`} tone="green" icon={Users} />
            <StatusChip label="Data freshness" value={`Di-refresh ${nowLabel}`} tone="blue" icon={Clock3} />
            <StatusChip label="Alert kritis" value={`${urgentAlerts.length} item`} tone={urgentAlerts.length ? 'red' : 'green'} icon={ShieldAlert} />
          </SimpleGrid>
        </Box>

        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Flex align="center" justify="space-between" mb={4}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="accent.gold">Priority Actions</Text>
              <Heading size="md" fontWeight="black" color="text.primary" mt={1}>Langkah berikutnya</Heading>
            </Box>
          </Flex>
          <Stack gap={3}>
            {priorityActions.map((item) => (
              <Flex key={item.label} align="center" gap={3} p={3.5} bg="bg.elevated" border="1px solid" borderColor="border.default" borderRadius="xl">
                <Flex boxSize={10} align="center" justify="center" borderRadius="lg" bg={`${item.tone}.50`} color={`${item.tone}.600`}><item.icon size={16} /></Flex>
                <Box minW={0}>
                  <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.12em" color="text.muted">{item.label}</Text>
                  <Text mt={1} fontSize="sm" color="text.primary">{item.value}</Text>
                </Box>
              </Flex>
            ))}
          </Stack>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap={4}>
        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="brand.text">Trend snapshot</Text>
          <Heading size="md" fontWeight="black" color="text.primary" mt={1}>Gerak metrik utama</Heading>
          <Stack mt={4} gap={3}>
            <Flex justify="space-between"><Text color="text.secondary">Avg score</Text><Text fontWeight="bold">{avgScore}/100</Text></Flex>
            <Flex justify="space-between"><Text color="text.secondary">Recent exams</Text><Text fontWeight="bold">{recentExams.length}</Text></Flex>
            <Flex justify="space-between"><Text color="text.secondary">Live alerts</Text><Text fontWeight="bold">{liveAlerts.length}</Text></Flex>
          </Stack>
        </Box>

        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="brand.text">Anomaly watch</Text>
          <Heading size="md" fontWeight="black" color="text.primary" mt={1}>Deteksi cepat</Heading>
          <Stack mt={4} gap={3}>
            <Flex align="center" justify="space-between"><Text color="text.secondary">Kritis</Text><Badge colorPalette="red" variant="subtle">{urgentAlerts.length}</Badge></Flex>
            <Flex align="center" justify="space-between"><Text color="text.secondary">Perlu monitor</Text><Badge colorPalette="orange" variant="subtle">{warningAlerts.length}</Badge></Flex>
            <Flex align="center" justify="space-between"><Text color="text.secondary">Healthy signal</Text><Badge colorPalette={liveAlerts.length === 0 ? 'green' : 'blue'} variant="subtle">{liveAlerts.length === 0 ? 'Stabil' : 'Aktif'}</Badge></Flex>
          </Stack>
        </Box>

        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="brand.text">Data notes</Text>
          <Heading size="md" fontWeight="black" color="text.primary" mt={1}>Konteks pengambilan keputusan</Heading>
          <Stack mt={4} gap={3}>
            <Text fontSize="sm" color="text.secondary">Pastikan data ini cukup cepat untuk dipakai saat admin mengecek kondisi ujian.</Text>
            <Text fontSize="sm" color="text.secondary">Jika Anda ingin, row ini bisa diperluas menjadi breakdown per jurusan atau rombel.</Text>
          </Stack>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Flex align="center" justify="space-between" mb={5}><Box><Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="brand.text">{t('recentExams')}</Text><Heading size="md" fontWeight="black" color="text.primary" mt={1}>Aktivitas terbaru</Heading></Box></Flex>
          <Stack gap={3}>{recentExams.map((exam: any) => <Flex key={exam.id} align="center" justify="space-between" p={4} borderWidth="1px" borderColor="border.default" bg="bg.elevated" borderRadius="xl" transition="all 0.15s ease" _hover={{ borderColor: 'border.brand', transform: 'translateY(-1px)' }}><Box><Text fontWeight="semibold" color="text.primary">{exam.title}</Text><Text fontSize="sm" color="text.secondary">Mata Pelajaran: {exam.subjectName} • {exam.sessionsCount} Siswa</Text></Box><Badge px={3} py={1} colorPalette={exam.status === 'PUBLISHED' || exam.status === 'ONGOING' ? 'green' : 'gray'} fontSize="xs" fontWeight="bold" borderRadius="full">{exam.status}</Badge></Flex>)}{recentExams.length === 0 && <Text fontStyle="italic" color="text.secondary" p={4} textAlign="center">Belum ada data ujian terbaru.</Text>}</Stack>
        </Box>

        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Flex align="center" justify="space-between" mb={5}><Box><Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="accent.gold">{t('liveAlerts')}</Text><Heading size="md" fontWeight="black" color="text.primary" mt={1}>Peringatan live</Heading></Box></Flex>
          <Stack gap={3}>{liveAlerts.map((alert: any) => <Flex key={alert.id} align="flex-start" gap={4} p={4} borderWidth="1px" borderColor={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'danger.200' : 'warning.100'} bg={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'status.danger.bg' : 'status.warning.bg'} borderRadius="xl"><Box p={2} bg={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'danger.50' : 'warning.50'} color={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'danger.600' : 'warning.600'} borderRadius="full" flexShrink={0}><Activity size={16} /></Box><Box><Text fontWeight="semibold" color="text.primary">{alert.studentName}</Text><Text fontSize="sm" color="text.secondary">Tipe: {alert.type} • {new Date(alert.timestamp).toLocaleTimeString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta' })}</Text></Box><Badge colorPalette={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'red' : 'orange'} variant="subtle" ml="auto">{alert.level}</Badge></Flex>)}{liveAlerts.length === 0 && <Text fontStyle="italic" color="text.secondary" p={4} textAlign="center">Tidak ada peringatan pelanggaran terbaru.</Text>}</Stack>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
