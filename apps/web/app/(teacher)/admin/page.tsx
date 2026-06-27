'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Activity,
  BookOpen,
  FileText,
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
    <Box
      position="relative"
      overflow="hidden"
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="card"
      p={6}
      shadow="card-light"
      transition="all 0.2s ease"
      _hover={{
        transform: 'translateY(-2px)',
        shadow: 'glow-brand',
        borderColor: 'border.brand',
      }}
    >
      <Box position="absolute" inset="auto -24px -24px auto" boxSize="84px" borderRadius="full" bg="brand.subtle" />
      <Flex justify="space-between" align="flex-start" gap={4} position="relative">
        <Box>
          <Text fontSize="xs" fontWeight="bold" letterSpacing="0.14em" textTransform="uppercase" color="text.muted">
            {name}
          </Text>
          <Text mt={3} fontSize="3xl" fontWeight="black" color="text.primary" lineHeight="1">
            {value}
          </Text>
        </Box>
        <Flex
          boxSize={11}
          align="center"
          justify="center"
          borderRadius="xl"
          bg="bg.elevated"
          borderWidth="1px"
          borderColor="border.default"
          color="brand.solid"
        >
          <Icon size={18} />
        </Flex>
      </Flex>
      {trend && (
        <Badge
          mt={5}
          colorPalette={trend === 'up' ? 'green' : 'red'}
          variant="subtle"
          borderRadius="full"
          px={3}
          py={1}
        >
          {trend === 'up' ? 'Naik' : 'Turun'}
        </Badge>
      )}
    </Box>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  if (isLoading) {
    return (
      <Flex minH="60vh" justify="center" align="center" bg="bg.canvas">
        <Stack align="center" gap={4}>
          <Spinner size="lg" color="brand.solid" />
          <Text color="text.secondary">Memuat dashboard…</Text>
        </Stack>
      </Flex>
    );
  }

  const stats = [
    { name: t('totalStudents'), value: dashboardData?.totalStudents ?? 0, icon: Users, trend: 'up' as const },
    { name: t('activeExams'), value: dashboardData?.activeExams ?? 0, icon: FileText, trend: 'up' as const },
    { name: t('subjectsLabel'), value: dashboardData?.totalSubjects ?? 0, icon: BookOpen },
    { name: t('avgScore'), value: `${dashboardData?.avgScore ?? 0}/100`, icon: Activity },
  ];

  return (
    <Stack gap={8} bg="bg.canvas" color="text.primary" minH="100%" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 4, md: 6 }}>
      <Box>
        <Heading size="xl" fontWeight="black" letterSpacing="tight" color="text.primary">
          {t('dashboardOverview')}
        </Heading>
        <Text color="text.secondary" mt={2} maxW="3xl">
          {t('welcomeCbt')}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
        {stats.map((stat, index) => (
          <StatCard key={stat.name} name={stat.name} value={stat.value} icon={stat.icon} trend={index < 2 ? 'up' : undefined} />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Flex align="center" justify="space-between" mb={5}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="brand.text">
                {t('recentExams')}
              </Text>
              <Heading size="md" fontWeight="black" color="text.primary" mt={1}>
                Aktivitas terbaru
              </Heading>
            </Box>
          </Flex>
          <Stack gap={3}>
            {dashboardData?.recentExams?.map((exam: any) => (
              <Flex
                key={exam.id}
                align="center"
                justify="space-between"
                p={4}
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.elevated"
                borderRadius="xl"
                transition="all 0.15s ease"
                _hover={{ borderColor: 'border.brand', transform: 'translateY(-1px)' }}
              >
                <Box>
                  <Text fontWeight="semibold" color="text.primary">
                    {exam.title}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Mata Pelajaran: {exam.subjectName} • {exam.sessionsCount} Siswa
                  </Text>
                </Box>
                <Badge
                  px={3}
                  py={1}
                  colorPalette={exam.status === 'PUBLISHED' || exam.status === 'ONGOING' ? 'green' : 'gray'}
                  fontSize="xs"
                  fontWeight="bold"
                  borderRadius="full"
                >
                  {exam.status}
                </Badge>
              </Flex>
            ))}
            {dashboardData?.recentExams?.length === 0 && (
              <Text fontStyle="italic" color="text.secondary" p={4} textAlign="center">
                Belum ada data ujian terbaru.
              </Text>
            )}
          </Stack>
        </Box>

        <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
          <Flex align="center" justify="space-between" mb={5}>
            <Box>
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em" color="accent.gold">
                {t('liveAlerts')}
              </Text>
              <Heading size="md" fontWeight="black" color="text.primary" mt={1}>
                Peringatan live
              </Heading>
            </Box>
          </Flex>
          <Stack gap={3}>
            {dashboardData?.liveAlerts?.map((alert: any) => (
              <Flex
                key={alert.id}
                align="flex-start"
                gap={4}
                p={4}
                borderWidth="1px"
                borderColor={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'danger.200' : 'warning.100'}
                bg={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'status.danger.bg' : 'status.warning.bg'}
                borderRadius="xl"
              >
                <Box p={2} bg={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'danger.50' : 'warning.50'} color={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'danger.600' : 'warning.600'} borderRadius="full" flexShrink={0}>
                  <Activity size={16} />
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="text.primary">
                    {alert.studentName}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Tipe: {alert.type} • {new Date(alert.timestamp).toLocaleTimeString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta' })}
                  </Text>
                </Box>
                <Badge
                  colorPalette={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'red' : 'orange'}
                  variant="subtle"
                  ml="auto"
                >
                  {alert.level}
                </Badge>
              </Flex>
            ))}
            {dashboardData?.liveAlerts?.length === 0 && (
              <Text fontStyle="italic" color="text.secondary" p={4} textAlign="center">
                Tidak ada peringatan pelanggaran terbaru.
              </Text>
            )}
          </Stack>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
