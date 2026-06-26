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

interface ExamGroup {
  id: string;
  name: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  _count: { exams: number };
}

const CategoryIcon: Record<string, React.ElementType> = { student: Users, monitoring: Activity, operational: Settings, premium: Crown };

const categoryLabel: Record<string, string> = { student: 'Laporan Siswa', monitoring: 'Laporan Monitoring & Anti-Cheat', operational: 'Laporan Operasional', premium: 'Laporan Premium' };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReportsPage() {
  const { data, isLoading: reportsLoading } = useQuery<ReportsResponse>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get('/reports');
      return res.data;
    },
  });

  const { data: examGroupsData, isLoading: groupsLoading } = useQuery<{ data: ExamGroup[]; total: number }>({
    queryKey: ['exam-groups-report-list'],
    queryFn: async () => {
      const res = await api.get('/exam-groups');
      return Array.isArray(res.data)
        ? { data: res.data, total: res.data.length }
        : res.data;
    },
  });

  const isLoading = reportsLoading || groupsLoading;

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat daftar laporan...</Text>
      </Flex>
    );
  }

  const categories = [
    { key: 'student', items: data?.student || [] },
    { key: 'monitoring', items: data?.monitoring || [] },
    { key: 'operational', items: data?.operational || [] },
    { key: 'premium', items: data?.premium || [] },
  ];

  const examGroups = examGroupsData?.data || [];

  return (
    <Stack gap={8}>
      <Box>
        <Heading size="xl" fontWeight="black" color="gray.900" letterSpacing="tight">
          Laporan CBT Premium
        </Heading>
        <Text color="gray.500" mt={1}>
          Setiap laporan dihasilkan otomatis berdasarkan data yang tersedia. Pilih kategori sesuai kebutuhan Anda.
        </Text>
      </Box>

      {/* Laporan Ujian - berdasarkan Event/Kelompok Ujian */}
      <Box bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Flex align="center" gap={2} mb={4}>
          <Icon as={FolderOpen} color="indigo.500" boxSize={5} />
          <Heading size="md" fontWeight="bold" color="gray.800">
            Laporan Ujian
          </Heading>
          <Badge colorPalette="indigo" borderRadius="full" ml={1} fontSize="xs">
            Per Event
          </Badge>
        </Flex>
        <Text color="gray.500" fontSize="sm" mb={5}>
          Pilih kelompok ujian / event untuk melihat laporan seluruh ujian yang ada di dalamnya.
        </Text>

        {examGroups.length === 0 ? (
          <Flex direction="column" align="center" py={10} gap={2}>
            <FolderOpen size={32} color="var(--chakra-colors-gray-300)" />
            <Text color="gray.400" fontWeight="medium">Belum ada kelompok ujian yang tersedia.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table.Root variant="outline" size="sm">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>#</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>Nama Event / Kelompok Ujian</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>Tahun Ajaran</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>Semester</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3}>Periode</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3} textAlign="center">Jumlah Ujian</Table.ColumnHeader>
                  <Table.ColumnHeader fontWeight="bold" color="gray.700" py={3} textAlign="right">Aksi</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {examGroups.map((group, idx) => (
                  <Table.Row key={group.id} _hover={{ bg: 'gray.50' }}>
                    <Table.Cell py={3.5} color="gray.400" fontSize="xs" fontWeight="medium">
                      {idx + 1}
                    </Table.Cell>
                    <Table.Cell py={3.5}>
                      <Text fontWeight="semibold" color="gray.900" fontSize="sm">
                        {group.name}
                      </Text>
                      {group.description && (
                        <Text fontSize="xs" color="gray.400" mt={0.5}>
                          {group.description}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell py={3.5}>
                      <Text fontSize="sm" color="gray.600">{group.academicYear || '-'}</Text>
                    </Table.Cell>
                    <Table.Cell py={3.5}>
                      <Text fontSize="sm" color="gray.600">{group.semester || '-'}</Text>
                    </Table.Cell>
                    <Table.Cell py={3.5}>
                      {group.startDate ? (
                        <Flex align="center" gap={1.5}>
                          <Calendar size={12} color="var(--chakra-colors-gray-400)" />
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(group.startDate)}
                            {group.endDate ? ` — ${formatDate(group.endDate)}` : ''}
                          </Text>
                        </Flex>
                      ) : (
                        <Text fontSize="sm" color="gray.400">-</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell py={3.5} textAlign="center">
                      <Badge colorPalette="indigo" borderRadius="full" px={2.5} fontWeight="bold" fontSize="xs">
                        {group._count?.exams ?? 0} ujian
                      </Badge>
                    </Table.Cell>
                    <Table.Cell py={3.5} textAlign="right">
                      <Link href={`/admin/reports/exam-groups/${group.id}`}>
                        <Button
                          size="xs"
                          colorPalette="indigo"
                          borderRadius="lg"
                          fontWeight="semibold"
                          cursor="pointer"
                        >
                          Lihat Laporan
                          <ChevronRight size={12} />
                        </Button>
                      </Link>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      {/* Other Report Categories */}
      {categories.map((cat) => {
        if (!cat.items.length) return null;
        const IconComp = CategoryIcon[cat.key];
        return (
          <Box key={cat.key} bg="white" p={6} borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
            <Heading
              size="md"
              fontWeight="bold"
              color="gray.800"
              mb={4}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Icon as={IconComp} color="indigo.500" />
              {categoryLabel[cat.key]}
            </Heading>
            <Box overflowX="auto">
              <Table.Root variant="simple" size="sm">
                <Table.Header bg="gray.50/50">
                  <Table.Row>
                    <Table.ColumnHeader color="gray.700" fontWeight="bold">Nama Laporan</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.700" fontWeight="bold">Deskripsi</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.700" fontWeight="bold">Kriteria Filter</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.700" fontWeight="bold" textAlign="right">Aksi</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {cat.items.map((r) => (
                    <Table.Row key={r.id} _hover={{ bg: 'gray.50/20' }}>
                      <Table.Cell py={3.5} fontWeight="semibold" color="gray.900" maxW="200px">
                        {r.title}
                      </Table.Cell>
                      <Table.Cell py={3.5} color="gray.600" maxW="350px">
                        {r.description}
                      </Table.Cell>
                      <Table.Cell py={3.5} color="gray.500" fontSize="xs">
                        <Flex align="center" gap={1}>
                          <Filter size={11} className="text-gray-400" />
                          {r.criteria}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell py={3.5} textAlign="right">
                        <Link href={`/admin/reports/generate/${r.id}`} passHref>
                          <Button size="xs" colorPalette="indigo" borderRadius="lg" fontWeight="semibold" cursor="pointer">
                            <Download size={12} />
                            Unduh Laporan
                          </Button>
                        </Link>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
