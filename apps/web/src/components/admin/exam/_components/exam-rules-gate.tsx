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
    <Flex direction="column" justify="center" minH="screen" bg="gray.950" p={{ base: 4, md: 8 }}>
      <Box maxW="3xl" mx="auto" w="full" bg="linear-gradient(180deg, rgba(23,25,35,0.98) 0%, rgba(12,14,20,0.98) 100%)" borderRadius="3xl" p={{ base: 6, md: 8 }} border="1px solid" borderColor="whiteAlpha.200" boxShadow="0 30px 80px rgba(0, 0, 0, 0.45)">
        <Stack gap={6}>
          <Stack gap={2}>
            <Text color="cyan.300" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="0.14em">
              Konfirmasi Pengerjaan Ujian
            </Text>
            <Heading size="xl" color="white">
              Periksa informasi sebelum ujian dimulai
            </Heading>
            <Text color="gray.300" lineHeight="tall">
              Setelah Anda menekan <b>Mulai Ujian</b>, sistem akan membuka sesi ujian Anda dan menghitung waktu pengerjaan sesuai durasi yang ditetapkan.
            </Text>
          </Stack>

          <Alert.Root status="info" variant="subtle" bg="cyan.500/12" borderRadius="2xl" borderWidth="1px" borderColor="cyan.400/30">
            <Alert.Indicator color="cyan.300" />
            <Alert.Content>
              <Alert.Title color="white">Informasi penting</Alert.Title>
              <Alert.Description color="gray.200">
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
                bg={checkedTerms[id] ? 'whiteAlpha.140' : 'whiteAlpha.80'}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={checkedTerms[id] ? 'cyan.400/40' : 'whiteAlpha.120'}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control mt="1" />
                <Checkbox.Label>
                  <Stack gap={1}>
                    <Text color="white" fontWeight="semibold">{term.title}</Text>
                    <Text color="gray.400" fontSize="sm">{term.description}</Text>
                  </Stack>
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
          </SimpleGrid>

          {isTokenRequired && (
            <Stack gap={2}>
              <Text color="white" fontWeight="semibold">Token ujian</Text>
              <Input
                value={tokenInput}
                onChange={(e) => onTokenChange(e.target.value)}
                placeholder="Masukkan token ujian dari pengawas"
                bg="whiteAlpha.80"
                borderColor={tokenError ? 'red.400' : 'whiteAlpha.200'}
                color="white"
                _placeholder={{ color: 'gray.500' }}
              />
              <Text color="gray.400" fontSize="sm">
                Token diperlukan hanya jika ujian ini dikunci dengan token oleh pengawas.
              </Text>
            </Stack>
          )}

          {tokenError && (
            <Text color="red.300" fontSize="sm" fontWeight="medium">
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
            bg="linear-gradient(135deg, #5B8CFF 0%, #7C5CFF 100%)"
            color="white"
            borderRadius="2xl"
            _hover={{ opacity: 0.92 }}
          >
            Mulai Ujian
          </Button>
        </Stack>
      </Box>
    </Flex>
  );
}

