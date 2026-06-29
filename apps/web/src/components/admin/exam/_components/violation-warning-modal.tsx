import { AlertTriangle } from 'lucide-react';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

interface ViolationWarningModalProps {
  open: boolean;
  message: string;
  onAcknowledge: () => void;
}

export function ViolationWarningModal({ open, message, onAcknowledge }: ViolationWarningModalProps) {
  if (!open) return null;

  return (
    <Flex position="fixed" inset={0} zIndex={50} bg="blackAlpha.600" backdropFilter="blur(4px)" align="center" justify="center" p={4}>
      <Box bg="bg.surface" w="full" maxW="md" borderRadius="2xl" p={6} boxShadow="2xl" border="1px solid" borderColor="border.default" textAlign="center" className="animate-bounce-short">
        <Flex w={14} h={14} bg="status.danger.bg" borderRadius="full" align="center" justify="center" mx="auto" mb={4} border="1px solid" borderColor="border.default">
          <AlertTriangle className="text-red-600" size={28} />
        </Flex>
        <Heading size="md" fontWeight="bold" color="text.primary">Peringatan Keamanan Ujian</Heading>
        <Text color="text.secondary" fontSize="sm" mt={2} lineHeight="relaxed">{message}</Text>
        <Box mt={4} p={3} bg="status.warning.bg" border="1px solid" borderColor="border.default" borderRadius="xl" fontSize="xs" color="status.warning.text" fontWeight="medium">
          Aktivitas perpindahan layar dicatat oleh sistem pengawas (proctoring). Pelanggaran berulang dapat membatalkan sesi ujian Anda.
        </Box>
        <Button onClick={onAcknowledge} mt={6} w="full" py={5} bg="brand.solid" color="text.inverted" fontWeight="bold" borderRadius="xl" _hover={{ bg: 'brand.text' }} cursor="pointer" fontSize="sm">
          Saya Mengerti & Kembali ke Ujian
        </Button>
      </Box>
    </Flex>
  );
}
