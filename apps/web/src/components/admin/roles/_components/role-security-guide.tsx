import { Box, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Info, ShieldAlert } from 'lucide-react';

export function RoleSecurityGuide() {
  return (
    <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" h="fit-content">
      <Heading size="md" mb={4} fontWeight="bold" color="gray.800">Panduan Keamanan</Heading>
      <Stack gap={4}>
        <Box>
          <HStack gap={2} mb={1}><ShieldAlert size={16} color="red" /><Text fontSize="sm" fontWeight="semibold" color="gray.700">Level Risiko Kritis</Text></HStack>
          <Text fontSize="xs" color="gray.500">Hindari memberikan permission `delete` atau `export` kepada user selain pimpinan sekolah / IT Administrator utama.</Text>
        </Box>
        <Box>
          <HStack gap={2} mb={1}><Info size={16} color="teal" /><Text fontSize="sm" fontWeight="semibold" color="gray.700">Cloning Role</Text></HStack>
          <Text fontSize="xs" color="gray.500">Gunakan fitur duplikasi (Copy) untuk membuat variasi role dengan cepat tanpa menyusun ulang permission dari awal.</Text>
        </Box>
      </Stack>
    </Box>
  );
}
