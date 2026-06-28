'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FileText,
  BarChart3,
  Users,
  Activity,
  AlertTriangle,
  Settings,
  Crown,
  Award,
  BookOpen,
  CheckCircle,
  Download,
  Filter,
  Calendar,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Table,
  Stack,
  Icon,
  Button,
  Spinner,
  Badge,
  HStack,
} from '@chakra-ui/react';
import Link from 'next/link';

interface Report { id: string; title: string; description: string; criteria: string; generateUrl: string; }
interface ReportsResponse { student: Report[]; monitoring: Report[]; operational: Report[]; premium: Report[]; }
interface ExamGroup { id: string; name: string; description?: string; academicYear?: string; semester?: string; startDate?: string; endDate?: string; _count: { exams: number }; }

const CategoryIcon: Record<string, React.ElementType> = { student: Users, monitoring: Activity, operational: Settings, premium: Crown };
const categoryLabel: Record<string, string> = { student: 'Laporan Siswa', monitoring: 'Laporan Monitoring & Anti-Cheat', operational: 'Laporan Operasional', premium: 'Laporan Premium' };

function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function ReportsPage() {
  const { data, isLoading: reportsLoading } = useQuery<ReportsResponse>({ queryKey: ['reports'], queryFn: async () => (await api.get('/reports')).data });
  const { data: examGroupsData, isLoading: groupsLoading } = useQuery<{ data: ExamGroup[]; total: number }>({ queryKey: ['exam-groups-report-list'], queryFn: async () => { const res = await api.get('/exam-groups'); return Array.isArray(res.data) ? { data: res.data, total: res.data.length } : res.data; } });
  const isLoading = reportsLoading || groupsLoading;
  if (isLoading) return <Flex justify="center" align="center" py={16} gap={3} bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="card" shadow="card-dark"><Spinner size="lg" color="brand.solid" /><Text color="text.secondary">Memuat daftar laporan...</Text></Flex>;
  const categories = [{ key: 'student', items: data?.student || [] }, { key: 'monitoring', items: data?.monitoring || [] }, { key: 'operational', items: data?.operational || [] }, { key: 'premium', items: data?.premium || [] }];
  const examGroups = examGroupsData?.data || [];
  return (
    <Stack gap={8} color="text.primary">
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
        <HStack gap={3} mb={2}><Box boxSize={10} borderRadius="lg" bg="brand.subtle" color="brand.text" display="flex" alignItems="center" justifyContent="center"><FileText size={18} /></Box><Heading size="xl" fontWeight="black" letterSpacing="tight" color="text.primary">Laporan CBT</Heading></HStack>
        <Text color="text.secondary">Setiap laporan dihasilkan otomatis berdasarkan data. Pilih kategori sesuai kebutuhan.</Text>
      </Box>
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
        <Flex align="center" gap={2} mb={4}><Icon as={FolderOpen} color="brand.text" boxSize={5} /><Heading size="md" fontWeight="bold" color="text.primary">Laporan Ujian</Heading><Badge bg="brand.subtle" color="brand.text" borderRadius="full" ml={1} fontSize="xs">Per Event</Badge></Flex>
        <Text color="text.secondary" fontSize="sm" mb={5}>Pilih kelompok ujian / event untuk lihat laporan seluruh ujian di dalamnya.</Text>
        {examGroups.length === 0 ? <Flex direction="column" align="center" py={10} gap={2}><FolderOpen size={32} color="var(--chakra-colors-text-muted)" /><Text color="text.muted" fontWeight="medium">Belum ada kelompok ujian.</Text></Flex> : <Box overflowX="auto"><Table.Root variant="outline" size="sm"><Table.Header><Table.Row bg="bg.elevated"><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3}>#</Table.ColumnHeader><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3}>Nama Event / Kelompok Ujian</Table.ColumnHeader><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3}>Tahun Ajaran</Table.ColumnHeader><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3}>Semester</Table.ColumnHeader><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3}>Periode</Table.ColumnHeader><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3} textAlign="center">Jumlah Ujian</Table.ColumnHeader><Table.ColumnHeader fontWeight="bold" color="text.primary" py={3} textAlign="right">Aksi</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{examGroups.map((group, idx) => <Table.Row key={group.id} _hover={{ bg: 'bg.subtle' }}><Table.Cell py={3.5} color="text.muted" fontSize="xs" fontWeight="medium">{idx + 1}</Table.Cell><Table.Cell py={3.5}><Text fontWeight="semibold" color="text.primary" fontSize="sm">{group.name}</Text>{group.description && <Text fontSize="xs" color="text.muted" mt={0.5}>{group.description}</Text>}</Table.Cell><Table.Cell py={3.5}><Text fontSize="sm" color="text.secondary">{group.academicYear || '-'}</Text></Table.Cell><Table.Cell py={3.5}><Text fontSize="sm" color="text.secondary">{group.semester || '-'}</Text></Table.Cell><Table.Cell py={3.5}>{group.startDate ? <Flex align="center" gap={1.5}><Calendar size={12} color="var(--chakra-colors-text-muted)" /><Text fontSize="xs" color="text.muted">{formatDate(group.startDate)}{group.endDate ? ` — ${formatDate(group.endDate)}` : ''}</Text></Flex> : <Text fontSize="sm" color="text.muted">-</Text>}</Table.Cell><Table.Cell py={3.5} textAlign="center"><Badge bg="brand.subtle" color="brand.text" borderRadius="full" px={2.5} fontWeight="bold" fontSize="xs">{group._count?.exams ?? 0} ujian</Badge></Table.Cell><Table.Cell py={3.5} textAlign="right"><Link href={`/admin/reports/exam-groups/${group.id}`}><Button size="xs" bg="brand.subtle" color="brand.text" borderRadius="lg" fontWeight="semibold" cursor="pointer" _hover={{ bg: 'brand.solid', color: 'text.inverted' }}>Lihat Laporan <ChevronRight size={12} /></Button></Link></Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box>}
      </Box>
      {categories.map((cat) => { if (!cat.items.length) return null; const IconComp = CategoryIcon[cat.key]; return <Box key={cat.key} bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default"><Heading size="md" fontWeight="bold" color="text.primary" mb={4} display="flex" alignItems="center" gap={2}><Icon as={IconComp} color="brand.text" />{categoryLabel[cat.key]}</Heading><Box overflowX="auto"><Table.Root variant="outline" size="sm"><Table.Header bg="bg.elevated"><Table.Row><Table.ColumnHeader color="text.primary" fontWeight="bold">Nama Laporan</Table.ColumnHeader><Table.ColumnHeader color="text.primary" fontWeight="bold">Deskripsi</Table.ColumnHeader><Table.ColumnHeader color="text.primary" fontWeight="bold">Kriteria Filter</Table.ColumnHeader><Table.ColumnHeader color="text.primary" fontWeight="bold" textAlign="right">Aksi</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{cat.items.map((r) => <Table.Row key={r.id} _hover={{ bg: 'bg.subtle' }}><Table.Cell py={3.5} fontWeight="semibold" color="text.primary" maxW="200px">{r.title}</Table.Cell><Table.Cell py={3.5} color="text.secondary" maxW="350px">{r.description}</Table.Cell><Table.Cell py={3.5} color="text.muted" fontSize="xs"><Flex align="center" gap={1}><Filter size={11} color="var(--chakra-colors-text-muted)" />{r.criteria}</Flex></Table.Cell><Table.Cell py={3.5} textAlign="right"><Link href={`/admin/reports/generate/${r.id}`} passHref><Button size="xs" bg="brand.subtle" color="brand.text" borderRadius="lg" fontWeight="semibold" cursor="pointer" _hover={{ bg: 'brand.solid', color: 'text.inverted' }}><Download size={12} /> Unduh Laporan</Button></Link></Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box></Box>; })}
    </Stack>
  );
}
