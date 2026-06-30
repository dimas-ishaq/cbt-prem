import { ShieldAlert } from 'lucide-react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

export function ExamLockedOverlay() {
  return (
    <Flex position="fixed" inset={0} zIndex={99999} bg="dd.status.danger.bg" backdropFilter="blur(16px)" align="center" justify="center" p={4}>
      <Box bg="dd.surface" w="full" maxW="md" borderRadius="card" p={8} boxShadow={{ base: 'card-light', _dark: 'card-dark' }} border="1px solid" borderColor="dd.border" textAlign="center">
        <Flex w={16} h={16} bg="dd.status.danger.bg" borderRadius="full" align="center" justify="center" mx="auto" mb={6} border="2px solid" borderColor="dd.border">
          <ShieldAlert className="animate-pulse" size={32} color="dd.status.danger.text" strokeWidth={2.5} />
        </Flex>
        <Heading size="lg" fontWeight="black" color="dd.text" mb={2} textAlign="center">Sesi Ujian Dikunci</Heading>
        <Text color="dd.text.muted" fontSize="sm" lineHeight="relaxed" mb={6}>
          Akses pengerjaan ujian Anda telah ditangguhkan sementara oleh pengawas. Hubungi pengawas ruangan untuk memulihkan sesi ujian Anda.
        </Text>
        <Box p={4} bg="dd.surface.alt" borderRadius="card" border="1px solid" borderColor="dd.border">
          <Text fontSize="xs" fontWeight="bold" color="dd.status.danger.text">STATUS: LINDUNGI INTEGRITAS UJIAN</Text>
        </Box>
      </Box>
    </Flex>
  );
}
