import { ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Text } from '@chakra-ui/react';

interface ExamLockedOverlayProps {
  onSubmitToken?: (token: string) => void;
  isSubmitting?: boolean;
  error?: string;
  tokenExpiresAt?: string;
}

export function ExamLockedOverlay({ onSubmitToken, isSubmitting, error, tokenExpiresAt }: ExamLockedOverlayProps) {
  const [token, setToken] = useState('');

  const handleSubmit = () => {
    if (!token.trim() || isSubmitting) return;
    onSubmitToken?.(token.trim().toUpperCase());
  };

  return (
    <Flex position="fixed" inset={0} zIndex={99999} bg="dd.status.danger.bg" backdropFilter="blur(16px)" align="center" justify="center" p={4}>
      <Box bg="dd.surface" w="full" maxW="md" borderRadius="card" p={{ base: 6, md: 8 }} boxShadow={{ base: 'card-light', _dark: 'card-dark' }} border="1px solid" borderColor="dd.border" textAlign="center">
        <Flex w={16} h={16} bg="dd.status.danger.bg" borderRadius="full" align="center" justify="center" mx="auto" mb={6} border="2px solid" borderColor="dd.border">
          <ShieldAlert className="animate-pulse" size={32} color="dd.status.danger.text" strokeWidth={2.5} />
        </Flex>
        <Heading size="lg" fontWeight="black" color="dd.text" mb={2} textAlign="center">Sesi Ujian Dikunci</Heading>
        <Text color="dd.text.muted" fontSize="sm" lineHeight="relaxed" mb={6}>
          Minta token pembuka ke pengawas/ proktor, lalu masukkan di bawah.
        </Text>

        <Input
          placeholder="Masukkan 6-digit token"
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          maxLength={6}
          textAlign="center"
          fontSize="lg"
          fontWeight="bold"
          letterSpacing="0.3em"
          fontFamily="monospace"
          mb={3}
          disabled={isSubmitting}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />

        {error && (
          <Text fontSize="xs" color="dd.status.danger.text" mb={3}>{error}</Text>
        )}

        {tokenExpiresAt && (
          <Text fontSize="xs" color="dd.text.muted" mb={4}>
            Token berlaku sampai {new Date(tokenExpiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        <Button
          bg="dd.brand"
          color="white"
          w="full"
          fontWeight="bold"
          fontSize="sm"
          borderRadius="md"
          onClick={handleSubmit}
          disabled={isSubmitting || !token.trim()}
          _hover={{ bg: 'dd.brand.hover' }}
          transition="all 0.15s ease"
          mb={4}
        >
          {isSubmitting ? 'Memproses...' : 'Buka Sesi'}
        </Button>

        <Box p={3} bg="dd.surface.alt" borderRadius="card" border="1px solid" borderColor="dd.border">
          <Text fontSize="xs" fontWeight="bold" color="dd.status.danger.text">STATUS: LINDUNGI INTEGRITAS UJIAN</Text>
        </Box>
      </Box>
    </Flex>
  );
}
