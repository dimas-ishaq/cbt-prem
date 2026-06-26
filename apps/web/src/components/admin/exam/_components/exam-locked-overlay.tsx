import { ShieldAlert } from 'lucide-react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

export function ExamLockedOverlay() {
  return (
    <Flex position="fixed" inset={0} zIndex={99999} bg="black/80" backdropFilter="blur(16px)" align="center" justify="center" p={4}>
      <Box bg="gray.900" w="full" maxW="md" borderRadius="3xl" p={8} boxShadow="2xl" border="1px solid" borderColor="red.500/30" textAlign="center">
        <Flex w={16} h={16} bg="red.500/10" borderRadius="full" align="center" justify="center" mx="auto" mb={6} border="2px solid" borderColor="red.500/30">
          <ShieldAlert className="text-red-500 animate-pulse" size={32} />
        </Flex>
        <Heading size="lg" fontWeight="black" color="white" mb={2}>Sesi Ujian Dikunci</Heading>
        <Text color="gray.300" fontSize="sm" lineHeight="relaxed" mb={6}>
          Akses pengerjaan ujian Anda telah ditangguhkan sementara oleh pengawas. Hubungi pengawas ruangan untuk memulihkan sesi ujian Anda.
        </Text>
        <Box p={4} bg="whiteAlpha.100" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.200">
          <Text fontSize="xs" fontWeight="bold" color="red.300">STATUS: LINDUNGI INTEGRITAS UJIAN</Text>
        </Box>
      </Box>
    </Flex>
  );
}
