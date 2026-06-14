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
} from '@chakra-ui/react';

import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const stats = [
    { name: t('totalStudents'), value: '1,234', icon: Users, change: '+12%', changeType: 'increase' },
    { name: t('activeExams'), value: '8', icon: FileText, change: '0%', changeType: 'neutral' },
    { name: t('subjectsLabel'), value: '24', icon: BookOpen, change: '+2', changeType: 'increase' },
    { name: t('avgScore'), value: '78.5', icon: Activity, change: '-2.4%', changeType: 'decrease' },
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
              <HStack
                gap={1}
                fontSize="sm"
                fontWeight="medium"
                color={
                  stat.changeType === 'increase'
                    ? 'green.600'
                    : stat.changeType === 'decrease'
                    ? 'red.600'
                    : 'gray.500'
                }
              >
                <Text>{stat.change}</Text>
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight size={16} />
                ) : stat.changeType === 'decrease' ? (
                  <ArrowDownRight size={16} />
                ) : null}
              </HStack>
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
            {[1, 2, 3].map((i) => (
              <Flex
                key={i}
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
                    Ujian Tengah Semester Matematika
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Subject: Mathematics • 120 Students
                  </Text>
                </Box>
                <Badge
                  px={3}
                  py={1}
                  bg="green.100"
                  color="green.700"
                  fontSize="xs"
                  fontWeight="bold"
                  borderRadius="full"
                >
                  {t('completedStatus')}
                </Badge>
              </Flex>
            ))}
          </Stack>
        </Box>

        <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
          <Heading size="md" fontWeight="bold" color="gray.900" mb={4}>
            {t('liveAlerts')}
          </Heading>
          <Stack gap={4}>
            {[1, 2, 3].map((i) => (
              <Flex
                key={i}
                align="flex-start"
                gap={4}
                p={4}
                borderWidth="1px"
                borderColor="red.100"
                bg="red.50"
                borderRadius="lg"
              >
                <Box p={2} bg="red.100" color="red.600" borderRadius="full">
                  <Activity size={16} />
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="red.900">
                    {t('violationDetected')}
                  </Text>
                  <Text fontSize="sm" color="red.700">
                    Student: John Doe • Type: Tab Switching
                  </Text>
                  <Text fontSize="xs" color="red.500" mt={1}>
                    2 {t('minutesAgo')}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Stack>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
