'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Box, Flex, Badge, Text, Heading, Stack, HStack, Button, Spinner } from '@chakra-ui/react';
import { History, RotateCcw, Award } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface ExamSession {
  id: string;
  startTime: string;
  endTime: string;
  score: number | null;
  status: string;
  timeSpent?: number;
  exam: { title: string; subject: { name: string } };
}

function formatDuration(start: string, end: string, t: (key: string, opts?: any) => string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (hrs > 0) return t('hoursMinutes', { hours: hrs, minutes: remainingMins });
  return t('minutes', { count: mins });
}

function getStatusConfig(status: string, t: (key: string) => string) {
  switch (status) {
    case 'SUBMITTED':
    case 'FINISHED':
      return { label: t('sessionFinished'), color: 'green' };
    case 'LOCKED':
      return { label: t('sessionLocked'), color: 'red' };
    default:
      return { label: status, color: 'gray' };
  }
}

export function ExamHistory() {
  const { t } = useTranslation();
  const { data: history, isLoading, error } = useQuery<ExamSession[]>({
    queryKey: ['exam-history'],
    queryFn: async () => {
      const response = await api.get('/exam-sessions/my-history');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.600" fontWeight="medium">{t('loadingHistory')}</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Text color="red.500" fontWeight="bold">{t('errorLoadingHistory')}</Text>
      </Flex>
    );
  }

  return (
    <Box mt={8}>
      <Stack gap={1} mb={5}>
        <HStack gap={2} align="center">
          <History size={20} className="text-indigo-600" />
          <Heading size="md" fontWeight="bold" color="text.primary">{t('historyTitle')}</Heading>
        </HStack>
        <Text color="text.secondary" fontSize="sm">{t('historyDesc')}</Text>
      </Stack>

      {history?.length === 0 ? (
        <Box textAlign="center" py={12} bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.default">
          <RotateCcw size={40} className="text-gray-300 mx-auto mb-3" />
          <Text color="gray.500" fontSize="sm" fontWeight="medium">{t('emptyHistory')}</Text>
          <Text color="gray.400" fontSize="xs" mt={1}>{t('emptyHistoryDesc')}</Text>
        </Box>
      ) : (
        <Stack gap={4}>
          {history?.map((session) => {
            const status = getStatusConfig(session.status, t);
            const duration = formatDuration(session.startTime, session.endTime, t);
            return (
              <Box key={session.id} p={5} bg="bg.surface" borderRadius="xl" border="1px solid" borderColor="border.default" boxShadow="sm" _hover={{ boxShadow: 'md', borderColor: 'border.muted' }}>
                <Flex justify="space-between" align="start" gap={4} direction={{ base: 'column', md: 'row' }}>
                  <Stack gap={2} flex={1}>
                    <Flex align="center" gap={3} mb={1}>
                      <Badge colorPalette="blue" px={2.5} py={1} borderRadius="lg" textTransform="uppercase" fontWeight="bold" fontSize="2xs">
                        {session.exam.subject.name}
                      </Badge>
                      <Badge colorPalette={status.color} px={2} py={0.5} borderRadius="md" fontSize="3xs" fontWeight="black">
                        {status.label}
                      </Badge>
                    </Flex>
                    <Heading size="sm" fontWeight="semibold" color="text.primary" lineClamp={1}>
                      {session.exam.title}
                    </Heading>
                    <Stack gap={0.5} fontSize="xs" color="text.secondary" fontWeight="medium">
                      <HStack gap={1.5}>
                        <Text>{t('finishedAt')} {new Date(session.endTime).toLocaleString('id-ID')}</Text>
                      </HStack>
                      <HStack gap={1.5}>
                        <Text>{t('duration')} {duration}</Text>
                      </HStack>
                    </Stack>
                  </Stack>
                  <Flex direction="column" align="center" gap={2} minW="100px">
                    {session.score !== null && session.score !== undefined ? (
                      <>
                        <Flex align="center" gap={1} color={status.color === 'red' ? 'red.600' : 'green.600'}>
                          <Award size={18} />
                          <Text fontSize="xl" fontWeight="extrabold" color={status.color === 'red' ? 'red.600' : 'green.600'}>
                            {Math.round(session.score)}
                          </Text>
                        </Flex>
                        <Text fontSize="2xs" color="text.muted" fontWeight="medium">{t('points')}</Text>
                      </>
                    ) : (
                      <Text fontSize="xs" color="gray.400" fontStyle="italic">{t('notGraded')}</Text>
                    )}
                    <Link href={`/exams/${(session.exam as any).id}`} style={{ width: '100%' }}>
                      <Button size="xs" variant="outline" w="full" mt={1} borderRadius="lg" fontSize="2xs" fontWeight="semibold" color="text.secondary" borderColor="border.default" _hover={{ bg: 'gray.50', borderColor: 'gray.300' }}>
                        {t('viewDetails')}
                      </Button>
                    </Link>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
