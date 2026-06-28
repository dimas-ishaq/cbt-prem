import { Box, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Info, ShieldAlert } from 'lucide-react';

export function RoleSecurityGuide() {
  return (
    <Box bg="bg.surface" p={6} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default" h="fit-content">
      <Heading size="md" mb={4} fontWeight="bold" color="text.primary">Panduan Keamanan</Heading>
      <Stack gap={4}>
        <Box>
          <HStack gap={2} mb={1}><ShieldAlert size={16} color="var(--chakra-colors-status-danger-text)" /><Text fontSize="sm" fontWeight="semibold" color="text.primary">Level Risiko Kritis</Text></HStack>
          <Text fontSize="xs" color="text.secondary">Hindari memberikan permission `delete` atau `export` kepada user selain pimpinan sekolah / IT Administrator utama.</Text>
        </Box>
        <Box>
          <HStack gap={2} mb={1}><Info size={16} color="var(--chakra-colors-brand-text)" /><Text fontSize="sm" fontWeight="semibold" color="text.primary">Cloning Role</Text></HStack>
          <Text fontSize="xs" color="text.secondary">Gunakan fitur duplikasi (Copy) untuk membuat variasi role dengan cepat tanpa menyusun ulang permission dari awal.</Text>
        </Box>
      </Stack>
    </Box>
  );
}
