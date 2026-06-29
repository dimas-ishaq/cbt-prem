import { Alert, Box, Button, Checkbox, Flex, Heading, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react';

interface ExamRulesGateProps {
  checkedTerms: Record<number, boolean>;
  isTokenRequired: boolean;
  tokenInput: string;
  tokenError: string;
  isStarting: boolean;
  disableStart: boolean;
  onToggleTerm: (id: number, checked: boolean) => void;
  onTokenChange: (value: string) => void;
  onStart: () => void;
}

const EXAM_TERMS = [
  {
    title: 'Saya siap mengerjakan ujian secara mandiri',
    description: 'Setelah menekan tombol mulai, sesi ujian akan dibuat dan waktu ujian langsung berjalan.',
  },
  {
    title: 'Saya memahami jawaban tersimpan otomatis',
    description: 'Setiap pilihan dan jawaban esai akan disimpan selama sesi ujian berlangsung.',
  },
  {
    title: 'Saya akan mematuhi tata tertib ujian',
    description: 'Pelanggaran atau keluar dari ketentuan ujian dapat menyebabkan sesi terkunci otomatis.',
  },
] as const;

export function ExamRulesGate({ checkedTerms, isTokenRequired, tokenInput, tokenError, isStarting, disableStart, onToggleTerm, onTokenChange, onStart }: ExamRulesGateProps) {
  return (
    <Flex direction="column" justify="center" minH="screen" bg={{ base: '#F4F5F7', _dark: '#1B1B1B' }} p={{ base: 4, md: 8 }}>
      <Box 
        maxW="3xl" 
        mx="auto" 
        w="full" 
        bg={{ base: '#FFFFFF', _dark: '#242424' }} 
        borderRadius="md" 
        p={{ base: 6, md: 8 }} 
        border="1px solid" 
        borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} 
        boxShadow="0 1px 4px rgba(0,0,0,0.1)"
      >
        <Stack gap={6}>
          <Stack gap={2}>
            <Text color="#9C55E8" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em">
              Konfirmasi Pengerjaan Ujian
            </Text>
            <Heading size="lg" color={{ base: '#1F2328', _dark: '#E0E0E0' }} fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700">
              Periksa informasi sebelum ujian dimulai
            </Heading>
            <Text color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="13px" lineHeight="1.4" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
              Setelah Anda menekan <b style={{ color: 'inherit' }}>Mulai Ujian</b>, sistem akan membuka sesi ujian Anda dan menghitung waktu pengerjaan sesuai durasi yang ditetapkan.
            </Text>
          </Stack>

          <Alert.Root status="info" variant="subtle" bg={{ base: 'rgba(45, 155, 240, 0.08)', _dark: '#1B1B1B' }} borderRadius="md" borderWidth="1px" borderColor={{ base: 'rgba(45, 155, 240, 0.25)', _dark: '#3D3D3D' }}>
            <Alert.Indicator color="#2D9BF0" />
            <Alert.Content>
              <Alert.Title color={{ base: '#1F2328', _dark: '#E0E0E0' }} fontSize="13px" fontWeight="semibold">Informasi penting</Alert.Title>
              <Alert.Description color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="12px">
                Layar ini adalah tahap konfirmasi sebelum sesi dimulai, bukan halaman submit akhir ujian.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <SimpleGrid columns={1} gap={3}>
            {EXAM_TERMS.map((term, id) => (
              <Checkbox.Root
                key={term.title}
                checked={checkedTerms[id]}
                onCheckedChange={(details) => onToggleTerm(id, details.checked === true)}
                alignItems="flex-start"
                p={4}
                bg={checkedTerms[id] ? { base: 'rgba(156, 85, 232, 0.05)', _dark: '#2D2D2D' } : { base: '#F9FAFC', _dark: '#1B1B1B' }}
                borderRadius="md"
                borderWidth="1px"
                borderColor={checkedTerms[id] ? '#9C55E8' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
                cursor="pointer"
                _hover={{ borderColor: '#9C55E8', bg: { base: '#F9FAFC', _dark: '#2D2D2D' } }}
                transition="all 0.15s ease"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control mt="0.5" colorPalette="purple" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} />
                <Checkbox.Label cursor="pointer">
                  <Stack gap={1} pl={2}>
                    <Text color={{ base: '#1F2328', _dark: '#E0E0E0' }} fontWeight="semibold" fontSize="13px">{term.title}</Text>
                    <Text color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="12px">{term.description}</Text>
                  </Stack>
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
          </SimpleGrid>

          {isTokenRequired && (
            <Stack gap={2}>
              <Text color={{ base: '#1F2328', _dark: '#E0E0E0' }} fontWeight="semibold" fontSize="13px">Token ujian</Text>
              <Input
                value={tokenInput}
                onChange={(e) => onTokenChange(e.target.value)}
                placeholder="Masukkan token ujian dari pengawas"
                bg={{ base: '#F9FAFC', _dark: '#2D2D2D' }}
                borderColor={tokenError ? '#EF4444' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
                color={{ base: '#1F2328', _dark: '#E0E0E0' }}
                fontSize="13px"
                borderRadius="sm"
                _placeholder={{ color: { base: '#57606A', _dark: '#8A8A8A' } }}
                _focus={{ borderColor: '#9C55E8', boxShadow: '0 0 0 1px #9C55E8' }}
              />
              <Text color={{ base: '#57606A', _dark: '#8A8A8A' }} fontSize="12px">
                Token diperlukan hanya jika ujian ini dikunci dengan token oleh pengawas.
              </Text>
            </Stack>
          )}

          {tokenError && (
            <Text color="#EF4444" fontSize="12px" fontWeight="semibold">
              {tokenError}
            </Text>
          )}

          <Button
            size="lg"
            w="full"
            onClick={onStart}
            disabled={disableStart}
            loading={isStarting}
            loadingText="Memulai ujian..."
            bg="#774AA4"
            color="#ffffff"
            borderRadius="md"
            fontSize="14px"
            fontWeight="bold"
            _hover={{ bg: '#6A3E92' }}
            _active={{ bg: '#5A347D' }}
            _disabled={{ bg: { base: '#F4F5F7', _dark: '#2D2D2D' }, color: { base: '#94A3B8', _dark: '#8A8A8A' }, cursor: 'not-allowed', opacity: 0.5 }}
            transition="all 0.15s ease"
          >
            Mulai Ujian
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}
