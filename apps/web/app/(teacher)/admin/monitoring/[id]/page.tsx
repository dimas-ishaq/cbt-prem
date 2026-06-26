'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useSound } from '@/hooks/useSound';
import { useEffect, useState, use, useCallback, useRef } from 'react';
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
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { toast } from '@/lib/toaster';
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
  Select,
  createListCollection,
} from '@chakra-ui/react';

interface Student {
  userId: string;
  username: string;
  fullName: string;
  progress: number;
  lastActive: string;
  status: string;
  violationCount?: number;
  currentQuestionIndex?: number;
  endTime?: string;
}

interface Violation {
  id: string;
  username: string;
  type: string;
  description: string;
  timestamp: string;
}

type SortKey = 'name' | 'progress' | 'violations' | 'status';

const sortOptions = createListCollection({
  items: [
    { label: 'Progres', value: 'progress' },
    { label: 'Nama', value: 'name' },
    { label: 'Pelanggaran', value: 'violations' },
    { label: 'Status', value: 'status' },
  ],
});

const violationFilterOptions = createListCollection({
  items: [
    { label: 'Semua Pelanggaran', value: 'ALL' },
    { label: 'Tab Switch / Blur', value: 'TAB_SWITCH' },
    { label: 'Keluar Fullscreen', value: 'FULLSCREEN_EXIT' },
    { label: 'Buka DevTools', value: 'DEVTOOLS' },
  ],
});

export default function ExamMonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const socket = useSocket();
  const { playViolation, playNotification, playSuccess } = useSound();
  const confirmDialog = useConfirm();

  const [students, setStudents] = useState<Record<string, Student>>({});

  const lockStudent = (studentId: string) => {
    if (socket) {
      socket.emit('lock_student', { examId: id, studentId });
    }
  };

  const unlockStudent = (studentId: string) => {
    if (socket) {
      socket.emit('unlock_student', { examId: id, studentId });
    }
  };

  const forceSubmitStudent = async (studentId: string, studentName: string) => {
    const confirmed = await confirmDialog({
      title: 'Paksa Kumpulkan Jawaban?',
      description: `Apakah Anda yakin ingin memaksa mengumpulkan jawaban untuk siswa ${studentName}? Sesi ujian siswa ini akan selesai dan tidak dapat diubah lagi.`,
      confirmText: 'Kumpulkan Sekarang',
    });
    if (confirmed && socket) {
      socket.emit('force_submit_student', { examId: id, studentId });
    }
  };
  const [violations, setViolations] = useState<Violation[]>([]);
  const [connection, setConnection] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [fullscreen, setFullscreen] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('progress');
  const [sortAsc, setSortAsc] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const [violationFilter, setViolationFilter] = useState<string>('ALL');

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const studentsRef = useRef(students);
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRemainingTime = (endTime?: string) => {
    if (!endTime) return '--:--:--';
    const remaining = Math.max(0, Math.floor((new Date(endTime).getTime() - nowTick) / 1000));
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isEndingSoon = (endTime?: string) => {
    if (!endTime) return false;
    return Math.max(0, Math.floor((new Date(endTime).getTime() - nowTick) / 1000)) < 300;
  };



  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam-monitoring', id],
    queryFn: async () => (await api.get(`/exams/${id}`)).data,
    refetchInterval: 60_000,
  });

  // Dedicated sync query — fetches live session data every 60 s
  const { data: sessionsData, refetch: syncSessions, isFetching: isSyncing } = useQuery({
    queryKey: ['exam-sessions-sync', id],
    queryFn: async () => {
      const res = await api.get(`/exam-sessions/exam/${id}`);
      return res.data as any[];
    },
    refetchInterval: 60_000,
    enabled: !!id,
  });

  // Synchronize student data and violations from the HTTP sync payload
  useEffect(() => {
    if (!sessionsData) return;
    const totalQuestions = exam?.examQuestions?.length || 1;

    const syncedStudents: Record<string, Student> = {};
    const syncedViolations: Violation[] = [];

    sessionsData.forEach((session: any) => {
      const studentUser = session.student?.user;
      if (!studentUser) return;

      const uid = studentUser.id;
      const isSubmitted = session.status === 'SUBMITTED' || session.status === 'FINISHED';
      const isLocked = session.status === 'LOCKED';
      const freshProgress = session.answers?.length
        ? Math.min(100, (session.answers.length / totalQuestions) * 100)
        : 0;

      syncedStudents[uid] = {
        userId: uid,
        username: studentUser.username,
        fullName: studentUser.fullName,
        status: isSubmitted ? 'Selesai' : (isLocked ? 'Locked' : 'Online'),
        progress: freshProgress,
        lastActive: session.lastActiveAt || session.startTime || new Date().toISOString(),
        violationCount: session.violations?.length || 0,
        currentQuestionIndex: undefined,
        endTime: session.endTime,
      };

      if (Array.isArray(session.violations)) {
        session.violations.forEach((v: any) => {
          syncedViolations.push({
            id: v.id || `${v.timestamp}-${Math.random()}`,
            username: studentUser.fullName || studentUser.username,
            type: v.type,
            description: v.description || '',
            timestamp: v.timestamp,
          });
        });
      }
    });

    syncedViolations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setStudents((prev) => {
      const merged = { ...syncedStudents };
      Object.entries(prev).forEach(([uid, prevStudent]) => {
        if (!merged[uid]) {
          merged[uid] = prevStudent;
          return;
        }

        const current = merged[uid];
        merged[uid] = {
          ...current,
          status: current.status === 'Online' && prevStudent.status === 'Offline' ? 'Offline' : current.status,
          currentQuestionIndex: prevStudent.currentQuestionIndex ?? current.currentQuestionIndex,
          endTime: current.endTime || prevStudent.endTime,
        };
      });
      return merged;
    });

    setViolations(syncedViolations);
    setLastSyncedAt(new Date());
  }, [sessionsData, exam?.examQuestions?.length]);

  const handleManualSync = useCallback(async () => {
    await syncSessions();
  }, [syncSessions]);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  const totalQ = exam?.examQuestions?.length || 1;

  /* ─── Socket ─── */
  useEffect(() => {
    if (!socket) {
      setConnection('disconnected');
      return;
    }

    setConnection(socket.connected ? 'connected' : 'connecting');

    const onConnect = () => setConnection('connected');
    const onDisconnect = () => setConnection('disconnected');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.emit('join_proctor', { examId: id });

    const handlers: Record<string, (d: any) => void> = {
      student_joined: (d) => {
        playNotification();
        setStudents((prev) => ({
          ...prev,
          [d.userId]: {
            userId: d.userId,
            username: d.username,
            fullName: prev[d.userId]?.fullName || d.username,
            status: prev[d.userId]?.status === 'Locked' ? 'Locked' : 'Online',
            progress: prev[d.userId]?.progress || 0,
            lastActive: new Date().toISOString(),
            currentQuestionIndex: prev[d.userId]?.currentQuestionIndex,
            violationCount: prev[d.userId]?.violationCount || 0,
          },
        }));
      },
      student_offline: (d) =>
        setStudents((prev) => {
          const s = prev[d.userId];
          if (!s) return prev;
          return {
            ...prev,
            [d.userId]: {
              ...s,
              status: s.status === 'Locked' ? 'Locked' : 'Offline',
            },
          };
        }),
      student_answer_update: (d) =>
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, progress: Math.min(100, s.progress + 100 / totalQ), lastActive: new Date().toISOString() } };
        }),
      student_question_update: (d) =>
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return {
            ...prev,
            [d.studentId]: {
              ...s,
              currentQuestionIndex: d.questionIndex,
              lastActive: new Date().toISOString(),
            },
          };
        }),
      violation_alert: (d) => {
        playViolation();
        setViolations((prev) => [
          { id: Date.now().toString() + Math.random().toString(36).slice(2, 11), username: d.username, type: d.type, description: d.description, timestamp: d.timestamp },
          ...prev.slice(0, 99),
        ]);
        setStudents((prev) => {
          const s = prev[d.studentId];
          return s ? { ...prev, [d.studentId]: { ...s, violationCount: (s.violationCount || 0) + 1 } } : prev;
        });
      },
      student_locked: (d) => {
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, status: 'Locked' } };
        });
      },
      student_unlocked: (d) => {
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, status: 'Online' } };
        });
      },
      student_submitted: (d) => {
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, status: 'Selesai', progress: 100 } };
        });
      },
      student_time_added: (d) => {
        toast.success({
          title: 'Waktu Ditambahkan',
          description: `Waktu ujian siswa berhasil ditambah 5 menit.`,
        });
        playSuccess();
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, endTime: d.newEndTime } };
        });
      },
    };

    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      Object.keys(handlers).forEach((ev) => socket.off(ev));
    };
  }, [socket, id, totalQ, playSuccess]);

  // Synchronize student data and violations from the initial HTTP API load
  useEffect(() => {
    if (exam && exam.examSessions) {
      const initialStudents: Record<string, Student> = {};
      const initialViolations: Violation[] = [];

      exam.examSessions.forEach((session: any) => {
        const studentUser = session.student?.user;
        if (studentUser) {
          const isSubmitted = session.status === 'SUBMITTED' || session.status === 'FINISHED';
          const isLocked = session.status === 'LOCKED';
          initialStudents[studentUser.id] = {
            userId: studentUser.id,
            username: studentUser.username,
            fullName: studentUser.fullName,
            status: isSubmitted ? 'Selesai' : (isLocked ? 'Locked' : 'Online'),
            progress: (session.answers?.length || 0) > 0 ? (session.answers.length / (exam.examQuestions?.length || 1)) * 100 : 0,
            lastActive: session.lastActiveAt || session.startTime || new Date().toISOString(),
            violationCount: session.violations?.length || 0,
            endTime: session.endTime,
          };

          // Collect historical violations
          if (Array.isArray(session.violations)) {
            session.violations.forEach((v: any) => {
              initialViolations.push({
                id: v.id || `${v.timestamp}-${Math.random()}`,
                username: studentUser.fullName || studentUser.username,
                type: v.type,
                description: v.description || '',
                timestamp: v.timestamp,
              });
            });
          }
        }
      });

      // Sort violations descending by timestamp
      initialViolations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setViolations(initialViolations);

      setStudents((prev) => {
        const merged = { ...initialStudents };
        Object.keys(prev).forEach((key) => {
          const prevStudent = prev[key];
          if (!prevStudent) return;

          if (merged[key]) {
            merged[key] = {
              ...merged[key],
              status: prevStudent.status === 'Offline' && merged[key].status === 'Online' ? 'Offline' : prevStudent.status,
              progress: Math.max(merged[key].progress, prevStudent.progress),
              violationCount: Math.max(merged[key].violationCount || 0, prevStudent.violationCount || 0),
              currentQuestionIndex: prevStudent.currentQuestionIndex || merged[key].currentQuestionIndex,
              endTime: prevStudent.endTime || merged[key].endTime,
            };
          } else {
            merged[key] = prevStudent;
          }
        });
        return merged;
      });
    }
  }, [exam]);

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

  /* ─── Realtime ticking timer ─── */
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  /* ─── Timer ─── */
  const timer = (() => {
    if (!exam?.endTime) return { text: '-', urgent: false };
    const diff = new Date(exam.endTime).getTime() - nowTime;
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
      <Flex direction="column" gap={4}>
        <Flex direction="column" gap={1.5}>
          <Flex align="left" gap={0}>
            <Link href="/admin/monitoring">
              <IconButton variant="ghost" aria-label="Back" borderRadius="xl" border={1} flexShrink={0}>
                <ChevronLeft size={22} />
              </IconButton>
            </Link>
            <Box minW={0} flex="1">
              <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.800" display="flex" gap={3} lineClamp={1} mt={1}>
                <Box as="span" flexShrink={0} display="inline-flex">
                  <Monitor size={24} color="var(--chakra-colors-indigo-500)" />
                </Box>
                <Box as="span" className="truncate">{exam?.title}</Box>
              </Heading>
            </Box>
          </Flex>
          <Text fontSize="sm" color="gray.500" lineClamp={1}>
            {exam?.subject?.name} &middot; {exam?.examQuestions?.length} Soal &middot; ID: {id.slice(0, 8)}…
          </Text>
        </Flex>

        <Flex direction="column" gap={3}>
          <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
            <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="xl" bg="gray.50" border="1px solid" borderColor="gray.200" fontSize="sm" fontWeight="medium">
              <Timer size={15} color="var(--chakra-colors-gray-400)" />
              <Text color={timer.urgent ? 'red.600' : 'gray.800'}>{timer.text}</Text>
            </Flex>

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
          </Flex>

          <Flex wrap="wrap" gap={3} align="center">
            <Flex align="center" gap={1.5} px={3} py={1.5} borderRadius="xl" bg="gray.50" border="1px solid" borderColor="gray.200" fontSize="sm">
              <Users size={15} color="var(--chakra-colors-gray-400)" />
              <Text fontWeight="bold" color="gray.800">{online}</Text>
              <Text color="gray.500">/ {total} siswa</Text>
            </Flex>

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

            <Flex align="center" gap={1.5} ml="auto">
              {lastSyncedAt && (
                <Text fontSize="11px" color="gray.400" whiteSpace="nowrap">
                  Sinkron:{' '}
                  {lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </Text>
              )}
              <IconButton
                onClick={handleManualSync}
                disabled={isSyncing}
                variant="outline"
                size="sm"
                borderRadius="xl"
                aria-label="Sinkronisasi Data"
                cursor="pointer"
              >
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              </IconButton>
            </Flex>

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
      </Flex>

      {/* ─── BODY ─── */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
        {/* ─── Student Grid Panel (Card) ─── */}
        <Box
          gridColumn={{ lg: 'span 2' }}
          bg="white"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.200"
          shadow="sm"
          p={6}
          display="flex"
          flexDirection="column"
          gap={5}
        >
          <Flex flexWrap="wrap" align="center" justify="space-between" gap={3} pb={2} borderBottom="1px solid" borderColor="gray.150">
            <Heading size="md" fontWeight="bold" color="gray.850">Progres Siswa</Heading>
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
              <Box minW="130px">
                <Select.Root
                  collection={sortOptions}
                  value={[sortKey]}
                  onValueChange={(details) => setSortKey((details.value[0] || 'progress') as SortKey)}
                  positioning={{ sameWidth: true }}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger borderRadius="lg" fontSize="sm" height="36px">
                      <Select.ValueText placeholder="Progres" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                      <Select.ClearTrigger />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {sortOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>

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
          <SimpleGrid columns={{ base: 1, sm: 2, '2xl': 3 }} gap={4} maxH="65vh" overflowY="auto" pr={2} css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-gray-300)', borderRadius: '10px' } }}>
            {displayed.map((s) => {
              const offline = s.status === 'Offline';
              const locked = s.status === 'Locked';
              const finished = s.status === 'Selesai' || s.progress >= 100;
              const alerted = (s.violationCount || 0) > 0;
              const done = s.progress >= 100 || finished;

              return (
                <Box
                  key={s.userId}
                  position="relative"
                  p={4}
                  borderRadius="xl"
                  borderWidth="1px"
                  transition="all 0.2s"
                  bg={finished ? 'green.50/50' : locked ? 'red.50/30' : offline ? 'gray.50' : alerted ? 'red.50' : 'white'}
                  borderColor={finished ? 'green.200' : locked ? 'red.200' : offline ? 'gray.200' : alerted ? 'red.200' : 'gray.200'}
                  opacity={offline ? 0.7 : 1}
                  _hover={!offline && !alerted && !locked && !finished ? { shadow: 'md', borderColor: 'indigo.500' } : undefined}
                >
                  {/* Top row */}
                  <Flex align="start" justify="space-between" mb={3}>
                    <Flex align="center" gap={2.5} minW={0} flex="1">
                      <Box
                        w="10px"
                        h="10px"
                        borderRadius="full"
                        mt={1}
                        flexShrink={0}
                        bg={
                          finished ? 'green.500' :
                            locked ? 'red.500' :
                              offline ? 'gray.400' : 'green.500'
                        }
                      />
                      <Box minW={0} flex="1">
                        <Text fontWeight="semibold" fontSize="sm" color="gray.800" lineClamp={1}>
                          {s.fullName || s.username}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(s.lastActive).toLocaleTimeString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta' })}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap={1.5} flexShrink={0}>
                      {alerted && (
                        <Badge colorPalette="red" borderRadius="full" px={2} py={0.5} fontSize="11px">
                          {s.violationCount}
                        </Badge>
                      )}
                      <Badge
                        colorPalette={
                          finished ? 'green' :
                            locked ? 'red' :
                              offline ? 'gray' : 'green'
                        }
                        borderRadius="full"
                        px={2}
                        py={0.5}
                        fontSize="11px"
                        textTransform="uppercase"
                      >
                        {finished ? 'SELESAI' : locked ? 'TERKUNCI' : offline ? 'OFFLINE' : 'LIVE'}
                      </Badge>
                    </Flex>
                  </Flex>

                  {/* Progress */}
                  <Box>
                    <Flex justify="space-between" fontSize="xs" fontWeight="semibold" mb={1}>
                      <Text color="gray.500">Progres</Text>
                      <Text color={done ? 'green.600' : 'gray.800'}>{Math.round(s.progress)}%</Text>
                    </Flex>
                    <Box h="8px" borderRadius="full" bg="gray.200" overflow="hidden" mb={2}>
                      <Box
                        h="full"
                        borderRadius="full"
                        bg={done ? 'green.500' : s.progress >= 50 ? 'amber.500' : 'indigo.500'}
                        transition="width 0.5s ease"
                        style={{ width: `${s.progress}%` }}
                      />
                    </Box>
                    <Text fontSize="11px" fontWeight="semibold" color="indigo.650">
                      {finished ? 'Ujian telah dikumpulkan' : `Sedang Mengerjakan: Soal #${s.currentQuestionIndex || 1}`}
                    </Text>
                    <Flex align="center" justify="space-between" mt={1}>
                      <Text fontSize="11px" color="gray.500">
                        Sisa waktu
                      </Text>
                      <Text
                        fontSize="11px"
                        fontWeight="bold"
                        color={finished ? 'green.600' : isEndingSoon(s.endTime) ? 'red.600' : 'gray.800'}
                        fontFamily="mono"
                      >
                        {finished ? '00:00:00' : formatRemainingTime(s.endTime)}
                      </Text>
                    </Flex>
                  </Box>

                  {/* Action Control Panel */}
                  {!finished && (
                    <Flex gap={2} mt={4} borderTop="1px solid" borderColor="gray.100" pt={3}>
                      {locked ? (
                        <Button
                          size="xs"
                          variant="solid"
                          colorPalette="green"
                          borderRadius="lg"
                          flex={1}
                          onClick={() => unlockStudent(s.userId)}
                          fontWeight="bold"
                          cursor="pointer"
                        >
                          Buka Kunci
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="red"
                          borderRadius="lg"
                          flex={1}
                          onClick={() => lockStudent(s.userId)}
                          fontWeight="bold"
                          cursor="pointer"
                        >
                          Kunci Sesi
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="subtle"
                        colorPalette="gray"
                        borderRadius="lg"
                        flex={1}
                        onClick={() => forceSubmitStudent(s.userId, s.fullName || s.username)}
                        fontWeight="bold"
                        cursor="pointer"
                      >
                        Kumpulkan
                      </Button>
                      <Button
                        size="xs"
                        variant="solid"
                        colorPalette="amber"
                        borderRadius="lg"
                        onClick={() => {
                          if (socket) {
                            socket.emit('add_student_time', { examId: id, studentId: s.userId, minutes: 5 });
                          }
                        }}
                        fontWeight="bold"
                        cursor="pointer"
                      >
                        +5m
                      </Button>
                    </Flex>
                  )}
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

        {/* ─── Violation Logs Panel (Card) ─── */}
        <Box
          bg="white"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.200"
          shadow="sm"
          p={6}
          display="flex"
          flexDirection="column"
          gap={5}
        >
          <Flex direction="column" gap={3} pb={3} borderBottom="1px solid" borderColor="gray.150">
            <Flex align="center" justify="space-between">
              <Heading size="md" fontWeight="bold" color="gray.855" display="flex" alignItems="center" gap={2}>
                <AlertTriangle size={20} color="var(--chakra-colors-red-600)" />
                Pelanggaran
              </Heading>
              {violations.length > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  color="red.500"
                  _hover={{ bg: 'red.50', color: 'red.700' }}
                  onClick={() => setViolations([])}
                  borderRadius="md"
                  px={2}
                  py={1}
                  fontWeight="bold"
                  cursor="pointer"
                >
                  Bersihkan Log
                </Button>
              )}
            </Flex>

            <Box w="full">
              <Select.Root
                collection={violationFilterOptions}
                value={[violationFilter]}
                onValueChange={(details) => setViolationFilter(details.value[0] || 'ALL')}
                positioning={{ sameWidth: true }}
                size="sm"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger borderRadius="lg">
                    <Select.ValueText placeholder="Semua Pelanggaran" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content zIndex={100}>
                    {violationFilterOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>
          </Flex>

          <Stack id="violation-logs" gap={2} h="65vh" overflowY="auto" pr={1} css={{ '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-red-200)', borderRadius: '10px' } }}>
            {violations
              .filter((v) => {
                if (violationFilter === 'ALL') return true;
                if (violationFilter === 'TAB_SWITCH') return v.type.toLowerCase().includes('tab') || v.type.toLowerCase().includes('blur');
                if (violationFilter === 'FULLSCREEN_EXIT') return v.type.toLowerCase().includes('fullscreen') || v.type.toLowerCase().includes('screen');
                if (violationFilter === 'DEVTOOLS') return v.type.toLowerCase().includes('devtools') || v.type.toLowerCase().includes('inspect');
                return true;
              })
              .map((v) => (
                <Box key={v.id} p={3} bg="red.50" border="1px solid" borderColor="red.100" borderRadius="xl" className="animate-fade-up">
                  <Flex justify="space-between" align="start" mb={1}>
                    <Text fontWeight="semibold" fontSize="sm" color="red.900">{v.username}</Text>
                    <Text fontSize="xs" color="red.500" whiteSpace="nowrap" ml={2}>
                      {new Date(v.timestamp).toLocaleTimeString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta' })}
                    </Text>
                  </Flex>
                  <Text fontSize="11px" fontWeight="bold" color="red.700" textTransform="uppercase" letterSpacing="wider" mb={1}>
                    {v.type}
                  </Text>
                  <Text fontSize="xs" color="red.600">{v.description}</Text>
                </Box>
              ))}

            {violations.length === 0 && (
              <Flex h="full" direction="column" align="center" justify="center" textAlign="center" py={12} px={4}>
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
        </Box>

      </SimpleGrid>
    </Stack>
  );
}