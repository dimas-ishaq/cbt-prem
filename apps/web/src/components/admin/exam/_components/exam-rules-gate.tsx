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
    <Flex
      direction="column"
      justify="center"
      align="center"
      minH="100dvh"
      bg="dd.canvas"
      p={{ base: 4, md: 8 }}
    >
      <Box
        maxW="3xl"
        mx="auto"
        w="full"
        bg="dd.surface"
        position="relative"
        borderRadius="card"
        p={{ base: 6, md: 8 }}
        border="1px solid"
        borderColor="dd.border"
        boxShadow={{ base: 'card-light', _dark: 'card-dark' }}
        transition="all 0.2s ease"
      >
        <Box position="absolute" inset={0} pointerEvents="none" opacity={0.12} bg="dd.brand.subtle" borderRadius="inherit" />
        <Stack gap={6} position="relative">
          <Stack gap={2}>
            <Text color="dd.brand" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em">
              Konfirmasi Pengerjaan Ujian
            </Text>
            <Heading size="lg" color="dd.text" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700">
              Periksa info sebelum ujian dimulai
            </Heading>
            <Text color="dd.text.muted" fontSize="13px" lineHeight="1.4" fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
              Setelah Anda menekan <b style={{ color: 'inherit' }}>Mulai Ujian</b>, sistem akan membuka sesi ujian Anda dan menghitung waktu pengerjaan sesuai durasi yang ditetapkan.
            </Text>
          </Stack>

          <Alert.Root status="info" variant="subtle" bg="dd.status.info.bg" borderRadius="md" borderWidth="1px" borderColor="dd.border">
            <Alert.Indicator color="dd.status.info.text" />
            <Alert.Content>
              <Alert.Title color="dd.text" fontSize="13px" fontWeight="semibold">Informasi penting</Alert.Title>
              <Alert.Description color="dd.text.muted" fontSize="12px">
                Layar ini tahap konfirmasi sebelum sesi dimulai, bukan halaman submit akhir ujian.
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
                bg={checkedTerms[id] ? 'dd.brand.subtle' : 'dd.canvas'}
                borderRadius="badge"
                borderWidth="1px"
                borderColor={checkedTerms[id] ? 'dd.brand' : 'dd.border'}
                cursor="pointer"
                _hover={{ borderColor: 'dd.brand', bg: 'dd.canvas' }}
                transition="all 0.15s ease"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control mt="0.5" colorPalette="purple" borderColor="dd.border" />
                <Checkbox.Label cursor="pointer">
                  <Stack gap={1} pl={2}>
                    <Text color="dd.text" fontWeight="semibold" fontSize="13px">{term.title}</Text>
                    <Text color="dd.text.muted" fontSize="12px">{term.description}</Text>
                  </Stack>
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
          </SimpleGrid>

          {isTokenRequired && (
            <Stack gap={2}>
              <Text color="dd.text" fontWeight="semibold" fontSize="13px">Token ujian</Text>
              <Input
                value={tokenInput}
                onChange={(e) => onTokenChange(e.target.value)}
                placeholder="Masukkan token ujian dari pengawas"
                bg="dd.canvas"
                borderColor={tokenError ? 'dd.status.danger.text' : 'dd.border'}
                color="dd.text"
                fontSize="13px"
                borderRadius="badge"
                _placeholder={{ color: 'dd.text.muted' }}
                _focus={{ borderColor: 'dd.brand', boxShadow: 'dd.focus.ring' }}
              />
              <Text color="dd.text.muted" fontSize="12px">
                Token diperlukan hanya jika ujian ini dikunci dengan token oleh pengawas.
              </Text>
            </Stack>
          )}

          {tokenError && (
            <Text color="dd.status.danger.text" fontSize="12px" fontWeight="semibold">
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
            bg="dd.brand"
            color="white"
            borderRadius="md"
            fontSize="14px"
            fontWeight="bold"
            _hover={{ bg: 'dd.brand.hover' }}
            _active={{ bg: 'dd.brand.strong' }}
            _disabled={{ bg: 'dd.surface.alt', color: 'dd.text.muted', cursor: 'not-allowed', opacity: 0.5 }}
            transition="all 0.15s ease"
          >
            Mulai Ujian
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}
