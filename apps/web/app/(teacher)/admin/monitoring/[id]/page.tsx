'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState, use } from 'react';
import { ChevronLeft, Users, AlertTriangle, CheckCircle2, Monitor, Award } from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Stack,
  SimpleGrid,
  Progress,
  HStack,
} from '@chakra-ui/react';

interface Student {
  userId: string;
  username: string;
  fullName: string;
  progress: number;
  lastActive: string;
  status: string;
  violationCount?: number;
}

interface Violation {
  id: string;
  username: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function ExamMonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const socket = useSocket();
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [violations, setViolations] = useState<Violation[]>([]);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam-monitoring', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join_proctor', { examId: id });

    socket.on('student_joined', (data: any) => {
      setStudents(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          userId: data.userId,
          username: data.username,
          fullName: data.username,
          status: 'Online',
          progress: prev[data.userId]?.progress || 0,
          lastActive: new Date().toISOString(),
        }
      }));
    });

    socket.on('student_offline', (data: any) => {
      setStudents(prev => {
        if (!prev[data.userId]) return prev;
        return {
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            status: 'Offline',
          }
        };
      });
    });

    socket.on('student_answer_update', (data: any) => {
      setStudents(prev => {
        const student = prev[data.studentId];
        if (!student) return prev;
        
        const totalQuestions = exam?.examQuestions.length || 1;
        return {
          ...prev,
          [data.studentId]: {
            ...student,
            progress: Math.min(100, (student.progress || 0) + (100 / totalQuestions)),
            lastActive: new Date().toISOString(),
          }
        };
      });
    });

    socket.on('violation_alert', (data: any) => {
      setViolations(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          username: data.username,
          type: data.type,
          description: data.description,
          timestamp: data.timestamp,
        },
        ...prev,
      ]);

      setStudents(prev => {
        const student = prev[data.studentId];
        if (!student) return prev;
        return {
          ...prev,
          [data.studentId]: {
            ...student,
            violationCount: (student.violationCount || 0) + 1,
          }
        };
      });
    });

    return () => {
      socket.off('student_joined');
      socket.off('student_offline');
      socket.off('student_answer_update');
      socket.off('violation_alert');
    };
  }, [socket, id, exam]);

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh">
        <Text color="gray.600" fontWeight="semibold">Loading monitor...</Text>
      </Flex>
    );
  }

  const activeStudentCount = Object.keys(students).length;

  return (
    <Stack gap={6}>
      <Flex justify="between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
        <Flex align="center" gap={4}>
          <Link href="/admin/monitoring" passHref>
            <Button variant="ghost" p={2} borderRadius="full" cursor="pointer">
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <Box>
            <Heading size="lg" fontWeight="bold" color="gray.900">
              Proctor View: {exam?.title}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {exam?.subject.name} • {exam?.examQuestions.length} Soal
            </Text>
          </Box>
        </Flex>
        <HStack gap={4}>
          <Link href={`/admin/results/${id}`} passHref>
            <Button
              colorPalette="indigo"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              px={4}
              py={5}
              cursor="pointer"
            >
              <Award size={18} />
              <Text>View Final Results</Text>
            </Button>
          </Link>
          <HStack bg="white" border="1px solid" borderColor="gray.150" borderRadius="xl" px={4} py={2} shadow="xs">
            <Users size={18} className="text-indigo-600" />
            <Text fontWeight="bold" color="gray.800">{activeStudentCount}</Text>
            <Text fontSize="xs" color="gray.500">Siswa Aktif</Text>
          </HStack>
          <HStack bg="red.50" border="1px solid" borderColor="red.100" borderRadius="xl" px={4} py={2} color="red.700">
            <AlertTriangle size={18} />
            <Text fontWeight="bold">{violations.length}</Text>
            <Text fontSize="xs">Peringatan</Text>
          </HStack>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8}>
        <Box gridColumn={{ lg: 'span 2' }}>
          <Box bg="white" p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100">
            <Heading size="md" fontWeight="bold" color="gray.900" mb={6} display="flex" alignItems="center">
              <Monitor size={20} className="mr-2" /> Progres Siswa
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {Object.values(students).map((student) => {
                const isOffline = student.status === 'Offline';
                return (
                  <Box
                    key={student.userId}
                    p={4}
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="xl"
                    transition="all 0.2s"
                    bg={isOffline ? 'gray.50' : 'white'}
                    opacity={isOffline ? 0.75 : 1}
                    _hover={isOffline ? {} : { bg: 'gray.50/50' }}
                  >
                    <Flex justify="between" align="start" mb={2}>
                      <Flex align="center" gap={2}>
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg={isOffline ? 'gray.400' : 'green.500'}
                          className={isOffline ? '' : 'animate-pulse'}
                        />
                        <Box>
                          <Text fontWeight="bold" color="gray.900" fontSize="sm">{student.username}</Text>
                          <Text fontSize="3xs" color="gray.450" fontWeight="medium">
                            Aktif: {new Date(student.lastActive).toLocaleTimeString('id-ID')}
                          </Text>
                        </Box>
                      </Flex>
                      <HStack gap={2}>
                        {student.violationCount && student.violationCount > 0 ? (
                          <Badge colorPalette="red" px={2} py={0.5} borderRadius="full" fontSize="3xs" fontWeight="bold">
                            {student.violationCount} Alert
                          </Badge>
                        ) : null}
                        <Badge
                          colorPalette={isOffline ? 'gray' : 'green'}
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          fontSize="3xs"
                          fontWeight="bold"
                        >
                          {isOffline ? 'OFFLINE' : 'LIVE'}
                        </Badge>
                      </HStack>
                    </Flex>
                    <Stack gap={1} mt={3}>
                      <Flex justify="between" fontSize="3xs" fontWeight="semibold" color="gray.450">
                        <Text>Progres Jawaban</Text>
                        <Text>{Math.round(student.progress)}%</Text>
                      </Flex>
                      <Progress.Root value={student.progress} colorPalette="indigo" size="xs" borderRadius="full">
                        <Progress.Track bg="gray.100">
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                    </Stack>
                  </Box>
                );
              })}
              {activeStudentCount === 0 && (
                <Box gridColumn="1 / -1" py={12} textAlign="center" color="gray.400" fontStyle="italic" fontSize="sm">
                  Menunggu siswa masuk dan memulai ujian...
                </Box>
              )}
            </SimpleGrid>
          </Box>
        </Box>

        <Box>
          <Box bg="white" p={6} borderRadius="2xl" shadow="sm" border="1px solid" borderColor="gray.100" h={600} display="flex" flexDirection="column">
            <Heading size="md" fontWeight="bold" color="gray.900" mb={4} display="flex" alignItems="center">
              <AlertTriangle size={20} className="mr-2 text-red-600" /> Live Logs
            </Heading>
            <Box flex={1} overflowY="auto" className="custom-scrollbar" pr={2}>
              <Stack gap={3}>
                {violations.map((v) => (
                  <Box key={v.id} p={3} bg="red.50" border="1px solid" borderColor="red.100" borderRadius="xl">
                    <Flex justify="between" align="start" mb={1}>
                      <Text fontWeight="bold" color="red.900" fontSize="sm">{v.username}</Text>
                      <Text fontSize="3xs" color="red.500">{new Date(v.timestamp).toLocaleTimeString('id-ID')}</Text>
                    </Flex>
                    <Text fontSize="3xs" fontWeight="extrabold" color="red.700" textTransform="uppercase" letterSpacing="wider">{v.type}</Text>
                    <Text fontSize="xs" color="red.650" mt={0.5}>{v.description}</Text>
                  </Box>
                ))}
                {violations.length === 0 && (
                  <Flex direction="column" align="center" justify="center" h="400px" color="gray.400" gap={2}>
                    <CheckCircle2 size={32} className="text-green-500" />
                    <Text fontSize="sm" fontWeight="medium">Tidak ada pelanggaran terdeteksi</Text>
                  </Flex>
                )}
              </Stack>
            </Box>
          </Box>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
