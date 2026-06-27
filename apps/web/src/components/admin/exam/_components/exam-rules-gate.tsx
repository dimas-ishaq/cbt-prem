import { Box, Button, Checkbox, Flex, Heading, Input, SimpleGrid, Text } from '@chakra-ui/react';

interface ExamRulesGateProps {
  checkedTerms: Record<number, boolean>;
  isTokenRequired: boolean;
  tokenInput: string;
  tokenError: string;
  onToggleTerm: (id: number) => void;
  onTokenChange: (value: string) => void;
  onStart: () => void;
}

export function ExamRulesGate({ checkedTerms, isTokenRequired, tokenInput, tokenError, onToggleTerm, onTokenChange, onStart }: ExamRulesGateProps) {
  const allChecked = checkedTerms[0] && checkedTerms[1] && checkedTerms[2];

  return (
    <Flex direction="column" minH="screen" bg="gray.950" p={4}>
      <Box bg="gray.900" borderRadius="3xl" p={6} border="1px solid" borderColor="whiteAlpha.100">
        <Heading size="lg" color="white">Konfirmasi Aturan Ujian</Heading>
        <Text color="gray.400" mt={2}>Periksa informasi sebelum memulai.</Text>
        <SimpleGrid columns={1} gap={3} mt={6}>
          {[0, 1, 2].map((id) => (
            <Flex key={id} align="start" gap={3} p={4} bg="whiteAlpha.50" borderRadius="2xl" cursor="pointer" onClick={() => onToggleTerm(id)}>
              <Checkbox.Root checked={checkedTerms[id]} onCheckedChange={() => undefined}><Checkbox.HiddenInput /><Checkbox.Control /></Checkbox.Root>
              <Box>
                <Text color="white" fontWeight="bold">Syarat {id + 1}</Text>
                <Text color="gray.400" fontSize="sm">Persetujuan ujian.</Text>
              </Box>
            </Flex>
          ))}
        </SimpleGrid>
        {isTokenRequired && <Input mt={5} value={tokenInput} onChange={(e) => onTokenChange(e.target.value)} placeholder="Masukkan token ujian" />}
        {tokenError && <Text color="red.400" mt={2} fontSize="sm">{tokenError}</Text>}
        <Button mt={6} w="full" onClick={onStart} disabled={!allChecked}>Mulai Ujian Sekarang</Button>
      </Box>
    </Flex>
  );
}
