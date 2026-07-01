'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Box, Flex, Badge, Text, Heading, Stack, HStack, Button, Spinner } from '@chakra-ui/react';
import { History, RotateCcw, Award, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';


interface ExamSession {
  id: string;
  startTime: string;
  endTime: string;
  score: number | null;
  status: string;
  exam: { title: string; subject: { name: string }; showScore?: boolean };
  _count?: { answers: number };
}

function formatDuration(start: string | null | undefined, end: string | null | undefined, t: (key: string, opts?: any) => string) {
  if (!start || !end) return '-';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';
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
      <Flex justify="center" align="center" py={12} gap={3}>
        <Spinner size="lg" color="dd.brand" />
        <Text color="dd.text.muted" fontSize="13px" fontWeight="medium">{t('loadingHistory')}</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Text color="dd.status.danger.text" fontSize="13px" fontWeight="bold">{t('errorLoadingHistory')}</Text>
      </Flex>
    );
  }

  return (
    <Box mt={4} fontFamily="body">
      <Stack gap={1} mb={5}>
        <HStack gap={2} align="center">
          <History size={16} color="var(--chakra-colors-dd-brand)" />
          <Heading size="sm" fontWeight="bold" color={{ base: '#0d1226', _dark: '#E0E0E0' }}>{t('historyTitle')}</Heading>
        </HStack>
        <Text color="dd.text.muted" fontSize="12px">{t('historyDesc')}</Text>
      </Stack>

      {history?.length === 0 ? (
        <Box textAlign="center" py={12} bg="dd.surface" borderRadius="card" border="1px solid" borderColor="dd.border" boxShadow={{ base: 'card-light', _dark: 'card-dark' }}>
          <RotateCcw size={32} color="var(--chakra-colors-dd-text-muted)" className="mx-auto mb-3" />
          <Text color="dd.text" fontSize="13px" fontWeight="medium">{t('emptyHistory')}</Text>
          <Text color="dd.text.muted" fontSize="11px" mt={1}>{t('emptyHistoryDesc')}</Text>
        </Box>
      ) : (
        <Stack gap={3}>
          {history?.map((session) => {
            const status = getStatusConfig(session.status, t);
            const duration = formatDuration(session.startTime, session.endTime, t);

            let statusBadge = (
              <Badge bg="dd.surface.alt" color="dd.text.muted" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                {status.label}
              </Badge>
            );

            if (status.color === 'green') {
              statusBadge = (
                <Badge bg="dd.status.success.bg" color="dd.status.success.text" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                  {status.label}
                </Badge>
              );
            } else if (status.color === 'red') {
              statusBadge = (
                <Badge bg="dd.status.danger.bg" color="dd.status.danger.text" border="1px solid" borderColor="dd.border" px={2} py={0.5} borderRadius="badge" fontSize="9px" fontWeight="bold">
                  {status.label}
                </Badge>
              );
            }

            const answerCount = session._count?.answers ?? 0;

            return (
              <Box
                key={session.id}
                p={4}
                bg="dd.surface"
                borderRadius="card"
                border="1px solid"
                borderColor="dd.border"
                boxShadow={{ base: 'card-light', _dark: 'card-dark' }}
                transition="all 150ms ease"
                _hover={{
                  borderColor: 'dd.brand',
                  boxShadow: { base: 'card-light', _dark: 'card-dark' },
                }}
              >
                <Flex justify="space-between" align="start" gap={4} direction={{ base: 'column', md: 'row' }}>
                  <Stack gap={2} flex={1}>
                    <Flex align="center" gap={3}>
                      <Badge bg="dd.status.info.bg" color="dd.status.info.text" border="1px solid" borderColor="dd.border" px={2.5} py={0.5} borderRadius="badge" textTransform="uppercase" fontWeight="bold" fontSize="10px">
                        {session.exam.subject.name}
                      </Badge>
                      {statusBadge}
                    </Flex>
                    <Heading size="sm" fontWeight="bold" color="dd.text" lineClamp={1}>
                      {session.exam.title}
                    </Heading>
                    <Stack gap={0.5} fontSize="11px" color="dd.text.muted" fontWeight="medium">
                      <HStack gap={1.5}>
                        <Text>{t('finishedAt')} {session.endTime ? new Date(session.endTime).toLocaleString('id-ID') : '-'}</Text>
                      </HStack>
                      <HStack gap={1.5}>
                        <Text>{t('duration')} {duration}</Text>
                      </HStack>
                      {answerCount > 0 && (
                        <HStack gap={1.5}>
                          <CheckCircle2 size={11} />
                          <Text>{answerCount} jawaban</Text>
                        </HStack>
                      )}
                    </Stack>
                  </Stack>
                  <Flex direction="column" align="center" gap={2} minW="120px" alignSelf={{ base: 'stretch', md: 'center' }}>
                    {session.score !== null && session.score !== undefined ? (
                      <>
                        <Flex align="center" gap={1} color={status.color === 'red' ? 'dd.status.danger.text' : 'dd.status.success.text'}>
                          <Award size={16} />
                          <Text fontSize="18px" fontWeight="extrabold">
                            {Math.round(session.score)}
                          </Text>
                        </Flex>
                        <Text fontSize="10px" color="dd.text.muted" fontWeight="medium">{t('points')}</Text>
                      </>
                    ) : (
                      <Text fontSize="11px" color="dd.text.muted" fontStyle="italic" fontWeight="medium">
                        {t('notGraded')}
                      </Text>
                    )}
                    <Link href={`/exams/results/${session.id}`} style={{ width: '100%' }}>
                      <Button
                        size="xs"
                        variant="ghost"
                        w="full"
                        mt={1}
                        borderRadius="md"
                        fontSize="11px"
                        fontWeight="bold"
                        bg="dd.surface.alt"
                        color="dd.text"
                        border="1px solid"
                        borderColor="dd.border"
                        _hover={{ bg: 'dd.surface.alt', borderColor: 'dd.brand' }}
                        height="28px"
                        cursor="pointer"
                      >
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
