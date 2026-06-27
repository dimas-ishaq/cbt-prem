'use client';

import { use, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Badge,
  Box,
  Button,
  createListCollection,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ExamInfo {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  passingGrade: number;
  status?: string;
  duration?: number;
  description?: string;
}
interface LedgerStudent {
  studentId: string;
  userId: string;
  fullName: string;
  username: string;
  rombel: { id: string; name: string } | null;
  major: { id: string; name: string } | null;
  scores: Record<string, number | null>;
  statuses: Record<string, string | null>;
  average: number | null;
}
interface UnsubmittedStudent {
  studentId: string;
  fullName: string;
  username: string;
  rombel: { id: string; name: string } | null;
  major: { id: string; name: string } | null;
  missingExams: { examId: string; title: string; subject: string; status: string | null }[];
}
interface ExamStat {
  examId: string;
  title: string;
  subject: string;
  participantCount: number;
  totalEnrolled: number;
  averageScore: number | null;
  passedCount: number;
  passRate: number;
}
interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
}
interface LedgerData {
  group: GroupInfo;
  exams: ExamInfo[];
  ledger: LedgerStudent[];
  unsubmitted: UnsubmittedStudent[];
  examStats: ExamStat[];
  totalStudents: number;
}
interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  exams: ExamInfo[];
}

interface SubjectSummary {
  subject: string;
  examCount: number;
  participantCount: number;
  totalEnrolled: number;
  averageScore: number | null;
  passedCount: number;
  totalSubmitted: number;
  passRate: number;
}

const sessionStatusMap: Record<string, { label: string; color: string }> = {
  NOT_STARTED: { label: 'Belum Mulai', color: 'gray' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', color: 'amber' },
  LOCKED: { label: 'Terkunci', color: 'red' },
  SUBMITTED: { label: 'Selesai', color: 'green' },
  FINISHED: { label: 'Selesai', color: 'green' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ScoreCell({ score, status, passingGrade }: { score: number | null | undefined; status: string | null | undefined; passingGrade: number }) {
  if (score == null) {
    const st = sessionStatusMap[status ?? 'NOT_STARTED'];
    return <Badge colorPalette={st?.color ?? 'gray'} fontSize="10px" borderRadius="md" textTransform="none">{st?.label ?? 'Belum'}</Badge>;
  }
  return <Text fontWeight="bold" fontSize="sm" color={score >= passingGrade ? 'green.600' : 'red.600'}>{score.toFixed(1)}</Text>;
}

export default function ExamGroupReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSubject = searchParams.get('subject') ?? '';
  const { data: ledgerData, isLoading: ledgerLoading } = useQuery<LedgerData>({
    queryKey: ['exam-group-ledger', id],
    queryFn: async () => (await api.get(`/exam-groups/${id}/report-ledger`)).data,
  });
  const { data: group, isLoading: groupLoading } = useQuery<ExamGroup>({
    queryKey: ['exam-group-report', id],
    queryFn: async () => (await api.get(`/exam-groups/${id}`)).data,
  });

  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerRombel, setLedgerRombel] = useState('');
  const [unsubSearch, setUnsubSearch] = useState('');

  const isLoading = ledgerLoading || groupLoading;

  const rombels = useMemo(() => {
    if (!ledgerData) return [];
    const map = new Map<string, string>();
    ledgerData.ledger.forEach((s) => {
      if (s.rombel) map.set(s.rombel.id, s.rombel.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [ledgerData]);

  const subjectOptions = useMemo(() => {
    if (!group?.exams) return [];
    const map = new Map<string, string>();
    group.exams.forEach((exam) => {
      const subject = exam.subject as unknown as { name?: string } | string | null | undefined;
      const subjectValue = typeof subject === 'object' && subject
        ? subject.name ?? '-'
        : String(subject ?? '-');
      if (!map.has(subjectValue)) map.set(subjectValue, subjectValue);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [group]);

  const subjectSummaries = useMemo<SubjectSummary[]>(() => {
    if (!ledgerData?.examStats.length) return [];

    const summaryMap = new Map<string, SubjectSummary>();

    ledgerData.examStats.forEach((stat) => {
      const current = summaryMap.get(stat.subject) ?? {
        subject: stat.subject,
        examCount: 0,
        participantCount: 0,
        totalEnrolled: stat.totalEnrolled,
        averageScore: null,
        passedCount: 0,
        totalSubmitted: 0,
        passRate: 0,
      };

      current.examCount += 1;
      current.participantCount = Math.max(current.participantCount, stat.participantCount);
      current.totalEnrolled = Math.max(current.totalEnrolled, stat.totalEnrolled);
      current.passedCount += stat.passedCount;
      current.totalSubmitted += stat.participantCount;

      if (stat.averageScore != null) {
        current.averageScore = current.averageScore == null
          ? stat.averageScore
          : current.averageScore + stat.averageScore;
      }

      summaryMap.set(stat.subject, current);
    });

    return Array.from(summaryMap.values())
      .map((summary) => ({
        ...summary,
        averageScore: summary.averageScore == null ? null : summary.averageScore / summary.examCount,
        passRate: summary.totalSubmitted > 0 ? (summary.passedCount / summary.totalSubmitted) * 100 : 0,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }, [ledgerData]);

  const effectiveSelectedSubject = selectedSubject;

  const selectedExams = useMemo(() => {
    if (!ledgerData?.exams.length || !effectiveSelectedSubject) return [];
    return ledgerData.exams.filter((exam) => exam.subject === effectiveSelectedSubject);
  }, [ledgerData, effectiveSelectedSubject]);

  const selectedExamIds = useMemo(() => new Set(selectedExams.map((exam) => exam.id)), [selectedExams]);

  const selectedExamStats = useMemo(() => {
    if (!ledgerData?.examStats.length || !effectiveSelectedSubject) return [];
    return ledgerData.examStats.filter((stat) => stat.subject === effectiveSelectedSubject);
  }, [ledgerData, effectiveSelectedSubject]);

  const selectedSubjectSummary = useMemo(
    () => subjectSummaries.find((summary) => summary.subject === effectiveSelectedSubject) ?? null,
    [subjectSummaries, effectiveSelectedSubject],
  );

  const filteredLedger = useMemo(() => {
    if (!ledgerData || selectedExams.length === 0) return [];
    return ledgerData.ledger
      .filter((s) => {
        const name = (s.fullName + s.username).toLowerCase();
        if (ledgerSearch && !name.includes(ledgerSearch.toLowerCase())) return false;
        if (ledgerRombel && s.rombel?.id !== ledgerRombel) return false;
        return true;
      })
      .map((student) => {
        const subjectScores = selectedExams
          .map((exam) => student.scores[exam.id])
          .filter((score): score is number => score != null);

        const subjectAverage = subjectScores.length > 0
          ? subjectScores.reduce((total, score) => total + score, 0) / subjectScores.length
          : null;

        return {
          ...student,
          subjectAverage,
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [ledgerData, ledgerSearch, ledgerRombel, selectedExams]);

  const filteredUnsubmitted = useMemo(() => {
    if (!ledgerData || selectedExams.length === 0) return [];
    return ledgerData.unsubmitted
      .map((student) => ({
        ...student,
        missingExams: student.missingExams.filter((m) => selectedExamIds.has(m.examId)),
      }))
      .filter((s) => s.missingExams.length > 0)
      .filter((s) => {
        const name = (s.fullName + s.username).toLowerCase();
        if (unsubSearch && !name.includes(unsubSearch.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [ledgerData, unsubSearch, selectedExamIds, selectedExams.length]);

  const totalParticipation = useMemo(() => {
    if (!ledgerData || selectedExams.length === 0) return 0;
    return ledgerData.ledger.filter((s) => selectedExams.some((e) => s.statuses[e.id] === 'SUBMITTED')).length;
  }, [ledgerData, selectedExams]);

  const hasFilters = ledgerSearch || ledgerRombel || unsubSearch;
  const clearFilters = () => {
    setLedgerSearch('');
    setLedgerRombel('');
    setUnsubSearch('');
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="50vh" gap={3}>
        <Spinner size="lg" color="indigo.600" />
        <Text color="gray.500">Memuat data laporan...</Text>
      </Flex>
    );
  }

  const groupInfo = ledgerData?.group ?? group;

  return (
    <Stack gap={6}>
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="3xl"
        bg="linear-gradient(135deg, #0f172a 0%, #312e81 48%, #1d4ed8 100%)"
        color="white"
        px={{ base: 6, md: 8 }}
        py={{ base: 6, md: 7 }}
        boxShadow="0 30px 80px rgba(49, 46, 129, 0.28)"
      >
        <Box position="absolute" inset="0" bg="radial-gradient(circle at top right, rgba(255,255,255,0.22), transparent 28%), radial-gradient(circle at bottom left, rgba(56,189,248,0.22), transparent 24%)" />
        <Flex position="relative" align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
          <Box maxW="3xl">
            <HStack gap={2} mb={3} flexWrap="wrap">
              <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1} fontSize="10px" letterSpacing="0.12em" textTransform="uppercase">
                Event Report
              </Badge>
              {groupInfo?.academicYear && (
                <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1} fontSize="10px">
                  {groupInfo.academicYear}
                </Badge>
              )}
              {groupInfo?.semester && (
                <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3} py={1} fontSize="10px">
                  Semester {groupInfo.semester}
                </Badge>
              )}
            </HStack>
            <Heading size="xl" fontWeight="black" letterSpacing="tight">{groupInfo?.name}</Heading>
            <Text mt={3} color="whiteAlpha.800" maxW="2xl" fontSize="sm">
              {groupInfo?.description || 'Pantau performa mapel, partisipasi siswa, dan statistik kelulusan dalam satu tampilan laporan yang terstruktur.'}
            </Text>
            <HStack mt={4} gap={3} flexWrap="wrap">
              {groupInfo?.startDate && (
                <Box bg="whiteAlpha.140" border="1px solid rgba(255,255,255,0.16)" borderRadius="full" px={4} py={2} backdropFilter="blur(12px)">
                  <Text fontSize="xs" color="whiteAlpha.800">Periode</Text>
                  <Text fontSize="sm" fontWeight="semibold">{formatDate(groupInfo.startDate)}{groupInfo.endDate ? ` - ${formatDate(groupInfo.endDate)}` : ''}</Text>
                </Box>
              )}
              <Box bg="whiteAlpha.140" border="1px solid rgba(255,255,255,0.16)" borderRadius="full" px={4} py={2} backdropFilter="blur(12px)">
                <Text fontSize="xs" color="whiteAlpha.800">Mapel Aktif</Text>
                <Text fontSize="sm" fontWeight="semibold">{effectiveSelectedSubject || `${subjectSummaries.length} mapel tersedia`}</Text>
              </Box>
            </HStack>
          </Box>
          <Stack gap={3} align={{ base: 'stretch', md: 'flex-end' }}>
            <Button bg="white" color="gray.900" size="sm" borderRadius="full" px={5} _hover={{ bg: 'whiteAlpha.900' }} onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/exam-groups/${id}/export-ledger`, '_blank')}>
              <Download size={14} />Ekspor Ledger Excel
            </Button>
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm" color="white" borderRadius="full" _hover={{ bg: 'whiteAlpha.200' }}>
                <ArrowLeft size={15} />
                Kembali ke Laporan
              </Button>
            </Link>
          </Stack>
        </Flex>
      </Box>

      <Box
        bg="rgba(255,255,255,0.78)"
        borderRadius="3xl"
        border="1px solid"
        borderColor="whiteAlpha.700"
        p={{ base: 5, md: 6 }}
        backdropFilter="blur(18px)"
        boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"
      >
        <Stack gap={5}>
          <Flex gap={3} flexWrap="wrap" align="center" justify="space-between">
            <Box maxW="2xl">
              <Text fontSize="xs" fontWeight="bold" color="indigo.500" textTransform="uppercase" letterSpacing="0.14em">
                Report Navigator
              </Text>
              <Heading size="md" fontWeight="black" color="gray.900" mt={1}>
                {effectiveSelectedSubject ? `Laporan Mapel: ${effectiveSelectedSubject}` : 'Daftar mapel yang diujikan di event ini'}
              </Heading>
              <Text fontSize="sm" color="gray.600" mt={2}>
                {effectiveSelectedSubject
                  ? 'Fokus pada satu mapel dengan visual ringkas, statistik, dan daftar siswa yang lebih rapi.'
                  : 'Pilih mapel untuk membuka laporan detail dengan statistik nilai, status pengerjaan, dan performa ujian.'}
              </Text>
            </Box>
            {effectiveSelectedSubject ? (
              <Button
                bg="gray.900"
                color="white"
                size="sm"
                borderRadius="full"
                px={5}
                _hover={{ bg: 'gray.800' }}
                onClick={() => router.push(`/admin/reports/exam-groups/${id}`)}
              >
                <ArrowLeft size={14} />
                Kembali ke Daftar Mapel
              </Button>
            ) : null}
          </Flex>

          {!effectiveSelectedSubject ? (
            <Box overflowX="auto" borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="linear-gradient(90deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.08) 100%)">
                    <Table.ColumnHeader py={4}>#</Table.ColumnHeader>
                    <Table.ColumnHeader py={4}>Mapel</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Jumlah Ujian</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Peserta</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Rata-rata</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Pass Rate</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="right">Aksi</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {subjectSummaries.map((summary, idx) => (
                    <Table.Row key={summary.subject} _hover={{ bg: 'gray.50' }}>
                      <Table.Cell color="gray.400" fontSize="xs">{idx + 1}</Table.Cell>
                      <Table.Cell>
                        <Flex align="center" gap={3}>
                          <Flex boxSize={10} align="center" justify="center" borderRadius="2xl" bg="linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.16))" color="indigo.600">
                            <BookOpen size={16} />
                          </Flex>
                          <Box>
                            <Text fontWeight="semibold" fontSize="sm" color="gray.900">{summary.subject}</Text>
                            <Text fontSize="11px" color="gray.500">{summary.totalSubmitted} submission dari {summary.totalEnrolled} peserta</Text>
                          </Box>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge colorPalette="indigo" borderRadius="full" px={3}>{summary.examCount}</Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Text fontSize="sm" fontWeight="medium">{summary.participantCount} / {summary.totalEnrolled}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Text fontSize="sm" fontWeight="bold" color={summary.averageScore != null && summary.averageScore >= 70 ? 'green.600' : 'gray.600'}>
                          {summary.averageScore != null ? summary.averageScore.toFixed(1) : '-'}
                        </Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge colorPalette={summary.passRate >= 70 ? 'green' : summary.passRate >= 50 ? 'amber' : 'red'} borderRadius="full" fontSize="xs" px={3}>
                          {summary.passRate.toFixed(1)}%
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Button
                          size="xs"
                          bg="gray.900"
                          color="white"
                          borderRadius="full"
                          px={4}
                          _hover={{ bg: 'gray.800' }}
                          onClick={() => router.push(`/admin/reports/exam-groups/${id}?subject=${encodeURIComponent(summary.subject)}`)}
                        >
                          Lihat Laporan
                          <ChevronRight size={12} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : null}
        </Stack>
      </Box>

      {effectiveSelectedSubject ? (
        <Stack gap={6}>
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
            <MetricCard label="Total Peserta" value={ledgerData?.totalStudents ?? 0} sub="siswa terdaftar" icon={Users} color="indigo" />
            <MetricCard label="Partisipasi" value={`${totalParticipation} / ${ledgerData?.totalStudents ?? 0}`} sub={`mengerjakan mapel ${effectiveSelectedSubject}`} icon={CheckCircle2} color="green" />
            <MetricCard label="Rata-rata Nilai" value={selectedSubjectSummary?.averageScore != null ? selectedSubjectSummary.averageScore.toFixed(1) : '-'} sub="rata-rata mapel terpilih" icon={TrendingUp} color="amber" />
            <MetricCard label="Pass Rate" value={selectedSubjectSummary ? `${selectedSubjectSummary.passRate.toFixed(1)}%` : '-'} sub="kelulusan mapel terpilih" icon={BarChart3} color="blue" />
          </SimpleGrid>

          <Box
            bg="linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(238,242,255,0.96) 100%)"
            borderRadius="3xl"
            border="1px solid"
            borderColor="whiteAlpha.700"
            p={{ base: 5, md: 6 }}
            boxShadow="0 20px 50px rgba(15, 23, 42, 0.08)"
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <Text fontSize="xs" color="indigo.500" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em">Subject Overview</Text>
                <Heading size="lg" mt={1} color="gray.900">{effectiveSelectedSubject}</Heading>
                <Text color="gray.600" fontSize="sm" mt={2}>Ringkasan cepat untuk melihat intensitas ujian dan status pengerjaan siswa pada mapel ini.</Text>
              </Box>
              <HStack gap={3} flexWrap="wrap">
                <Box bg="whiteAlpha.800" border="1px solid rgba(99,102,241,0.12)" borderRadius="2xl" px={4} py={3} minW="150px">
                  <Text fontSize="xs" color="gray.500">Total Ujian</Text>
                  <Text fontSize="2xl" fontWeight="black" color="gray.900">{selectedExams.length}</Text>
                </Box>
                <Box bg="whiteAlpha.800" border="1px solid rgba(99,102,241,0.12)" borderRadius="2xl" px={4} py={3} minW="150px">
                  <Text fontSize="xs" color="gray.500">Belum Selesai</Text>
                  <Text fontSize="2xl" fontWeight="black" color="gray.900">{filteredUnsubmitted.length}</Text>
                </Box>
              </HStack>
            </Flex>
          </Box>

          <Box bg="rgba(255,255,255,0.86)" p={{ base: 5, md: 6 }} borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" backdropFilter="blur(18px)" boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
            <Flex align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={5}>
              <Flex align="center" gap={2}>
                <Flex boxSize={10} align="center" justify="center" borderRadius="2xl" bg="linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.14))" color="indigo.600">
                  <Filter size={15} />
                </Flex>
                <Box>
                  <Text fontWeight="bold" color="gray.800" fontSize="sm">Filter &amp; Pencarian</Text>
                  <Text fontSize="xs" color="gray.500">Saring data siswa untuk analisis lebih cepat.</Text>
                </Box>
              </Flex>
              {hasFilters && (
                <Button size="xs" variant="ghost" colorPalette="red" onClick={clearFilters} ml={{ md: 'auto' }}>
                  <X size={12} /> Hapus Filter
                </Button>
              )}
            </Flex>
            <Flex gap={3} flexWrap="wrap">
              <Flex align="center" bg="white" borderRadius="full" px={4} gap={2} flex="1" minW="240px" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
                <Search size={14} color="var(--chakra-colors-gray-400)" />
                <Input placeholder="Cari nama siswa..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} border="none" bg="transparent" size="sm" />
              </Flex>
              {rombels.length > 0 && (
                <Box minW="220px">
                  <Select.Root
                    collection={createListCollection({
                      items: [
                        { label: 'Semua Kelas', value: '' },
                        ...rombels.map((r) => ({ label: r.name, value: r.id })),
                      ],
                    })}
                    value={[ledgerRombel]}
                    onValueChange={(details) => setLedgerRombel(details.value[0] || '')}
                    positioning={{ sameWidth: true }}
                    size="sm"
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger bg="white" borderRadius="full" borderColor="gray.200" boxShadow="sm">
                        <Select.ValueText placeholder="Semua Kelas" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.ClearTrigger />
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        <Select.Item item={{ label: 'Semua Kelas', value: '' }}>
                          Semua Kelas
                        </Select.Item>
                        {rombels.map((r) => (
                          <Select.Item key={r.id} item={{ label: r.name, value: r.id }}>
                            {r.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Box>
              )}
            </Flex>
            <Box overflowX="auto" mt={5} borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="linear-gradient(90deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.08) 100%)">
                    <Table.ColumnHeader py={4}>#</Table.ColumnHeader>
                    <Table.ColumnHeader py={4}>Nama Siswa</Table.ColumnHeader>
                    <Table.ColumnHeader py={4}>Kelas</Table.ColumnHeader>
                    {selectedExams.map((exam) => (
                      <Table.ColumnHeader key={exam.id} textAlign="center" py={4}>
                        {exam.subject}
                        <br />
                        <Link href={`/admin/results/${exam.id}`}>
                          <Text fontSize="10px" color="indigo.600" fontWeight="semibold" textDecoration="underline" textUnderlineOffset="2px">
                            {exam.title}
                          </Text>
                        </Link>
                      </Table.ColumnHeader>
                    ))}
                    <Table.ColumnHeader textAlign="center" py={4}>Rata-rata Mapel</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredLedger.map((student, idx) => (
                    <Table.Row key={student.studentId} _hover={{ bg: 'gray.50' }}>
                      <Table.Cell color="gray.400" fontSize="xs">{idx + 1}</Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="semibold" fontSize="sm">{student.fullName}</Text>
                        <Text fontSize="11px" color="gray.400">{student.username}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm" color="gray.600">{student.rombel?.name ?? '-'}</Text>
                      </Table.Cell>
                      {selectedExams.map((exam) => (
                        <Table.Cell key={exam.id} textAlign="center" bg={(student.scores[exam.id] ?? null) === null ? 'rgba(254, 242, 242, 0.9)' : undefined}>
                          <ScoreCell score={student.scores[exam.id]} status={student.statuses[exam.id]} passingGrade={exam.passingGrade} />
                        </Table.Cell>
                      ))}
                      <Table.Cell textAlign="center">
                        {student.subjectAverage !== null ? (
                          <Text fontWeight="bold" fontSize="sm" color="indigo.600">{student.subjectAverage.toFixed(1)}</Text>
                        ) : (
                          <Text fontSize="xs" color="gray.400">-</Text>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>

          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
            <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
              <Heading size="sm" fontWeight="bold" color="gray.900" mb={4}>Siswa Belum Menyelesaikan Ujian</Heading>
              <Flex align="center" bg="white" borderRadius="full" px={4} gap={2} mb={4} borderWidth="1px" borderColor="gray.200" maxW="360px" boxShadow="sm">
                <Search size={14} color="var(--chakra-colors-gray-400)" />
                <Input placeholder="Cari nama siswa..." value={unsubSearch} onChange={(e) => setUnsubSearch(e.target.value)} border="none" bg="transparent" size="sm" />
              </Flex>
              <Box overflowX="auto" borderRadius="2xl" border="1px solid" borderColor="gray.100">
                <Table.Root variant="outline" size="sm">
                  <Table.Header>
                    <Table.Row bg="gray.50">
                      <Table.ColumnHeader>#</Table.ColumnHeader>
                      <Table.ColumnHeader>Nama Siswa</Table.ColumnHeader>
                      <Table.ColumnHeader>Kelas</Table.ColumnHeader>
                      <Table.ColumnHeader>Jurusan</Table.ColumnHeader>
                      <Table.ColumnHeader>Ujian Belum Diselesaikan</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredUnsubmitted.map((student, idx) => (
                      <Table.Row key={student.studentId} _hover={{ bg: 'gray.50' }}>
                        <Table.Cell color="gray.400" fontSize="xs">{idx + 1}</Table.Cell>
                        <Table.Cell>
                          <Text fontWeight="semibold" fontSize="sm">{student.fullName}</Text>
                          <Text fontSize="11px" color="gray.400">{student.username}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">{student.rombel?.name ?? '-'}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">{student.major?.name ?? '-'}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Stack gap={1.5}>
                            {student.missingExams.map((me) => {
                              const st = sessionStatusMap[me.status ?? 'NOT_STARTED'];
                              return (
                                <Flex key={me.examId} align="center" gap={2} wrap="wrap">
                                  <Badge colorPalette={st?.color ?? 'gray'} fontSize="10px" borderRadius="full" textTransform="none" px={2.5}>
                                    {st?.label ?? me.status}
                                  </Badge>
                                  <Text fontSize="xs" color="gray.700"><strong>{me.subject}</strong> - {me.title}</Text>
                                </Flex>
                              );
                            })}
                          </Stack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>

            <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
              <Heading size="sm" fontWeight="bold" color="gray.900" mb={4}>Perbandingan Rata-rata Nilai per Ujian</Heading>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={selectedExamStats} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                  <XAxis dataKey="title" tick={{ fontSize: 12, fill: '#6b7280' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : '-', 'Rata-rata']} contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)' }} />
                  <Bar dataKey="averageScore" radius={[10, 10, 0, 0]}>
                    {selectedExamStats.map((entry, index) => (
                      <Cell key={index} fill={entry.averageScore == null ? '#d1d5db' : entry.averageScore >= 75 ? '#10b981' : entry.averageScore >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SimpleGrid>

          <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
            <Heading size="sm" fontWeight="bold" color="gray.900" mb={4}>Statistik per Ujian</Heading>
            <Box overflowX="auto" borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="linear-gradient(90deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.08) 100%)">
                    <Table.ColumnHeader py={4}>Mata Pelajaran</Table.ColumnHeader>
                    <Table.ColumnHeader py={4}>Nama Ujian</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Peserta</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Rata-rata</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Lulus</Table.ColumnHeader>
                    <Table.ColumnHeader py={4} textAlign="center">Pass Rate</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {selectedExamStats.map((stat) => (
                    <Table.Row key={stat.examId} _hover={{ bg: 'gray.50' }}>
                      <Table.Cell>
                        <Flex align="center" gap={2}>
                          <Flex boxSize={8} align="center" justify="center" borderRadius="xl" bg="linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.16))" color="indigo.600">
                            <BookOpen size={13} />
                          </Flex>
                          <Text fontSize="sm" fontWeight="medium">{stat.subject}</Text>
                        </Flex>
                      </Table.Cell>
                      <Table.Cell><Text fontSize="sm" color="gray.700">{stat.title}</Text></Table.Cell>
                      <Table.Cell textAlign="center"><Text fontSize="sm">{stat.participantCount} / {stat.totalEnrolled}</Text></Table.Cell>
                      <Table.Cell textAlign="center"><Text fontSize="sm" fontWeight="bold" color={stat.averageScore == null ? 'gray.400' : stat.averageScore >= 70 ? 'green.600' : 'red.600'}>{stat.averageScore != null ? stat.averageScore.toFixed(1) : '-'}</Text></Table.Cell>
                      <Table.Cell textAlign="center"><Text fontSize="sm">{stat.passedCount}</Text></Table.Cell>
                      <Table.Cell textAlign="center"><Badge colorPalette={stat.passRate >= 70 ? 'green' : stat.passRate >= 50 ? 'amber' : 'red'} borderRadius="full" fontSize="xs" px={3}>{stat.passRate.toFixed(1)}%</Badge></Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        </Stack>
      ) : subjectSummaries.length === 0 ? (
        <Box bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={8} textAlign="center">
          <Text fontWeight="semibold" color="gray.700">Belum ada mapel di event ini.</Text>
        </Box>
      ) : null}
    </Stack>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.98) 100%)"
      borderRadius="3xl"
      border="1px solid"
      borderColor={`${color}.100`}
      p={5}
      boxShadow="0 20px 45px rgba(15, 23, 42, 0.08)"
    >
      <Box position="absolute" top="-30px" right="-30px" boxSize="88px" borderRadius="full" bg={`${color}.100`} opacity={0.5} />
      <Flex position="relative" justify="space-between" align="flex-start" gap={3}>
        <Box>
          <Text fontSize="11px" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="0.12em">{label}</Text>
          <Text mt={3} fontSize="3xl" fontWeight="black" color="gray.900" lineHeight="1">{value}</Text>
          {sub && <Text fontSize="xs" color="gray.500" mt={2.5} maxW="20ch">{sub}</Text>}
        </Box>
        <Flex boxSize={11} align="center" justify="center" borderRadius="2xl" bg={`${color}.50`} color={`${color}.500`} boxShadow="inset 0 0 0 1px rgba(255,255,255,0.6)">
          <Icon size={18} />
        </Flex>
      </Flex>
    </Box>
  );
}
