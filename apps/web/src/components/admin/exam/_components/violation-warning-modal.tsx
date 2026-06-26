import { AlertTriangle } from 'lucide-react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

interface ViolationWarningModalProps {
  message: string;
  onAcknowledge: () => void;
}

export function ViolationWarningModal({ message, onAcknowledge }: ViolationWarningModalProps) {
  return (
    <Flex position="fixed" inset={0} zIndex={50} bg="black/60" backdropFilter="blur(4px)" align="center" justify="center" p={4}>
      <Box bg="white" w="full" maxW="md" borderRadius="2xl" p={6} boxShadow="2xl" border="1px solid" borderColor="red.50" textAlign="center" className="animate-bounce-short">
        <Flex w={14} h={14} bg="red-50" borderRadius="full" align="center" justify="center" mx="auto" mb={4} border="1px solid" borderColor="red.100">
          <AlertTriangle className="text-red-600" size={28} />
        </Flex>
        <Heading size="md" fontWeight="bold" color="gray.850">Peringatan Keamanan Ujian</Heading>
        <Text color="gray.500" fontSize="sm" mt={2} lineHeight="relaxed">{message}</Text>
        <Box mt={4} p={3} bg="amber-50" border="1px solid" borderColor="amber-100" borderRadius="xl" fontSize="xs" color="amber-700" fontWeight="medium">
          Aktivitas perpindahan layar dicatat oleh sistem pengawas (proctoring). Pelanggaran berulang dapat membatalkan sesi ujian Anda.
        </Box>
        <Button onClick={onAcknowledge} mt={6} w="full" py={5} bg="gray.850" color="white" fontWeight="bold" borderRadius="xl" _hover={{ bg: 'gray.900' }} cursor="pointer" fontSize="sm">
          Saya Mengerti & Kembali ke Ujian
        </Button>
      </Box>
    </Flex>
  );
}
