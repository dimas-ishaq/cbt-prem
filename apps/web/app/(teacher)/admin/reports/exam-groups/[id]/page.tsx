'use client';

import { use, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Flex, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react';
import { BarChart3, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  buildAttentionInsights,
  buildFilteredLedger,
  buildFilteredUnsubmitted,
  buildOverviewMetrics,
  buildRombelSummaries,
  buildRombels,
  buildSelectedExams,
  buildSelectedExamStats,
  buildStatusAggregates,
  buildSubjectOptions,
  buildSubjectSummaries,
  ExamGroup,
  LedgerData,
} from './report-utils';
import {
  EmptyState,
  ExamStatsSection,
  FilterPanel,
  MetricCard,
  OverviewSection,
  ReportHero,
  RombelSummaryTable,
  StatusSummary,
  SubjectHeader,
  SubjectLedgerTable,
  UnsubmittedTable,
} from './report-sections';

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
  const groupInfo = ledgerData?.group ?? group;
  const subjectOptions = useMemo(() => buildSubjectOptions(group), [group]);
  const subjectSummaries = useMemo(() => buildSubjectSummaries(ledgerData), [ledgerData]);
  const overviewMetrics = useMemo(() => buildOverviewMetrics(ledgerData, subjectSummaries), [ledgerData, subjectSummaries]);
  const attentionInsights = useMemo(() => buildAttentionInsights(subjectSummaries, ledgerData?.unsubmitted.length ?? 0), [subjectSummaries, ledgerData?.unsubmitted.length]);
  const rombels = useMemo(() => buildRombels(ledgerData), [ledgerData]);
  const selectedExams = useMemo(() => buildSelectedExams(ledgerData, selectedSubject), [ledgerData, selectedSubject]);
  const selectedExamIds = useMemo(() => new Set(selectedExams.map((exam) => exam.id)), [selectedExams]);
  const selectedExamStats = useMemo(() => buildSelectedExamStats(ledgerData, selectedSubject), [ledgerData, selectedSubject]);
  const selectedSubjectSummary = useMemo(() => subjectSummaries.find((summary) => summary.subject === selectedSubject) ?? null, [subjectSummaries, selectedSubject]);
  const filteredLedger = useMemo(() => buildFilteredLedger(ledgerData, selectedExams, ledgerSearch, ledgerRombel), [ledgerData, selectedExams, ledgerSearch, ledgerRombel]);
  const filteredUnsubmitted = useMemo(() => buildFilteredUnsubmitted(ledgerData, selectedExamIds, selectedExams.length, unsubSearch), [ledgerData, selectedExamIds, selectedExams.length, unsubSearch]);
  const statusAggregates = useMemo(() => buildStatusAggregates(filteredLedger, selectedExams), [filteredLedger, selectedExams]);
  const rombelSummaries = useMemo(() => buildRombelSummaries(filteredLedger, selectedExams), [filteredLedger, selectedExams]);

  const studentsWithAnySubmission = useMemo(() => filteredLedger.filter((student) => student.submittedExamCount > 0).length, [filteredLedger]);
  const studentsCompletedAll = useMemo(() => filteredLedger.filter((student) => student.completedExamCount === selectedExams.length && selectedExams.length > 0).length, [filteredLedger, selectedExams.length]);

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

  if (!subjectOptions.length) {
    return (
      <Stack gap={6}>
        <ReportHero groupInfo={groupInfo} selectedSubject={selectedSubject} subjectCount={subjectSummaries.length} id={id} />
        <EmptyState title="Belum ada mapel pada event ini." description="Tambahkan ujian ke dalam event agar laporan bisa ditampilkan." />
      </Stack>
    );
  }

  return (
    <Stack gap={6} bg="canvas" color="ink" minH="100vh" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 4, md: 6 }}>
      <ReportHero groupInfo={groupInfo} selectedSubject={selectedSubject} subjectCount={subjectSummaries.length} id={id} />

      {!selectedSubject ? (
        <OverviewSection
          metrics={overviewMetrics}
          insights={attentionInsights}
          subjectSummaries={subjectSummaries}
          onViewSubject={(subject) => router.push(`/admin/reports/exam-groups/${id}?subject=${encodeURIComponent(subject)}`)}
        />
      ) : (
        <Stack gap={6}>
          <SubjectHeader subject={selectedSubject} onBack={() => router.push(`/admin/reports/exam-groups/${id}`)} />

          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
            <MetricCard label="Total Peserta" value={ledgerData?.totalStudents ?? 0} sub="siswa terdaftar pada mapel ini" icon={Users} color="indigo" />
            <MetricCard label="Ikut Minimal 1" value={`${studentsWithAnySubmission}`} sub="sudah punya aktivitas submission" icon={CheckCircle2} color="green" />
            <MetricCard label="Tuntas Semua" value={`${studentsCompletedAll}`} sub={`${selectedExams.length} ujian mapel selesai`} icon={BarChart3} color="blue" />
            <MetricCard label="Pass Rate" value={selectedSubjectSummary ? `${selectedSubjectSummary.passRate.toFixed(1)}%` : '-'} sub="kelulusan dari submission masuk" icon={TrendingUp} color="amber" />
          </SimpleGrid>

          <StatusSummary aggregates={statusAggregates} />

          <FilterPanel
            ledgerSearch={ledgerSearch}
            setLedgerSearch={setLedgerSearch}
            rombels={rombels}
            ledgerRombel={ledgerRombel}
            setLedgerRombel={setLedgerRombel}
            hasFilters={Boolean(hasFilters)}
            clearFilters={clearFilters}
          />

          <SubjectLedgerTable exams={selectedExams} rows={filteredLedger} />

          <RombelSummaryTable rows={rombelSummaries} />

          <UnsubmittedTable rows={filteredUnsubmitted} search={unsubSearch} setSearch={setUnsubSearch} />

          <ExamStatsSection stats={selectedExamStats} />
        </Stack>
      )}
    </Stack>
  );
}
