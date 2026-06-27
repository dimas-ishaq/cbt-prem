import Link from 'next/link';
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
  Stack,
  Table,
  Text,
} from '@chakra-ui/react';
import {
  AlertTriangle,
  ArrowLeft,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AttentionInsight,
  ExamInfo,
  ExamStat,
  GroupInfo,
  OverviewMetrics,
  RombelSummary,
  sessionStatusMap,
  StatusAggregate,
  StudentLedgerRow,
  SubjectSummary,
  UnsubmittedStudent,
  formatDate,
  getScoreTone,
} from './report-utils';

export function ScoreCell({ score, status, passingGrade }: { score: number | null | undefined; status: string | null | undefined; passingGrade: number }) {
  if (score == null) {
    const st = sessionStatusMap[status ?? 'NOT_STARTED'];
    return <Badge colorPalette={st?.color ?? 'gray'} fontSize="10px" borderRadius="md" textTransform="none">{st?.label ?? 'Belum'}</Badge>;
  }

  const tone = getScoreTone(score, passingGrade);
  return (
    <Box bg={tone.bg} color={tone.color} borderRadius="lg" px={2.5} py={1.5} display="inline-flex" justifyContent="center" minW="58px">
      <Text fontWeight="bold" fontSize="sm">{score.toFixed(1)}</Text>
    </Box>
  );
}

export function MetricCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="linear-gradient(180deg, rgba(36,36,36,0.96) 0%, rgba(45,45,45,0.98) 100%)"
      borderRadius="3xl"
      border="1px solid"
      borderColor="border.subtle"
      p={5}
      boxShadow="0 18px 40px rgba(0,0,0,0.35)"
    >
      <Box position="absolute" top="-30px" right="-30px" boxSize="88px" borderRadius="full" bg="rgba(156,85,232,0.12)" />
      <Flex position="relative" justify="space-between" align="flex-start" gap={3}>
        <Box>
          <Text fontSize="11px" fontWeight="bold" color="ink-muted" textTransform="uppercase" letterSpacing="0.12em">{label}</Text>
          <Text mt={3} fontSize="3xl" fontWeight="black" color="ink" lineHeight="1">{value}</Text>
          {sub && <Text fontSize="xs" color="ink-muted" mt={2.5} maxW="24ch">{sub}</Text>}
        </Box>
        <Flex boxSize={11} align="center" justify="center" borderRadius="2xl" bg={`${color}.900`} color={`${color}.200`} border="1px solid" borderColor={`${color}.700`}>
          <Icon size={18} />
        </Flex>
      </Flex>
    </Box>
  );
}

export function ReportHero({ groupInfo, selectedSubject, subjectCount, id }: { groupInfo?: GroupInfo | null; selectedSubject: string; subjectCount: number; id: string }) {
  return (
    <Box position="relative" overflow="hidden" borderRadius="3xl" bg="linear-gradient(135deg, #1b1b1b 0%, #242424 55%, #2d2d2d 100%)" color="ink" px={{ base: 6, md: 8 }} py={{ base: 6, md: 7 }} border="1px solid" borderColor="border.subtle" boxShadow="0 24px 70px rgba(0,0,0,0.45)">
      <Box position="absolute" inset="0" bg="radial-gradient(circle at top right, rgba(156,85,232,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(45,155,240,0.14), transparent 24%)" />
      <Flex position="relative" align="flex-start" justify="space-between" flexWrap="wrap" gap={4}>
        <Box maxW="3xl">
          <HStack gap={2} mb={3} flexWrap="wrap">
            <Badge bg="rgba(156,85,232,0.16)" color="ink" border="1px solid" borderColor="rgba(156,85,232,0.35)" borderRadius="full" px={3} py={1} fontSize="10px" letterSpacing="0.12em" textTransform="uppercase">Event Report</Badge>
            {groupInfo?.academicYear && <Badge bg="surface-2" color="ink" border="1px solid" borderColor="border.subtle" borderRadius="full" px={3} py={1} fontSize="10px">{groupInfo.academicYear}</Badge>}
            {groupInfo?.semester && <Badge bg="surface-2" color="ink" border="1px solid" borderColor="border.subtle" borderRadius="full" px={3} py={1} fontSize="10px">Semester {groupInfo.semester}</Badge>}
          </HStack>
          <Heading as="h1" size="xl" fontWeight="black" letterSpacing="tight">{groupInfo?.name}</Heading>
          <Text mt={3} color="ink-muted" maxW="2xl" fontSize="sm">{groupInfo?.description || 'Pantau performa mapel, partisipasi siswa, dan statistik kelulusan dalam satu tampilan laporan yang lebih operasional.'}</Text>
          <HStack mt={4} gap={3} flexWrap="wrap">
            {groupInfo?.startDate && <Box bg="surface-2" border="1px solid" borderColor="border.subtle" borderRadius="full" px={4} py={2}><Text fontSize="xs" color="ink-muted">Periode</Text><Text fontSize="sm" fontWeight="semibold">{formatDate(groupInfo.startDate)}{groupInfo.endDate ? ` - ${formatDate(groupInfo.endDate)}` : ''}</Text></Box>}
            <Box bg="surface-2" border="1px solid" borderColor="border.subtle" borderRadius="full" px={4} py={2}><Text fontSize="xs" color="ink-muted">Fokus Laporan</Text><Text fontSize="sm" fontWeight="semibold">{selectedSubject || `${subjectCount} mapel tersedia`}</Text></Box>
          </HStack>
        </Box>
        <Stack gap={3} align={{ base: 'stretch', md: 'flex-end' }}>
          <Button bg="primary" color="on-primary" size="sm" borderRadius="full" px={5} _hover={{ bg: 'primary-hover' }} onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/exam-groups/${id}/export-ledger`, '_blank')}>
            <Download size={14} />Ekspor Ledger Excel
          </Button>
          <Link href="/admin/reports"><Button variant="outline" size="sm" color="ink" borderColor="border.subtle" borderRadius="full" _hover={{ bg: 'surface-2' }}><ArrowLeft size={15} />Kembali ke Laporan</Button></Link>
        </Stack>
      </Flex>
    </Box>
  );
}

export function OverviewSection({ metrics, insights, subjectSummaries, onViewSubject }: { metrics: OverviewMetrics; insights: AttentionInsight[]; subjectSummaries: SubjectSummary[]; onViewSubject: (subject: string) => void }) {
  return (
    <Stack gap={6}>
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
        <MetricCard label="Total Siswa" value={metrics.totalStudents} sub="peserta terdaftar pada event" icon={Users} color="indigo" />
        <MetricCard label="Total Ujian" value={metrics.totalExams} sub={`${metrics.totalSubjects} mapel aktif`} icon={BookOpen} color="blue" />
        <MetricCard label="Partisipasi" value={`${metrics.overallParticipationRate.toFixed(1)}%`} sub="coverage submission seluruh event" icon={CheckCircle2} color="green" />
        <MetricCard label="Pass Rate" value={`${metrics.overallPassRate.toFixed(1)}%`} sub="kelulusan dari submission masuk" icon={TrendingUp} color="amber" />
      </SimpleGrid>

      <Box bg="surface-1" borderRadius="3xl" border="1px solid" borderColor="border.subtle" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(0,0,0,0.28)">
        <Flex align="center" gap={3} mb={5}><Flex boxSize={10} align="center" justify="center" borderRadius="2xl" bg="rgba(245,166,35,0.12)" color="warning"><AlertTriangle size={16} /></Flex><Box><Heading size="md" color="ink">Perlu Perhatian</Heading><Text fontSize="sm" color="ink-muted">Sorot masalah utama lebih dulu sebelum masuk ke detail mapel.</Text></Box></Flex>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          {insights.map((item) => (
            <Box key={item.label} bg="surface-2" borderRadius="2xl" border="1px solid" borderColor="border.subtle" p={4} boxShadow="sm">
              <Text fontSize="11px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.12em" color={`${item.tone}.300`}>{item.label}</Text>
              <Text mt={2} fontSize="lg" fontWeight="black" color="ink">{item.value}</Text>
              <Text mt={1.5} fontSize="xs" color="ink-muted">{item.caption}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Box bg="surface-1" borderRadius="3xl" border="1px solid" borderColor="border.subtle" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(0,0,0,0.28)">
        <Flex gap={3} flexWrap="wrap" align="center" justify="space-between" mb={5}>
          <Box maxW="2xl"><Text fontSize="xs" fontWeight="bold" color="secondary" textTransform="uppercase" letterSpacing="0.14em">Report Navigator</Text><Heading size="md" fontWeight="black" color="ink" mt={1}>Ranking Mapel pada Event Ini</Heading><Text fontSize="sm" color="ink-muted" mt={2}>Urutkan fokus tindak lanjut berdasarkan performa, coverage submission, dan pass rate.</Text></Box>
        </Flex>
        <Box overflowX="auto" borderRadius="2xl" border="1px solid" borderColor="border.subtle" bg="surface-2">
          <Table.Root variant="outline" size="sm">
            <Table.Header><Table.Row bg="rgba(156,85,232,0.08)"><Table.ColumnHeader py={4}>#</Table.ColumnHeader><Table.ColumnHeader py={4}>Mapel</Table.ColumnHeader><Table.ColumnHeader py={4} textAlign="center">Jumlah Ujian</Table.ColumnHeader><Table.ColumnHeader py={4} textAlign="center">Submission</Table.ColumnHeader><Table.ColumnHeader py={4} textAlign="center">Rata-rata</Table.ColumnHeader><Table.ColumnHeader py={4} textAlign="center">Pass Rate</Table.ColumnHeader><Table.ColumnHeader py={4} textAlign="center">Gap</Table.ColumnHeader><Table.ColumnHeader py={4} textAlign="right">Aksi</Table.ColumnHeader></Table.Row></Table.Header>
            <Table.Body>
              {subjectSummaries.map((summary, idx) => (
                <Table.Row key={summary.subject} _hover={{ bg: 'rgba(255,255,255,0.03)' }}>
                  <Table.Cell color="ink-muted" fontSize="xs">{idx + 1}</Table.Cell>
                  <Table.Cell><Flex align="center" gap={3}><Flex boxSize={10} align="center" justify="center" borderRadius="2xl" bg="rgba(156,85,232,0.12)" color="secondary"><BookOpen size={16} /></Flex><Box><Text fontWeight="semibold" fontSize="sm" color="ink">{summary.subject}</Text><Text fontSize="11px" color="ink-muted">{summary.totalSubmitted} submission dari target {summary.totalEnrolled * summary.examCount}</Text></Box></Flex></Table.Cell>
                  <Table.Cell textAlign="center"><Badge colorPalette="purple" borderRadius="full" px={3}>{summary.examCount}</Badge></Table.Cell>
                  <Table.Cell textAlign="center"><Text fontSize="sm" fontWeight="medium">{summary.totalSubmitted}</Text></Table.Cell>
                  <Table.Cell textAlign="center"><Text fontSize="sm" fontWeight="bold" color={summary.averageScore != null && summary.averageScore >= 70 ? 'green.300' : 'ink-muted'}>{summary.averageScore != null ? summary.averageScore.toFixed(1) : '-'}</Text></Table.Cell>
                  <Table.Cell textAlign="center"><Badge colorPalette={summary.passRate >= 70 ? 'green' : summary.passRate >= 50 ? 'orange' : 'red'} borderRadius="full" fontSize="xs" px={3}>{summary.passRate.toFixed(1)}%</Badge></Table.Cell>
                  <Table.Cell textAlign="center"><Text fontSize="sm" color={summary.missingCount > 0 ? 'red.300' : 'green.300'} fontWeight="semibold">{summary.missingCount}</Text></Table.Cell>
                  <Table.Cell textAlign="right"><Button size="xs" bg="primary" color="on-primary" borderRadius="full" px={4} _hover={{ bg: 'primary-hover' }} onClick={() => onViewSubject(summary.subject)}>Lihat Laporan<ChevronRight size={12} /></Button></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Stack>
  );
}

export function SubjectHeader({ subject, onBack }: { subject: string; onBack: () => void }) {
  return (
    <Box bg="rgba(255,255,255,0.78)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} backdropFilter="blur(18px)" boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
      <Flex gap={3} flexWrap="wrap" align="center" justify="space-between">
        <Box maxW="2xl"><Text fontSize="xs" fontWeight="bold" color="indigo.500" textTransform="uppercase" letterSpacing="0.14em">Report Navigator</Text><Heading size="md" fontWeight="black" color="gray.900" mt={1}>{`Laporan Mapel: ${subject}`}</Heading><Text fontSize="sm" color="gray.600" mt={2}>Fokus pada performa, ketuntasan, dan siswa yang masih perlu follow-up.</Text></Box>
        <Button bg="gray.900" color="white" size="sm" borderRadius="full" px={5} _hover={{ bg: 'gray.800' }} onClick={onBack}><ArrowLeft size={14} />Kembali ke Daftar Mapel</Button>
      </Flex>
    </Box>
  );
}

export function FilterPanel({ ledgerSearch, setLedgerSearch, rombels, ledgerRombel, setLedgerRombel, hasFilters, clearFilters }: { ledgerSearch: string; setLedgerSearch: (v: string) => void; rombels: { id: string; name: string }[]; ledgerRombel: string; setLedgerRombel: (v: string) => void; hasFilters: boolean; clearFilters: () => void }) {
  const collection = createListCollection({ items: [{ label: 'Semua Kelas', value: '' }, ...rombels.map((r) => ({ label: r.name, value: r.id }))] });
  return (
    <Box bg="rgba(255,255,255,0.86)" p={{ base: 5, md: 6 }} borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" backdropFilter="blur(18px)" boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
      <Flex align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={5}><Flex align="center" gap={2}><Flex boxSize={10} align="center" justify="center" borderRadius="2xl" bg="linear-gradient(135deg, rgba(79,70,229,0.12), rgba(14,165,233,0.14))" color="indigo.600"><Filter size={15} /></Flex><Box><Text fontWeight="bold" color="gray.800" fontSize="sm">Filter & Pencarian</Text><Text fontSize="xs" color="gray.500">Saring siswa dan kelas untuk analisis lebih cepat.</Text></Box></Flex>{hasFilters && <Button size="xs" variant="ghost" colorPalette="red" onClick={clearFilters} ml={{ md: 'auto' }}><X size={12} /> Hapus Filter</Button>}</Flex>
      <Flex gap={3} flexWrap="wrap"><Flex align="center" bg="white" borderRadius="full" px={4} gap={2} flex="1" minW="240px" borderWidth="1px" borderColor="gray.200" boxShadow="sm"><Search size={14} color="var(--chakra-colors-gray-400)" /><Input placeholder="Cari nama siswa..." value={ledgerSearch} onChange={(e) => setLedgerSearch(e.target.value)} border="none" bg="transparent" size="sm" /></Flex>{rombels.length > 0 && <Box minW="220px"><Select.Root collection={collection} value={[ledgerRombel]} onValueChange={(details) => setLedgerRombel(details.value[0] || '')} positioning={{ sameWidth: true }} size="sm"><Select.HiddenSelect /><Select.Control><Select.Trigger bg="white" borderRadius="full" borderColor="gray.200" boxShadow="sm"><Select.ValueText placeholder="Semua Kelas" /></Select.Trigger><Select.IndicatorGroup><Select.ClearTrigger /><Select.Indicator /></Select.IndicatorGroup></Select.Control><Select.Positioner><Select.Content>{collection.items.map((item) => <Select.Item key={item.value || 'all'} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner></Select.Root></Box>}</Flex>
    </Box>
  );
}

export function SubjectLedgerTable({ exams, rows }: { exams: ExamInfo[]; rows: StudentLedgerRow[] }) {
  if (!rows.length) return <EmptyState title="Tidak ada siswa yang cocok dengan filter." description="Ubah kata kunci atau filter kelas untuk melihat data lain." />;
  return (
    <Box overflowX="auto" mt={5} borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white">
      <Table.Root variant="outline" size="sm">
        <Table.Header><Table.Row bg="linear-gradient(90deg, rgba(79,70,229,0.08) 0%, rgba(14,165,233,0.08) 100%)"><Table.ColumnHeader py={4}>#</Table.ColumnHeader><Table.ColumnHeader py={4}>Nama Siswa</Table.ColumnHeader><Table.ColumnHeader py={4}>Kelas</Table.ColumnHeader>{exams.map((exam) => <Table.ColumnHeader key={exam.id} textAlign="center" py={4}>{exam.subject}<br /><Link href={`/admin/results/${exam.id}`}><Text fontSize="10px" color="indigo.600" fontWeight="semibold" textDecoration="underline" textUnderlineOffset="2px">{exam.title}</Text></Link></Table.ColumnHeader>)}<Table.ColumnHeader textAlign="center" py={4}>Rata-rata & Progress</Table.ColumnHeader></Table.Row></Table.Header>
        <Table.Body>{rows.map((student, idx) => <Table.Row key={student.studentId} _hover={{ bg: 'gray.50' }}><Table.Cell color="gray.400" fontSize="xs">{idx + 1}</Table.Cell><Table.Cell><Text fontWeight="semibold" fontSize="sm">{student.fullName}</Text><Text fontSize="11px" color="gray.400">{student.username}</Text></Table.Cell><Table.Cell><Text fontSize="sm" color="gray.600">{student.rombel?.name ?? '-'}</Text></Table.Cell>{exams.map((exam) => <Table.Cell key={exam.id} textAlign="center"><ScoreCell score={student.scores[exam.id]} status={student.statuses[exam.id]} passingGrade={exam.passingGrade} /></Table.Cell>)}<Table.Cell textAlign="center">{student.subjectAverage !== null ? <Stack gap={0.5} align="center"><Text fontWeight="bold" fontSize="sm" color="indigo.600">{student.subjectAverage.toFixed(1)}</Text><Text fontSize="10px" color="gray.500">{student.completedExamCount}/{student.totalExamCount} ujian selesai</Text></Stack> : <Text fontSize="xs" color="gray.400">-</Text>}</Table.Cell></Table.Row>)}</Table.Body>
      </Table.Root>
    </Box>
  );
}

export function StatusSummary({ aggregates }: { aggregates: StatusAggregate[] }) {
  return <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>{aggregates.map((item) => <Box key={item.status} bg="surface-1" borderRadius="2xl" border="1px solid" borderColor="border.subtle" p={4} boxShadow="sm"><Badge colorPalette={item.color} borderRadius="full" fontSize="10px" textTransform="none">{item.label}</Badge><Text mt={3} fontSize="2xl" fontWeight="black" color="ink">{item.count}</Text><Text fontSize="xs" color="ink-muted">akumulasi status semua attempt</Text></Box>)}</SimpleGrid>;
}

export function RombelSummaryTable({ rows }: { rows: RombelSummary[] }) {
  if (!rows.length) return null;
  return (
    <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"><Heading size="sm" fontWeight="bold" color="gray.900" mb={4}>Rekap per Kelas</Heading><Box overflowX="auto" borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white"><Table.Root variant="outline" size="sm"><Table.Header><Table.Row bg="gray.50"><Table.ColumnHeader>Kelas</Table.ColumnHeader><Table.ColumnHeader textAlign="center">Siswa</Table.ColumnHeader><Table.ColumnHeader textAlign="center">Aktif</Table.ColumnHeader><Table.ColumnHeader textAlign="center">Tuntas</Table.ColumnHeader><Table.ColumnHeader textAlign="center">Belum Tuntas</Table.ColumnHeader><Table.ColumnHeader textAlign="center">Rata-rata</Table.ColumnHeader><Table.ColumnHeader textAlign="center">Pass Rate</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{rows.map((row) => <Table.Row key={row.rombelId}><Table.Cell><Text fontSize="sm" fontWeight="medium">{row.rombelName}</Text></Table.Cell><Table.Cell textAlign="center">{row.totalStudents}</Table.Cell><Table.Cell textAlign="center">{row.activeStudents}</Table.Cell><Table.Cell textAlign="center">{row.completedStudents}</Table.Cell><Table.Cell textAlign="center"><Text color={row.missingStudents > 0 ? 'red.500' : 'green.500'} fontWeight="semibold">{row.missingStudents}</Text></Table.Cell><Table.Cell textAlign="center">{row.averageScore != null ? row.averageScore.toFixed(1) : '-'}</Table.Cell><Table.Cell textAlign="center"><Badge colorPalette={row.passRate >= 70 ? 'green' : row.passRate >= 50 ? 'amber' : 'red'} borderRadius="full">{row.passRate.toFixed(1)}%</Badge></Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box></Box>
  );
}

export function UnsubmittedTable({ rows, search, setSearch }: { rows: UnsubmittedStudent[]; search: string; setSearch: (v: string) => void }) {
  return (
    <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)"><Heading size="sm" fontWeight="bold" color="gray.900" mb={4}>Siswa Belum Menyelesaikan Ujian</Heading><Flex align="center" bg="white" borderRadius="full" px={4} gap={2} mb={4} borderWidth="1px" borderColor="gray.200" maxW="360px" boxShadow="sm"><Search size={14} color="var(--chakra-colors-gray-400)" /><Input placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} border="none" bg="transparent" size="sm" /></Flex>{rows.length === 0 ? <EmptyState title="Semua siswa pada filter ini sudah tuntas." description="Tidak ada siswa dengan ujian tertinggal pada mapel terpilih." compact /> : <Box overflowX="auto" borderRadius="2xl" border="1px solid" borderColor="gray.100"><Table.Root variant="outline" size="sm"><Table.Header><Table.Row bg="gray.50"><Table.ColumnHeader>#</Table.ColumnHeader><Table.ColumnHeader>Nama Siswa</Table.ColumnHeader><Table.ColumnHeader>Kelas</Table.ColumnHeader><Table.ColumnHeader>Jurusan</Table.ColumnHeader><Table.ColumnHeader>Ujian Belum Diselesaikan</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{rows.map((student, idx) => <Table.Row key={student.studentId} _hover={{ bg: 'gray.50' }}><Table.Cell color="gray.400" fontSize="xs">{idx + 1}</Table.Cell><Table.Cell><Text fontWeight="semibold" fontSize="sm">{student.fullName}</Text><Text fontSize="11px" color="gray.400">{student.username}</Text></Table.Cell><Table.Cell><Text fontSize="sm" color="gray.600">{student.rombel?.name ?? '-'}</Text></Table.Cell><Table.Cell><Text fontSize="sm" color="gray.600">{student.major?.name ?? '-'}</Text></Table.Cell><Table.Cell><Stack gap={1.5}>{student.missingExams.map((me) => { const st = sessionStatusMap[me.status ?? 'NOT_STARTED']; return <Flex key={me.examId} align="center" gap={2} wrap="wrap"><Badge colorPalette={st?.color ?? 'gray'} fontSize="10px" borderRadius="full" textTransform="none" px={2.5}>{st?.label ?? me.status}</Badge><Text fontSize="xs" color="gray.700"><strong>{me.subject}</strong> - {me.title}</Text></Flex>; })}</Stack></Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box>}</Box>
  );
}

export function ExamStatsSection({ stats }: { stats: ExamStat[] }) {
  const totalSubmitted = stats.reduce((sum, stat) => sum + stat.participantCount, 0);
  const totalPassed = stats.reduce((sum, stat) => sum + stat.passedCount, 0);
  const totalFailed = Math.max(totalSubmitted - totalPassed, 0);
  const donutData = [
    { name: 'Lulus', value: totalPassed, color: '#10b981' },
    { name: 'Belum Lulus', value: totalFailed, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
      <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
        <Heading size="sm" fontWeight="bold" color="gray.900" mb={1}>Komposisi Kelulusan</Heading>
        <Text fontSize="sm" color="gray.500" mb={4}>Donut chart untuk melihat proporsi lulus vs belum lulus pada mapel ini.</Text>
        {stats.length === 0 || donutData.length === 0 ? (
          <EmptyState title="Belum ada statistik ujian." description="Donut chart akan muncul setelah ada submission pada mapel ini." compact />
        ) : (
          <Stack gap={4}>
            <Box position="relative" h="320px">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value) => [value, 'Siswa']} contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)' }} />
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={78} outerRadius={110} paddingAngle={3} stroke="none">
                    {donutData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Flex position="absolute" inset="0" align="center" justify="center" pointerEvents="none">
                <Stack gap={0} align="center">
                  <Text fontSize="11px" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="0.12em">Pass Rate</Text>
                  <Text fontSize="3xl" fontWeight="black" color="gray.900">{totalSubmitted > 0 ? `${((totalPassed / totalSubmitted) * 100).toFixed(1)}%` : '-'}</Text>
                  <Text fontSize="xs" color="gray.500">{totalPassed} dari {totalSubmitted} submission</Text>
                </Stack>
              </Flex>
            </Box>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
              {donutData.map((item) => (
                <Flex key={item.name} align="center" justify="space-between" bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" px={4} py={3}>
                  <Flex align="center" gap={3}>
                    <Box boxSize={3} borderRadius="full" bg={item.color} />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">{item.name}</Text>
                  </Flex>
                  <Text fontSize="sm" fontWeight="bold" color="gray.900">{item.value}</Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Stack>
        )}
      </Box>
      <Box bg="rgba(255,255,255,0.9)" borderRadius="3xl" border="1px solid" borderColor="whiteAlpha.700" p={{ base: 5, md: 6 }} boxShadow="0 18px 45px rgba(15, 23, 42, 0.08)">
        <Heading size="sm" fontWeight="bold" color="gray.900" mb={1}>Perbandingan Rata-rata Nilai per Ujian</Heading>
        <Text fontSize="sm" color="gray.500" mb={4}>Bar chart tetap dipakai untuk membandingkan rata-rata nilai tiap ujian dengan cepat.</Text>
        {stats.length === 0 ? <EmptyState title="Belum ada statistik ujian." description="Chart akan muncul setelah ada submission pada mapel ini." compact /> : <ResponsiveContainer width="100%" height={320}><BarChart data={stats} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" /><XAxis dataKey="title" tick={{ fontSize: 12, fill: '#6b7280' }} angle={-35} textAnchor="end" interval={0} /><YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} /><Tooltip formatter={(value) => [typeof value === 'number' ? value.toFixed(1) : '-', 'Rata-rata']} contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)' }} /><Bar dataKey="averageScore" radius={[10, 10, 0, 0]}>{stats.map((entry, index) => <Cell key={index} fill={entry.averageScore == null ? '#d1d5db' : entry.averageScore >= 75 ? '#10b981' : entry.averageScore >= 60 ? '#f59e0b' : '#ef4444'} />)}</Bar></BarChart></ResponsiveContainer>}
      </Box>
    </SimpleGrid>
  );
}

export function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return <Box bg="surface-2" borderRadius="2xl" border="1px solid" borderColor="border.subtle" p={compact ? 6 : 8} textAlign="center"><Text fontWeight="semibold" color="ink">{title}</Text><Text mt={2} fontSize="sm" color="ink-muted">{description}</Text></Box>;
}

