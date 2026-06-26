import { Box, Flex, Text, SimpleGrid } from '@chakra-ui/react';
import { BookOpen, Link2, GraduationCap } from 'lucide-react';

interface SubjectStatsProps {
  totalSubjects: number;
  totalRelations: number;
  subjectsWithTeachers: number;
}

export function SubjectCardStats({ totalSubjects, totalRelations, subjectsWithTeachers }: SubjectStatsProps) {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
      <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
        <Flex align="center" gap={4}>
          <Box p={3} bg="indigo.50" borderRadius="lg" color="indigo.600">
            <BookOpen size={24} />
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">Total Mapel</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>{totalSubjects}</Text>
          </Box>
        </Flex>
      </Box>
      <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
        <Flex align="center" gap={4}>
          <Box p={3} bg="teal.50" borderRadius="lg" color="teal.600">
            <Link2 size={24} />
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">Relasi Guru</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>{totalRelations}</Text>
          </Box>
        </Flex>
      </Box>
      <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm">
        <Flex align="center" gap={4}>
          <Box p={3} bg="orange.50" borderRadius="lg" color="orange.600">
            <GraduationCap size={24} />
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">Mapel Terhubung</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>{subjectsWithTeachers}</Text>
          </Box>
        </Flex>
      </Box>
    </SimpleGrid>
  );
}