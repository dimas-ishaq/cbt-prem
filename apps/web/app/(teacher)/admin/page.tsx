'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Users,
  FileText,
  BookOpen,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Icon,
  Badge,
  HStack,
  Spinner,
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
      </Flex>
    );
  }

  const stats = [
    { name: t('totalStudents'), value: dashboardData?.totalStudents ?? 0, icon: Users },
    { name: t('activeExams'), value: dashboardData?.activeExams ?? 0, icon: FileText },
    { name: t('subjectsLabel'), value: dashboardData?.totalSubjects ?? 0, icon: BookOpen },
    { name: t('avgScore'), value: `${dashboardData?.avgScore ?? 0}/100`, icon: Activity },
  ];

  return (
    <Stack gap={8}>
      <Box>
        <Heading size="xl" fontWeight="bold" color="gray.900">
          {t('dashboardOverview')}
        </Heading>
        <Text color="gray.500" mt={1}>
          {t('welcomeCbt')}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
        {stats.map((stat) => (
          <Box
            key={stat.name}
            bg="white"
            p={6}
            borderRadius="xl"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.100"
            transition="all 0.2s"
            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
          >
            <Flex justify="space-between" align="flex-start">
              <Box p={2} bg="indigo.50" borderRadius="lg" color="indigo.600">
                <stat.icon size={24} />
              </Box>
            </Flex>
            <Box mt={4}>
              <Text color="gray.500" fontSize="sm" fontWeight="medium">
                {stat.name}
              </Text>
              <Text fontSize="3xl" fontWeight="bold" color="gray.900" mt={1}>
                {stat.value}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
        <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
          <Heading size="md" fontWeight="bold" color="gray.900" mb={4}>
            {t('recentExams')}
          </Heading>
          <Stack gap={4}>
            {dashboardData?.recentExams?.map((exam: any) => (
              <Flex
                key={exam.id}
                align="center"
                justify="space-between"
                p={4}
                borderWidth="1px"
                borderColor="gray.100"
                borderRadius="lg"
                _hover={{ bg: 'gray.50' }}
                transition="background 0.15s"
              >
                <Box>
                  <Text fontWeight="semibold" color="gray.900">
                    {exam.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Subject: {exam.subjectName} • {exam.sessionsCount} Students
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
              <Text fontStyle="italic" color="gray.500" p={4} textAlign="center">
                Belum ada data ujian terbaru.
              </Text>
            )}
          </Stack>
        </Box>

        <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
          <Heading size="md" fontWeight="bold" color="gray.900" mb={4}>
            {t('liveAlerts')}
          </Heading>
          <Stack gap={4}>
            {dashboardData?.liveAlerts?.map((alert: any) => (
              <Flex
                key={alert.id}
                align="flex-start"
                gap={4}
                p={4}
                borderWidth="1px"
                borderColor="red.100"
                bg="red.50/30"
                borderRadius="lg"
              >
                <Box p={2} bg="red.100" color="red.600" borderRadius="full" flexShrink={0}>
                  <Activity size={16} />
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="red.900">
                    {alert.studentName}
                  </Text>
                  <Text fontSize="sm" color="red.700">
                    Type: {alert.type} &bull; {new Date(alert.timestamp).toLocaleTimeString()}
                  </Text>
                </Box>
                <Badge
                  colorPalette={alert.level === 'KRITIS' || alert.level === 'BERAT' ? 'red' : 'yellow'}
                  variant="subtle"
                  ml="auto"
                >
                  {alert.level}
                </Badge>
              </Flex>
            ))}
            {dashboardData?.liveAlerts?.length === 0 && (
              <Text fontStyle="italic" color="gray.500" p={4} textAlign="center">
                Tidak ada peringatan pelanggaran terbaru.
              </Text>
            )}
          </Stack>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
