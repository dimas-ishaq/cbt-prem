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
  answeredQuestionIds?: string[];
}

interface Violation {
  id: string;
  username: string;
  type: string;
  description: string;
  timestamp: string;
}

const progressFilterOptions = createListCollection({
  items: [
    { label: 'Semua Progres', value: 'ALL' },
    { label: 'Sedang Dikerjakan', value: 'IN_PROGRESS' },
    { label: 'Selesai Dikerjakan', value: 'FINISHED' },
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
    if (socket && lockToken) {
      socket.emit('unlock_student', { examId: id, studentId, token: lockToken });
    } else {
      toast.error({ title: 'Token tidak tersedia', description: 'Refresh token terlebih dahulu.' });
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
  const [violationFilter, setViolationFilter] = useState<string>('ALL');
  const [progressFilter, setProgressFilter] = useState<string>('ALL');
  const [prevCount, setPrevCount] = useState(0);
  const [lockToken, setLockToken] = useState<string | null>(null);
  const [lockTokenExpiresAt, setLockTokenExpiresAt] = useState<string | null>(null);

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const studentsRef = useRef(students);
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const normalizeTime = (value?: string | Date | null) => {
    if (!value) return null;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? null : new Date(time).toISOString();
  };

  const pickLatestTime = (a?: string | Date | null, b?: string | Date | null) => {
    const ta = a ? new Date(a).getTime() : NaN;
    const tb = b ? new Date(b).getTime() : NaN;
    if (Number.isNaN(ta)) return normalizeTime(b);
    if (Number.isNaN(tb)) return normalizeTime(a);
    return new Date(Math.max(ta, tb)).toISOString();
  };

  const formatRemainingTime = (endTime?: string) => {
    if (!endTime) return '--:--:--';
    const remaining = Math.max(0, Math.floor((new Date(endTime).getTime() - nowTick) / 1000));
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTokenCountdown = (expiresAt?: string | null) => {
    if (!expiresAt) return '--:--';
    const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - nowTick) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRefreshToken = () => {
    if (!socket) return;
    socket.emit('refresh_lock_token', { examId: id });
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

      const currentEndTime = normalizeTime(session.endTime);

      syncedStudents[uid] = {
        userId: uid,
        username: studentUser.username,
        fullName: studentUser.fullName,
        status: isSubmitted ? 'Selesai' : (isLocked ? 'Locked' : 'Online'),
        progress: freshProgress,
        lastActive: session.lastActiveAt || session.startTime || new Date().toISOString(),
        violationCount: session.violations?.length || 0,
        currentQuestionIndex: undefined,
        endTime: currentEndTime || undefined,
        answeredQuestionIds: session.answers?.map((ans: any) => ans.questionId).filter(Boolean) || [],
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
          answeredQuestionIds: current.answeredQuestionIds || prevStudent.answeredQuestionIds,
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

    const onConnect = () => {
      setConnection('connected');
      socket.emit('join_proctor', { examId: id });
      socket.emit('request_lock_info', { examId: id });
    };
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
          const currentAnswered = s.answeredQuestionIds || [];
          const nextAnswered = currentAnswered.includes(d.questionId)
            ? currentAnswered
            : [...currentAnswered, d.questionId];
          const newProgress = totalQ > 0 ? (nextAnswered.length / totalQ) * 100 : 0;
          return {
            ...prev,
            [d.studentId]: {
              ...s,
              answeredQuestionIds: nextAnswered,
              progress: Math.min(100, newProgress),
              lastActive: new Date().toISOString()
            }
          };
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
        console.info('[monitoring:student_time_added] received', {
          examId: id,
          studentId: d.studentId,
          addedMinutes: d.addedMinutes,
          newEndTime: d.newEndTime,
          endTime: d.endTime,
        });
        toast.success({
          title: 'Waktu Ditambahkan',
          description: `Waktu ujian siswa berhasil ditambah ${d.addedMinutes || 5} menit.`,
        });
        playSuccess();

        const nextEndTime = pickLatestTime(d.newEndTime, d.endTime) || undefined;
        setStudents((prev) => {
          const s = prev[d.studentId];
          if (!s) return prev;
          return { ...prev, [d.studentId]: { ...s, endTime: nextEndTime || s.endTime } };
        });
        void syncSessions();
      },
      session_auto_locked: (d) => {
        if (d?.examId !== id) return;
        toast.error({
          title: 'Siswa Terkunci Otomatis',
          description: `${d.studentName || d.username || 'Siswa'} mencapai batas pelanggaran.`,
        });
        playViolation();
        if (d?.token) {
          setLockToken(d.token);
          setLockTokenExpiresAt(d.expiresAt || null);
        }
        void syncSessions();
      },
      lock_token_refreshed: (d) => {
        if (d?.examId !== id) return;
        setLockToken(d.token || null);
        setLockTokenExpiresAt(d.expiresAt || null);
        toast.success({
          title: 'Token Diperbarui',
          description: 'Token buka kunci berhasil di-refresh.',
        });
      },
      lock_info_update: (d) => {
        if (d?.examId !== id) return;
        setLockToken(d.lockToken || null);
        setLockTokenExpiresAt(d.lockTokenExpiresAt || null);
      },
    };

    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      Object.keys(handlers).forEach((ev) => socket.off(ev));
    };
  }, [socket, id, totalQ, playSuccess, syncSessions]);

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
            answeredQuestionIds: session.answers?.map((ans: any) => ans.questionId).filter(Boolean) || [],
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
            const mergedAnswered = Array.from(new Set([
              ...(merged[key].answeredQuestionIds || []),
              ...(prevStudent.answeredQuestionIds || []),
            ]));
            merged[key] = {
              ...merged[key],
              status: prevStudent.status === 'Offline' && merged[key].status === 'Online' ? 'Offline' : prevStudent.status,
              progress: Math.max(merged[key].progress, prevStudent.progress),
              violationCount: Math.max(merged[key].violationCount || 0, prevStudent.violationCount || 0),
              currentQuestionIndex: prevStudent.currentQuestionIndex ?? merged[key].currentQuestionIndex,
              endTime: pickLatestTime(prevStudent.endTime, merged[key].endTime) || prevStudent.endTime || merged[key].endTime,
              answeredQuestionIds: mergedAnswered,
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
    .filter((s) => {
      const isFinished = s.status === 'Selesai' || s.progress >= 100;
      if (progressFilter === 'ALL') return true;
      if (progressFilter === 'IN_PROGRESS') return !isFinished;
      if (progressFilter === 'FINISHED') return isFinished;
      return true;
    })
    .sort((a, b) => (a.fullName || a.username).localeCompare(b.fullName || b.username));

  if (isLoading) {
    return (
      <Flex align="center" justify="center" minH="60vh" direction="column" gap={4}>
        <Flex
          w={14}
          h={14}
          borderRadius="2xl"
          bg="brand.subtle"
          border="1px solid"
          borderColor="border.default"
          align="center"
          justify="center"
        >
          <Spinner size="md" color="brand.solid" />
        </Flex>
        <Text fontSize="sm" color="text.secondary" fontWeight="medium">Memuat data ujian…</Text>
      </Flex>
    );
  }

  const total = Object.keys(students).length;
  const online = Object.values(students).filter((s) => s.status !== 'Offline').length;
  const finishedCount = Object.values(students).filter((s) => s.status === 'Selesai' || s.progress >= 100).length;
  const offlineCount = Object.values(students).filter((s) => s.status === 'Offline').length;

  const getViolationMeta = (type: string): { palette: string; label: string } => {
    const t = type.toLowerCase();
    if (t.includes('tab') || t.includes('blur')) return { palette: 'amber', label: 'Tab / Blur' };
    if (t.includes('fullscreen') || t.includes('screen')) return { palette: 'orange', label: 'Fullscreen Exit' };
    if (t.includes('devtools') || t.includes('inspect')) return { palette: 'red', label: 'DevTools' };
    return { palette: 'red', label: type };
  };

  return (
    <Stack gap={5}>
      {/* ─── Command Bar Header ─── */}
      <Box
        bg="bg.surface"
        borderRadius="card"
        border="1px solid"
        borderColor="border.default"
        px={5}
        py={4}
        shadow="card-dark"
      >
        <Flex align="center" gap={4} wrap="wrap">
          {/* Back + Title */}
          <Flex align="center" gap={2} flex="1" minW={0}>
            <Link href="/admin/monitoring">
              <IconButton variant="ghost" aria-label="Back" borderRadius="xl" size="sm" cursor="pointer" flexShrink={0}>
                <ChevronLeft size={20} />
              </IconButton>
            </Link>
            <Box minW={0} flex="1">
              <Flex align="center" gap={2}>
                <Monitor size={16} color="var(--chakra-colors-brand-text)" style={{ flexShrink: 0 }} />
                <Heading size="md" fontWeight="bold" color="text.primary" lineClamp={1}>
                  {exam?.title}
                </Heading>
              </Flex>
              <Text fontSize="xs" color="text.secondary" mt={0.5}>
                {exam?.subject?.name} · {exam?.examQuestions?.length} Soal · ID: #{id.slice(0, 8)}
              </Text>
            </Box>
          </Flex>

          {/* Right: Timer + Connection + Actions */}
          <HStack gap={2} flexShrink={0} flexWrap="wrap">
            {/* Timer pill */}
            <Flex
              align="center"
              gap={1.5}
              px={3}
              py={1.5}
              borderRadius="xl"
              bg={timer.urgent ? 'status.danger.bg' : 'bg.subtle'}
              border="1px solid"
              borderColor={timer.urgent ? 'status.danger.text' : 'border.default'}
            >
              <Timer size={13} color={timer.urgent ? 'var(--chakra-colors-status-danger-text)' : 'var(--chakra-colors-text-muted)'} />
              <Text fontSize="sm" fontWeight="bold" fontFamily="mono" color={timer.urgent ? 'status.danger.text' : 'text.primary'}>
                {timer.text}
              </Text>
            </Flex>

            {/* Connection badge */}
            <Badge
              bg={connection === 'connected' ? 'status.success.bg' : connection === 'connecting' ? 'status.warning.bg' : 'status.danger.bg'}
              color={connection === 'connected' ? 'status.success.text' : connection === 'connecting' ? 'status.warning.text' : 'status.danger.text'}
              px={2.5}
              py={1.5}
              borderRadius="xl"
              fontSize="xs"
              fontWeight="semibold"
              textTransform="none"
              display="flex"
              alignItems="center"
              gap={1.5}
              border="1px solid"
              borderColor={connection === 'connected' ? 'status.success.text' : connection === 'connecting' ? 'status.warning.text' : 'status.danger.text'}
            >
              {connection === 'connected' ? (
                <Wifi size={13} />
              ) : connection === 'connecting' ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <WifiOff size={13} />
              )}
              {connection === 'connected' ? 'Terhubung' : connection === 'connecting' ? 'Menghubungkan…' : 'Terputus'}
            </Badge>

            {/* Sync info + button */}
            <Flex align="center" gap={1.5}>
              {lastSyncedAt && (
                <Text fontSize="11px" color="text.muted" whiteSpace="nowrap">
                  Sinkron:{' '}
                  {lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              </IconButton>
            </Flex>

            {/* Results link */}
            <Link href={`/admin/results/${id}`}>
              <Button size="sm" borderRadius="xl" colorPalette="indigo" variant="subtle" fontWeight="semibold">
                <Award size={14} /> Hasil
              </Button>
            </Link>

            {/* Fullscreen toggle */}
            <IconButton
              onClick={toggleFS}
              variant="outline"
              size="sm"
              borderRadius="xl"
              aria-label="Fullscreen"
              cursor="pointer"
            >
              {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </IconButton>
          </HStack>
        </Flex>
      </Box>

      {/* ─── 4 Metric Summary Cards ─── */}
      <SimpleGrid columns={{ base: 2, sm: 4 }} gap={4}>
        {/* Online */}
        <Box
          bg="bg.surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border.default"
          borderTopWidth="3px"
          borderTopColor="status.success.text"
          p={4}
          boxShadow="0 2px 10px rgba(16,185,129,0.07)"
        >
          <Text fontSize="11px" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
            Aktif Online
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="text.primary" lineHeight="1">{online}</Text>
          <Text fontSize="xs" color="status.success.text" mt={1.5} fontWeight="medium">dari {total} peserta</Text>
        </Box>

        {/* Selesai */}
        <Box
          bg="bg.surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border.default"
          borderTopWidth="3px"
          borderTopColor="brand.solid"
          p={4}
          shadow="card-dark"
        >
          <Text fontSize="11px" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
            Selesai
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="text.primary" lineHeight="1">{finishedCount}</Text>
          <Text fontSize="xs" color="brand.text" mt={1.5} fontWeight="medium">mengumpulkan jawaban</Text>
        </Box>

        {/* Offline */}
        <Box
          bg="bg.surface"
          borderRadius="xl"
          border="1px solid"
          borderColor="border.default"
          borderTopWidth="3px"
          borderTopColor="text.muted"
          p={4}
          shadow="card-dark"
        >
          <Text fontSize="11px" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
            Offline
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="text.primary" lineHeight="1">{offlineCount}</Text>
          <Text fontSize="xs" color="text.muted" mt={1.5} fontWeight="medium">terputus sementara</Text>
        </Box>

        {/* Violations */}
        <Box
          bg={violations.length > 0 ? 'status.danger.bg' : 'bg.surface'}
          borderRadius="xl"
          border="1px solid"
          borderColor={violations.length > 0 ? 'status.danger.text' : 'border.default'}
          borderTopWidth="3px"
          borderTopColor={violations.length > 0 ? 'status.danger.text' : 'text.muted'}
          p={4}
          shadow="card-dark"
          transition="all 0.3s"
        >
          <Text fontSize="11px" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
            Pelanggaran
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={violations.length > 0 ? 'status.danger.text' : 'text.primary'} lineHeight="1">
            {violations.length}
          </Text>
          <Text fontSize="xs" color={violations.length > 0 ? 'status.danger.text' : 'text.muted'} mt={1.5} fontWeight="medium">
            total terdeteksi
          </Text>
        </Box>
      </SimpleGrid>

      {/* ─── GLOBAL LOCK TOKEN BANNER ─── */}
      <Box
        bg="bg.surface"
        borderRadius="card"
        border="1px solid"
        borderColor="border.default"
        borderLeftWidth="4px"
        borderLeftColor={lockToken ? 'status.warning.text' : 'text.muted'}
        p={4}
        shadow="card-dark"
      >
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <Flex align="center" gap={3}>
            <Box
              w={10} h={10}
              borderRadius="lg"
              bg={lockToken ? 'status.warning.bg' : 'bg.subtle'}
              border="1px solid"
              borderColor={lockToken ? 'status.warning.text' : 'border.default'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" color={lockToken ? 'var(--chakra-colors-status-warning-text)' : 'var(--chakra-colors-text-muted)'}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="0.08em">
                TOKEN BUKA KUNCI {lockToken ? 'AKTIF' : '— TIDAK DIPERLUKAN'}
              </Text>
              <Text fontSize="2xl" fontWeight="black" fontFamily="mono" letterSpacing="0.15em" color={lockToken ? 'text.primary' : 'text.muted'}>
                {lockToken ?? '—'}
              </Text>
            </Box>
          </Flex>
          <Flex align="center" gap={4} wrap="wrap">
            {lockTokenExpiresAt && (
              <Box textAlign="right">
                <Text fontSize="xs" color="text.muted">Berlaku</Text>
                <Text fontSize="sm" fontWeight="bold" fontFamily="mono" color="text.primary">
                  {formatTokenCountdown(lockTokenExpiresAt)}
                </Text>
              </Box>
            )}
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              fontWeight="bold"
              onClick={handleRefreshToken}
              cursor="pointer"
            >
              <RefreshCw size={14} style={{ marginRight: 6 }} />
              Refresh Token
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* ─── BODY ─── */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
        {/* ─── Student Grid Panel ─── */}
        <Box
          gridColumn={{ lg: 'span 2' }}
          bg="bg.surface"
          borderRadius="card"
          border="1px solid"
          borderColor="border.default"
          shadow="card-dark"
          p={6}
          display="flex"
          flexDirection="column"
          gap={5}
        >
          {/* Panel header */}
          <Flex flexWrap="wrap" align="center" justify="space-between" gap={3} pb={4} borderBottom="1px solid" borderColor="border.default">
            <Heading size="md" fontWeight="bold" color="text.primary">Progres Siswa</Heading>
            <Flex align="center" gap={2} wrap="wrap">
              {/* Search */}
              <Box position="relative">
                <Box position="absolute" left="10px" top="50%" transform="translateY(-50%)" zIndex={2} color="text.muted" pointerEvents="none">
                  <Search size={14} />
                </Box>
                <Input
                  placeholder="Cari…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  w="140px"
                  pl="30px"
                  size="sm"
                  borderRadius="lg"
                  bg="bg.elevated"
                  borderColor="border.default"
                  _focus={{ borderColor: 'brand.solid', bg: 'bg.surface' }}
                />
              </Box>

              {/* Progress Filter */}
              <Box minW="150px">
                <Select.Root
                  collection={progressFilterOptions}
                  value={[progressFilter]}
                  onValueChange={(details) => {
                    if (details.value[0]) {
                      setProgressFilter(details.value[0]);
                    }
                  }}
                  positioning={{ sameWidth: true }}
                  size="sm"
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger borderRadius="lg" fontSize="sm" height="36px" bg="bg.elevated">
                      <Select.ValueText>
                        {progressFilterOptions.items.find(item => item.value === progressFilter)?.label || 'Semua Progres'}
                      </Select.ValueText>
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content zIndex={110}>
                      {progressFilterOptions.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>
            </Flex>
          </Flex>

          {/* Student Cards */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, '2xl': 3 }}
            gap={3}
            maxH="65vh"
            overflowY="auto"
            pr={2}
            css={{
              '&::-webkit-scrollbar': { width: '5px' },
              '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-gray-200)', borderRadius: '10px' },
            }}
          >
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
                  borderLeftWidth="3.5px"
                  transition="all 0.2s"
                  bg={finished ? 'status.success.bg' : locked ? 'status.danger.bg' : offline ? 'bg.subtle' : 'bg.elevated'}
                  borderColor={
                    finished ? 'status.success.text' :
                    locked ? 'status.danger.text' :
                    offline ? 'border.default' :
                    alerted ? 'status.warning.text' : 'border.default'
                  }
                  borderLeftColor={
                    finished ? 'var(--chakra-colors-status-success-text)' :
                    locked ? 'var(--chakra-colors-status-danger-text)' :
                    offline ? 'var(--chakra-colors-text-muted)' :
                    alerted ? 'var(--chakra-colors-status-warning-text)' : 'var(--chakra-colors-brand-solid)'
                  }
                  opacity={offline ? 0.72 : 1}
                  boxShadow="0 1px 4px rgba(15,23,42,0.05)"
                  _hover={
                    !offline
                      ? {
                          shadow: 'md',
                          transform: 'translateY(-1px)',
                          borderColor: finished
                            ? 'status.success.subtle'
                            : locked
                            ? 'status.danger.subtle'
                            : alerted
                            ? 'status.warning.subtle'
                            : 'brand.subtle',
                        }
                      : undefined
                  }
                >
                  {/* Top row */}
                  <Flex align="start" justify="space-between" mb={3}>
                    <Flex align="center" gap={2} minW={0} flex="1">
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        mt={0.5}
                        flexShrink={0}
                        bg={
                          finished ? 'status.success.text' :
                          locked ? 'status.danger.text' :
                          offline ? 'text.muted' :
                          alerted ? 'status.warning.text' : 'status.success.text'
                        }
                        className={!offline && !finished && !locked ? 'animate-pulse' : ''}
                      />
                      <Box minW={0} flex="1">
                        <Text fontWeight="semibold" fontSize="sm" color="text.primary" lineClamp={1}>
                          {s.fullName || s.username}
                        </Text>
                        <Text fontSize="11px" color="text.muted">
                          {new Date(s.lastActive).toLocaleTimeString('id-ID', { timeZone: settings?.timezone || 'Asia/Jakarta' })}
                        </Text>
                      </Box>
                    </Flex>
                    <Flex align="center" gap={1} flexShrink={0}>
                      {alerted && (
                        <Badge bg="status.warning.bg" color="status.warning.text" borderRadius="full" px={1.5} py={0.5} fontSize="10px">
                          {s.violationCount}⚠
                        </Badge>
                      )}
                      <Badge
                        bg={finished ? 'status.success.bg' : locked ? 'status.danger.bg' : offline ? 'bg.subtle' : 'brand.subtle'}
                        color={finished ? 'status.success.text' : locked ? 'status.danger.text' : offline ? 'text.muted' : 'brand.text'}
                        borderRadius="full"
                        px={1.5}
                        py={0.5}
                        fontSize="10px"
                        textTransform="uppercase"
                      >
                        {finished ? 'SELESAI' : locked ? 'TERKUNCI' : offline ? 'OFFLINE' : 'LIVE'}
                      </Badge>
                    </Flex>
                  </Flex>

                  {/* Progress bar */}
                  <Box mb={3}>
                    <Flex justify="space-between" fontSize="xs" mb={1.5}>
                      <Text color="text.muted" fontWeight="medium">Progres</Text>
                      <Text fontWeight="bold" color={done ? 'status.success.text' : 'text.primary'}>{Math.round(s.progress)}%</Text>
                    </Flex>
                    <Box h="6px" borderRadius="full" bg="bg.subtle" overflow="hidden">
                      <Box
                        h="full"
                        borderRadius="full"
                        bg={
                          done
                            ? 'linear-gradient(90deg, var(--chakra-colors-status-success-text), #059669)'
                            : s.progress >= 50
                            ? 'linear-gradient(90deg, var(--chakra-colors-status-warning-text), #d97706)'
                            : 'linear-gradient(90deg, var(--chakra-colors-brand-solid), #4f46e5)'
                        }
                        transition="width 0.5s ease"
                        style={{ width: `${s.progress}%` }}
                      />
                    </Box>
                  </Box>

                  {/* Meta info row */}
                  <Flex justify="space-between" align="center" fontSize="11px" mb={finished ? 0 : 3}>
                    <Text color="text.muted">
                      {finished ? 'Ujian dikumpulkan' : `Soal #${s.currentQuestionIndex || 1}`}
                    </Text>
                    <Text
                      fontFamily="mono"
                      fontWeight="bold"
                      color={finished ? 'status.success.text' : isEndingSoon(s.endTime) ? 'status.danger.text' : 'text.secondary'}
                    >
                      {finished ? '✓' : formatRemainingTime(s.endTime)}
                    </Text>
                  </Flex>

                  {/* Action Control Panel */}
                  {!finished && (
                    <Flex gap={1.5} pt={3} borderTop="1px solid" borderColor="border.default">
                      {locked ? (
                        <Button
                          size="xs"
                          bg="status.success.bg" color="status.success.text"
                          borderRadius="lg"
                          flex={1}
                          onClick={() => unlockStudent(s.userId)}
                          fontWeight="bold"
                          cursor="pointer"
                        >
                          Buka
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          bg="status.danger.bg" color="status.danger.text"
                          borderRadius="lg"
                          flex={1}
                          onClick={() => lockStudent(s.userId)}
                          fontWeight="bold"
                          cursor="pointer"
                        >
                          Kunci
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="subtle"
                        bg="bg.subtle"
                        color="text.primary"
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
                        colorPalette="amber"
                        borderRadius="lg"
                        fontWeight="bold"
                        cursor="pointer"
                        onClick={() => {
                          if (socket) {
                            socket.emit('add_student_time', { examId: id, studentId: s.userId, minutes: 5 });
                          }
                        }}
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
                <Box mb={4} color="text.muted">
                  <Monitor size={42} />
                </Box>
                <Text color="text.secondary" fontWeight="medium" fontSize="sm">
                  {query ? 'Siswa tidak ditemukan' : 'Menunggu siswa masuk…'}
                </Text>
              </Flex>
            )}
          </SimpleGrid>
        </Box>

        {/* ─── Violation Logs Panel ─── */}
        <Box
          bg="bg.surface"
          borderRadius="card"
          border="1px solid"
          borderColor="border.default"
          shadow="card-dark"
          p={6}
          display="flex"
          flexDirection="column"
          gap={5}
        >
          {/* Panel header */}
          <Flex direction="column" gap={3} pb={3} borderBottom="1px solid" borderColor="border.default">
            <Flex align="center" justify="space-between">
              <Heading size="md" fontWeight="bold" color="status.danger.text" display="flex" alignItems="center" gap={2}>
                <AlertTriangle size={18} color="var(--chakra-colors-status-danger-text)" />
                Pelanggaran
              </Heading>
              {violations.length > 0 && (
                <Button
                  size="xs"
                  variant="ghost"
                  color="status.danger.text"
                  _hover={{ bg: 'status.danger.bg', color: 'status.danger.text' }}
                  onClick={() => setViolations([])}
                  borderRadius="lg"
                  fontWeight="semibold"
                  cursor="pointer"
                >
                  Bersihkan
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
                  <Select.Trigger borderRadius="lg" bg="input.bg" borderColor="input.border">
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

          {/* Violation entries */}
          <Stack
            id="violation-logs"
            gap={2}
            h="65vh"
            overflowY="auto"
            pr={1}
            css={{
              '&::-webkit-scrollbar': { width: '5px' },
              '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-status-danger-text)', borderRadius: '10px' },
            }}
          >
            {violations
              .filter((v) => {
                if (violationFilter === 'ALL') return true;
                if (violationFilter === 'TAB_SWITCH') return v.type.toLowerCase().includes('tab') || v.type.toLowerCase().includes('blur');
                if (violationFilter === 'FULLSCREEN_EXIT') return v.type.toLowerCase().includes('fullscreen') || v.type.toLowerCase().includes('screen');
                if (violationFilter === 'DEVTOOLS') return v.type.toLowerCase().includes('devtools') || v.type.toLowerCase().includes('inspect');
                return true;
              })
              .map((v) => {
                const meta = getViolationMeta(v.type);
                return (
                  <Box
                    key={v.id}
                    p={3}
                    borderRadius="xl"
                    border="1px solid"
                    borderLeftWidth="3px"
                    borderColor="border.default"
                    borderLeftColor={meta.palette === 'red' ? 'status.danger.text' : meta.palette === 'amber' || meta.palette === 'orange' ? 'status.warning.text' : 'brand.solid'}
                    bg="bg.elevated"
                    className="animate-fade-up"
                  >
                    <Flex justify="space-between" align="start" mb={1.5}>
                      <Text fontWeight="semibold" fontSize="sm" color="text.primary">{v.username}</Text>
                      <Text fontSize="10px" color="text.muted" whiteSpace="nowrap" ml={2}>
                        {new Date(v.timestamp).toLocaleTimeString('id-ID', {
                          timeZone: settings?.timezone || 'Asia/Jakarta',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </Text>
                    </Flex>
                    <Badge
                      bg={meta.palette === 'red' ? 'status.danger.bg' : meta.palette === 'amber' || meta.palette === 'orange' ? 'status.warning.bg' : 'brand.subtle'}
                      color={meta.palette === 'red' ? 'status.danger.text' : meta.palette === 'amber' || meta.palette === 'orange' ? 'status.warning.text' : 'brand.text'}
                      size="sm"
                      borderRadius="md"
                      mb={v.description ? 1.5 : 0}
                      textTransform="uppercase"
                      fontSize="10px"
                      letterSpacing="0.06em"
                    >
                      {meta.label}
                    </Badge>
                    {v.description && (
                      <Text fontSize="xs" color="text.secondary">{v.description}</Text>
                    )}
                  </Box>
                );
              })}

            {violations.length === 0 && (
              <Flex h="full" direction="column" align="center" justify="center" textAlign="center" py={12} px={4}>
                <Flex
                  w={14}
                  h={14}
                  bg="status.success.bg"
                  border="1px solid"
                  borderColor="status.success.text"
                  borderRadius="2xl"
                  align="center"
                  justify="center"
                  mb={4}
                >
                  <CheckCircle2 size={28} color="var(--chakra-colors-status-success-text)" />
                </Flex>
                <Text fontWeight="semibold" color="text.primary" mb={1}>Semua bersih</Text>
                <Text fontSize="xs" color="text.muted" maxW="160px">
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