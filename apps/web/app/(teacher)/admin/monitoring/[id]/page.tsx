'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState, use, useCallback } from 'react';
import {
  ChevronLeft,
  Users,
  AlertTriangle,
  CheckCircle2,
  Monitor,
  Award,
  Search,
  Wifi,
  WifiOff,
  Maximize,
  Minimize,
  ArrowUpDown,
  Timer,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  HStack,
  Icon,
  IconButton,
  Tooltip,
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

type SortKey = 'name' | 'progress' | 'violations' | 'status';

export default function ExamMonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const socket = useSocket();

  const [students, setStudents] = useState<Record<string, Student>>({});
  const [violations, setViolations] = useState<Violation[]>([]);
  const [connection, setConnection] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('progress');
  const [sortAsc, setSortAsc] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam-monitoring', id],
    queryFn: async () => (await api.get(`/exams/${id}`)).data,
    refetchInterval: 10_000,
  });

  const totalQ = exam?.examQuestions?.length || 1;

  /* ─── Socket ─── */
  useEffect(() => {
    if (!socket) {
      setConnection('disconnected');
      return;
    }

    setConnection('connecting');

    const onConnect = () => setConnection('connected');
    const onDisconnect = () => setConnection('disconnected');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.emit('join_proctor', { examId: id });

    const handlers: Record<string, (d: any) => void> = {
      student_joined: (d) =>
        setStudents((prev) => ({
          ...prev,
          [d.userId]: {
            userId: d.userId,
            username: d.username,
            fullName: d.username,
            status: 'Online',
            progress: prev[d.userId]?.progress || 0,
            lastActive: new Date().toISOString(),
          },
        })),
      student_offline: (d) =>
        setStudents((prev) =>
          prev[d.userId] ? { ...prev, [d.userId]: { ...prev[d.userId], status: 'Offline' } } : prev,
        ),
      student_answer_update: (d) =>
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, progress: Math.min(100, s.progress + 100 / totalQ), lastActive: new Date().toISOString() } };
        }),
      violation_alert: (d) => {
        setViolations((prev) => [
          { id: Date.now().toString() + Math.random().toString(36).slice(2, 11), username: d.username, type: d.type, description: d.description, timestamp: d.timestamp },
          ...prev.slice(0, 99),
        ]);
        setStudents((prev) => {
          const s = prev[d.studentId];
          return s ? { ...prev, [d.studentId]: { ...s, violationCount: (s.violationCount || 0) + 1 } } : prev;
        });
      },
    };

    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      Object.keys(handlers).forEach((ev) => socket.off(ev));
    };
  }, [socket, id, totalQ]);

  /* ─── Auto-scroll violations ─── */
  useEffect(() => {
    const el = document.getElementById('violation-logs');
    if (el && violations.length > prevCount) el.scrollTop = 0;
    setPrevCount(violations.length);
  }, [violations, prevCount]);

  /* ─── Fullscreen shortcut ─── */
  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        toggleFS();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleFS]);

  /* ─── Timer ─── */
  const timer = (() => {
    if (!exam?.endTime) return { text: '-', urgent: false };
    const diff = new Date(exam.endTime).getTime() - Date.now();
    if (diff <= 0) return { text: 'Selesai', urgent: true };
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { text: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, urgent: diff < 300_000 };
  })();

  /* ─── Sort / filter ─── */
  const displayed = Object.values(students)
    .filter((s) => !query || (s.fullName || s.username).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = (a.fullName || a.username).localeCompare(b.fullName || b.username); break;
        case 'progress': cmp = (b.progress || 0) - (a.progress || 0); break;
        case 'violations': cmp = (b.violationCount || 0) - (a.violationCount || 0); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortAsc ? -cmp : cmp;
    });

  if (isLoading) {
    return (
      <Flex align="center" justify="center" minH="60vh">
        <HStack gap={3} color="gray.500">
          <Spinner size="md" color="indigo.500" />
          <Text fontSize="lg" fontWeight="semibold">Memuat…</Text>
        </HStack>
      </Flex>
    );
  }

  const total = Object.keys(students).length;
  const online = Object.values(students).filter((s) => s.status !== 'Offline').length;

  return (
    <Stack gap={6}>
      {/* ─── HEADER ─── */}
      <Flex direction={{ base: 'column', xl: 'row' }} align={{ xl: 'center' }} justify="space-between" gap={4}>
        <Flex align="center" gap={4}>
          <Link href="/admin/monitoring">
            <IconButton variant="ghost" aria-label="Back" borderRadius="xl">
              <ChevronLeft size={22} />
            </IconButton>
          </Link>
          <Box>
            <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.800" display="flex" alignItems="center" gap={3}>
              <Monitor size={24} color="var(--chakra-colors-indigo-500)" />
              {exam?.title}
            </Heading>
            <Text fontSize="sm" color="gray.500" mt={1}>
              {exam?.subject?.name} &middot; {exam?.examQuestions?.length} Soal &middot; ID: {id.slice(0, 8)}…
            </Text>
          </Box>
        </Flex>

        <Flex align="center" flexWrap="wrap" gap={3}>
          {/* Timer */}
          <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="xl" bg="white" border="1px solid" borderColor="gray.200" fontSize="sm" fontWeight="medium">
            <Timer size={15} color="var(--chakra-colors-gray-400)" />
            <Text color={timer.urgent ? 'red.600' : 'gray.800'}>{timer.text}</Text>
          </Flex>

          {/* Connection */}
          <Badge
            colorPalette={connection === 'connected' ? 'green' : connection === 'connecting' ? 'amber' : 'red'}
            px={3}
            py={1.5}
            borderRadius="xl"
            fontSize="xs"
            fontWeight="semibold"
            display="flex"
            alignItems="center"
            gap={1.5}
            textTransform="none"
          >
            {connection === 'connected' ? (
              <Wifi size={15} />
            ) : connection === 'connecting' ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <WifiOff size={15} />
            )}
            {connection === 'connected' ? 'Online' : connection === 'connecting' ? 'Menghubungkan…' : 'Offline'}
          </Badge>

          {/* Online count */}
          <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="xl" bg="white" border="1px solid" borderColor="gray.200" fontSize="sm">
            <Users size={15} color="var(--chakra-colors-gray-400)" />
            <Text fontWeight="bold" color="gray.800">{online}</Text>
            <Text color="gray.500">/ {total} online</Text>
          </Flex>

          {/* Violations */}
          <Badge
            colorPalette="red"
            px={3}
            py={1.5}
            borderRadius="xl"
            fontSize="sm"
            fontWeight="semibold"
            display="flex"
            alignItems="center"
            gap={1.5}
            textTransform="none"
          >
            <AlertTriangle size={15} />
            <Text>{violations.length}</Text>
            <Text fontSize="xs" fontWeight="normal">pelanggaran</Text>
          </Badge>

          {/* Actions */}
          <Link href={`/admin/results/${id}`}>
            <Button size="sm" borderRadius="xl" colorPalette="indigo" variant="subtle" fontWeight="semibold">
              <Award size={16} /> Hasil
            </Button>
          </Link>
          <IconButton onClick={toggleFS} variant="outline" size="sm" borderRadius="xl" aria-label="Fullscreen">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </IconButton>
        </Flex>
      </Flex>

      {/* ─── BODY ─── */}
      <SimpleGrid columns={{ base: 1, xl: 3 }} gap={6}>
        {/* ─── Student Grid ─── */}
        <Box gridColumn={{ xl: 'span 2' }} display="flex" flexDirection="column" gap={4}>
          <Flex flexWrap="wrap" align="center" justify="space-between" gap={3}>
            <Heading size="md" fontWeight="bold" color="gray.800">Progres Siswa</Heading>
            <Flex align="center" gap={2}>
              {/* Search */}
              <Box position="relative">
                <Box position="absolute" left="10px" top="50%" transform="translateY(-50%)" zIndex={2} color="gray.400">
                  <Search size={15} />
                </Box>
                <Input
                  placeholder="Cari…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  w="140px"
                  pl="30px"
                  size="sm"
                  borderRadius="lg"
                  bg="white"
                />
              </Box>
              {/* Sort */}
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                style={{
                  width: '130px',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--chakra-colors-gray-200)',
                  backgroundColor: 'white',
                  outline: 'none',
                  fontSize: '14px',
                }}
              >
                <option value="progress">Progres</option>
                <option value="name">Nama</option>
                <option value="violations">Pelanggaran</option>
                <option value="status">Status</option>
              </select>

              <IconButton
                onClick={() => setSortAsc((v) => !v)}
                size="sm"
                variant="outline"
                borderRadius="lg"
                aria-label="Sort direction"
              >
                <ArrowUpDown size={16} style={{ transform: sortAsc ? 'rotate(180deg)' : 'none' }} />
              </IconButton>
            </Flex>
          </Flex>

          {/* Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} maxH="70vh" overflowY="auto" pr={1} css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-gray-300)', borderRadius: '10px' } }}>
            {displayed.map((s) => {
              const offline = s.status === 'Offline';
              const alerted = (s.violationCount || 0) > 0;
              const done = s.progress >= 100;

              return (
                <Box
                  key={s.userId}
                  position="relative"
                  p={4}
                  borderRadius="xl"
                  borderWidth="1px"
                  transition="all 0.2s"
                  bg={offline ? 'gray.50' : alerted ? 'red.50' : 'white'}
                  borderColor={offline ? 'gray.200' : alerted ? 'red.200' : 'gray.200'}
                  opacity={offline ? 0.6 : 1}
                  _hover={!offline && !alerted ? { shadow: 'md', borderColor: 'indigo.500' } : undefined}
                >
                  {/* Top row */}
                  <Flex align="start" justify="space-between" mb={3}>
                    <Flex align="center" gap={2.5} minW={0}>
                      <Box w="10px" h="10px" borderRadius="full" mt={1} flexShrink={0} bg={offline ? 'gray.400' : 'green.500'} />
                      <Box minW={0}>
                        <Text fontWeight="semibold" fontSize="sm" color="gray.800" truncate>
                          {s.fullName || s.username}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(s.lastActive).toLocaleTimeString('id-ID')}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap={1.5} flexShrink={0}>
                      {alerted && (
                        <Badge colorPalette="red" borderRadius="full" px={2} py={0.5} fontSize="11px">
                          {s.violationCount}
                        </Badge>
                      )}
                      <Badge colorPalette={offline ? 'gray' : 'green'} borderRadius="full" px={2} py={0.5} fontSize="11px">
                        {offline ? 'OFFLINE' : 'LIVE'}
                      </Badge>
                    </Flex>
                  </Flex>

                  {/* Progress */}
                  <Box>
                    <Flex justify="space-between" fontSize="xs" fontWeight="semibold" mb={1}>
                      <Text color="gray.500">Progres</Text>
                      <Text color={done ? 'green.600' : 'gray.800'}>{Math.round(s.progress)}%</Text>
                    </Flex>
                    <Box h="8px" borderRadius="full" bg="gray.200" overflow="hidden">
                      <Box
                        h="full"
                        borderRadius="full"
                        bg={done ? 'green.500' : s.progress >= 50 ? 'amber.500' : 'indigo.500'}
                        transition="width 0.5s ease"
                        style={{ width: `${s.progress}%` }}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}

            {displayed.length === 0 && (
              <Flex gridColumn="1 / -1" direction="column" align="center" justify="center" py={16} textAlign="center">
                <Monitor size={48} color="var(--chakra-colors-gray-400)" style={{ marginBottom: '16px' }} />
                <Text color="gray.500" fontWeight="medium">
                  {query ? 'Siswa tidak ditemukan' : 'Menunggu siswa masuk…'}
                </Text>
              </Flex>
            )}
          </SimpleGrid>
        </Box>

        {/* ─── Violation Logs ─── */}
        <Stack gap={4}>
          <Flex align="center" justify="space-between">
            <Heading size="md" fontWeight="bold" color="gray.800" display="flex" alignItems="center" gap={2}>
              <AlertTriangle size={20} color="var(--chakra-colors-red-600)" />
              Pelanggaran
            </Heading>
            {violations.length > 0 && (
              <Button size="xs" variant="ghost" color="gray.500" _hover={{ color: 'red.600' }} onClick={() => setViolations([])}>
                Bersihkan
              </Button>
            )}
          </Flex>

          <Stack id="violation-logs" gap={2} h="70vh" overflowY="auto" pr={1} css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-red-200)', borderRadius: '10px' } }}>
            {violations.map((v) => (
              <Box key={v.id} p={3} bg="red.50" border="1px solid" borderColor="red.100" borderRadius="xl" className="animate-fade-up">
                <Flex justify="space-between" align="start" mb={1}>
                  <Text fontWeight="semibold" fontSize="sm" color="red.900">{v.username}</Text>
                  <Text fontSize="xs" color="red.500" whiteSpace="nowrap" ml={2}>
                    {new Date(v.timestamp).toLocaleTimeString('id-ID')}
                  </Text>
                </Flex>
                <Text fontSize="11px" fontWeight="bold" color="red.700" textTransform="uppercase" letterSpacing="wider" mb={1}>
                  {v.type}
                </Text>
                <Text fontSize="xs" color="red.600">{v.description}</Text>
              </Box>
            ))}

            {violations.length === 0 && (
              <Flex h="full" direction="column" align="center" justify="center" textAlign="center" px={4}>
                <Flex w="16" h="16" bg="green.50" borderRadius="full" align="center" justify="center" mb={4}>
                  <CheckCircle2 size={32} color="var(--chakra-colors-green-500)" />
                </Flex>
                <Text fontWeight="medium" color="gray.800">Semua bersih</Text>
                <Text fontSize="sm" color="gray.500" mt={1} maxW="180px">
                  Belum ada pelanggaran yang terdeteksi.
                </Text>
              </Flex>
            )}
          </Stack>
        </Stack>

      </SimpleGrid>
    </Stack>
  );
}