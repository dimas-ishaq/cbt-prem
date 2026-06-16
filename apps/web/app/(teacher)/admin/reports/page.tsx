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
} from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Icon,
  Button,
  Badge,
  HStack,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import Link from 'next/link';

interface Report { id: string; title: string; description: string; criteria: string; generateUrl: string; }

interface ReportsResponse { exam: Report[]; student: Report[]; monitoring: Report[]; operational: Report[]; premium: Report[]; }

const CategoryIcon: Record<string, React.ElementType> = { exam: FileText, student: Users, monitoring: Activity, operational: Settings, premium: Crown, };

const categoryLabel: Record<string, string> = { exam: 'Laporan Ujian', student: 'Laporan Siswa', monitoring: 'Laporan Monitoring & Anti-Cheat', operational: 'Laporan Operasional', premium: 'Laporan Premium', };

const ReportCard = ({ report }: { report: Report }) => ( <Box bg="white" shadow="sm" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" h="full" display="flex" flexDirection="column" _hover={{ shadow: 'lg', borderColor: 'indigo.400' }} transition="all 0.2s" > <Box p={5} flex="1" display="flex" flexDirection="column" > <Stack gap={3} h="full"> <Box> <Text fontWeight="bold" fontSize="md" color="gray.800" > {report.title} </Text> <Text fontSize="sm" color="gray.500" mt={0.5} lineClamp={2}> {report.description} </Text> </Box> <Box mt="auto"> <Text as="small" color="gray.400" display="flex" alignItems="center" gap={1} > <Filter size={12} /> {report.criteria} </Text> </Box> </Stack> </Box> <Box p={4} pt={4} pb={4} mt="auto" bg="gray.50/60" borderTopWidth="1px" borderColor="gray.100" > <Link href={`/admin/reports/generate/${report.id}`} passHref style={{ width: '100%' }} > <Button as="span" w="full" size="sm" colorPalette="indigo" borderRadius="lg" fontWeight="semibold" cursor="pointer" > <Download size={14} /> <Text ml={2}>Unduh Laporan</Text> </Button> </Link> </Box> </Box> );

export default function ReportsPage() {
  const { data, isLoading } = useQuery<ReportsResponse>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get('/reports');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat daftar laporan...</Text>
      </Flex>
    );
  }

  const categories = [
    { key: 'exam', items: data?.exam || [] },
    { key: 'student', items: data?.student || [] },
    { key: 'monitoring', items: data?.monitoring || [] },
    { key: 'operational', items: data?.operational || [] },
    { key: 'premium', items: data?.premium || [] },
  ];

  return (
    <Stack gap={8}>
      <Box>
        <Heading size="xl" fontWeight="bold" color="gray.900">
          Laporan CBT Premium
        </Heading>
        <Text color="gray.500" mt={1}>
          Setiap laporan dihasilkan otomatis berdasarkan data yang tersedia. Pilih kategori sesuai kebutuhan Anda.
        </Text>
      </Box>
      {categories.map((cat) => {
        if (!cat.items.length) return null;
        const IconComp = CategoryIcon[cat.key];
        return (
          <Box key={cat.key}>
            <Heading
              size="md"
              fontWeight="semibold"
              color="gray.800"
              mb={4}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Icon as={IconComp} color="indigo.500" />
              {categoryLabel[cat.key]}
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {cat.items.map((r) => (
                <ReportCard key={r.id} report={r} />
              ))}
            </SimpleGrid>
          </Box>
        );
      })}
    </Stack>
  );
}
