import { Badge, Box, Flex, Text, SimpleGrid } from '@chakra-ui/react';
import { BookOpen, Link2, GraduationCap } from 'lucide-react';

interface SubjectStatsProps {
  totalSubjects: number;
  totalRelations: number;
  subjectsWithTeachers: number;
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: 'purple' | 'blue' | 'green' }) {
  return (
    <Box bg="bg.surface" p={5} borderRadius="card" borderWidth="1px" borderColor="border.default" shadow="card-light">
      <Flex align="center" gap={4}>
        <Box p={3} bg={`${tone}.50`} borderRadius="lg" color={`${tone}.600`} border="1px solid" borderColor={`${tone}.100`}>
          <Icon size={22} />
        </Box>
        <Box>
          <Text fontSize="xs" color="text.muted" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">{label}</Text>
          <Text fontSize="2xl" fontWeight="black" color="text.primary" mt={1}>{value}</Text>
        </Box>
      </Flex>
    </Box>
  );
}

export function SubjectCardStats({ totalSubjects, totalRelations, subjectsWithTeachers }: SubjectStatsProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
      <StatCard label="Total Mapel" value={totalSubjects} icon={BookOpen} tone="purple" />
      <StatCard label="Relasi Guru" value={totalRelations} icon={Link2} tone="blue" />
      <StatCard label="Mapel Terhubung" value={subjectsWithTeachers} icon={GraduationCap} tone="green" />
    </SimpleGrid>
  );
}