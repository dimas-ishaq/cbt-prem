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
        <Spinner size="lg" color="#9C55E8" />
        <Text ml={3} color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="13px" fontWeight="medium">{t('loadingHistory')}</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" py={12}>
        <Text color="#EF4444" fontSize="13px" fontWeight="bold">{t('errorLoadingHistory')}</Text>
      </Flex>
    );
  }

  return (
    <Box mt={4} fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
      <Stack gap={1} mb={5}>
        <HStack gap={2} align="center">
          <History size={16} className="text-purple-500" />
          <Heading size="sm" fontWeight="bold" color={{ base: '#1F2328', _dark: '#E0E0E0' }}>{t('historyTitle')}</Heading>
        </HStack>
        <Text color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="12px">{t('historyDesc')}</Text>
      </Stack>

      {history?.length === 0 ? (
        <Box textAlign="center" py={12} bg={{ base: '#FFFFFF', _dark: '#242424' }} borderRadius="md" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} boxShadow="0 1px 4px rgba(0,0,0,0.05)">
          <RotateCcw size={32} className="text-gray-400 mx-auto mb-3" />
          <Text color={{ base: '#1F2328', _dark: '#E0E0E0' }} fontSize="13px" fontWeight="medium">{t('emptyHistory')}</Text>
          <Text color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="11px" mt={1}>{t('emptyHistoryDesc')}</Text>
        </Box>
      ) : (
        <Stack gap={4}>
          {history?.map((session) => {
            const status = getStatusConfig(session.status, t);
            const duration = formatDuration(session.startTime, session.endTime, t);
            
            let statusBadge = (
              <Badge bg={{ base: '#E1E4E8', _dark: '#2D2D2D' }} color={{ base: '#57606A', _dark: '#8A8A8A' }} border="1px solid" borderColor={{ base: '#D1D5DB', _dark: '#3D3D3D' }} px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                {status.label}
              </Badge>
            );

            if (status.color === 'green') {
              statusBadge = (
                <Badge bg="rgba(26, 190, 113, 0.15)" color="#1ABE71" border="1px solid" borderColor="rgba(26, 190, 113, 0.25)" px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                  {status.label}
                </Badge>
              );
            } else if (status.color === 'red') {
              statusBadge = (
                <Badge bg="rgba(239, 68, 68, 0.15)" color="#EF4444" border="1px solid" borderColor="rgba(239, 68, 68, 0.25)" px={2} py={0.5} borderRadius="md" fontSize="9px" fontWeight="bold">
                  {status.label}
                </Badge>
              );
            }

            return (
              <Box 
                key={session.id} 
                p={4} 
                bg={{ base: '#FFFFFF', _dark: '#242424' }} 
                borderRadius="md" 
                border="1px solid" 
                borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} 
                boxShadow="0 1px 4px rgba(0,0,0,0.05)" 
                transition="all 0.15s ease"
                _hover={{
                  borderColor: '#9C55E8',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <Flex justify="space-between" align="start" gap={4} direction={{ base: 'column', md: 'row' }}>
                  <Stack gap={2} flex={1}>
                    <Flex align="center" gap={3}>
                      <Badge bg="rgba(45, 155, 240, 0.15)" color="#2D9BF0" border="1px solid" borderColor="rgba(45, 155, 240, 0.25)" px={2.5} py={0.5} borderRadius="md" textTransform="uppercase" fontWeight="bold" fontSize="10px">
                        {session.exam.subject.name}
                      </Badge>
                      {statusBadge}
                    </Flex>
                    <Heading size="sm" fontWeight="bold" color={{ base: '#1F2328', _dark: '#E0E0E0' }} lineClamp={1}>
                      {session.exam.title}
                    </Heading>
                    <Stack gap={0.5} fontSize="11px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontWeight="medium">
                      <HStack gap={1.5}>
                        <Text>{t('finishedAt')} {new Date(session.endTime).toLocaleString('id-ID')}</Text>
                      </HStack>
                      <HStack gap={1.5}>
                        <Text>{t('duration')} {duration}</Text>
                      </HStack>
                    </Stack>
                  </Stack>
                  <Flex direction="column" align="center" gap={2} minW="100px" alignSelf={{ base: 'stretch', md: 'center' }}>
                    {session.score !== null && session.score !== undefined ? (
                      <>
                        <Flex align="center" gap={1} color={status.color === 'red' ? '#EF4444' : '#1ABE71'}>
                          <Award size={16} />
                          <Text fontSize="18px" fontWeight="extrabold">
                            {Math.round(session.score)}
                          </Text>
                        </Flex>
                        <Text fontSize="10px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontWeight="medium">{t('points')}</Text>
                      </>
                    ) : (
                      <Text fontSize="11px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontStyle="italic" fontWeight="medium">
                        {session.exam && (session.exam as any).showScore === false ? 'Dirahasiakan' : t('notGraded')}
                      </Text>
                    )}
                    <Link href={`/exams/${(session.exam as any).id}`} style={{ width: '100%' }}>
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        w="full" 
                        mt={1} 
                        borderRadius="md" 
                        fontSize="11px" 
                        fontWeight="bold" 
                        bg={{ base: '#FFFFFF', _dark: '#2D2D2D' }}
                        color={{ base: '#1F2328', _dark: '#E0E0E0' }} 
                        border="1px solid"
                        borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} 
                        _hover={{ bg: { base: '#F9FAFC', _dark: '#3D3D3D' }, borderColor: '#9C55E8' }}
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
