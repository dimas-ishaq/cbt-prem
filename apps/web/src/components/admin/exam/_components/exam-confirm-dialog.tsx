import { AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { Button, Dialog, Portal, Stack, Text, Flex, Grid, Box } from '@chakra-ui/react';

interface ExamConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  isSubmitting: boolean;
}

export function ExamConfirmDialog({
  open,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  unansweredCount,
  flaggedCount,
  isSubmitting,
}: ExamConfirmDialogProps) {
  const hasUnanswered = unansweredCount > 0;
  const hasFlagged = flaggedCount > 0;

  return (
    <Dialog.Root open={open} onOpenChange={(details: any) => !details.open && onClose()} size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="3xl" overflow="hidden" boxShadow="2xl">
            <Dialog.Header bg={hasUnanswered ? 'amber.50' : 'indigo.50'} py={5} borderBottom="1px solid" borderColor={hasUnanswered ? 'amber.100' : 'indigo.100'}>
              <Dialog.Title fontSize="lg" fontWeight="bold" color={hasUnanswered ? 'amber.800' : 'indigo.800'} display="flex" alignItems="center" gap={2}>
                {hasUnanswered ? <AlertTriangle size={22} className="text-amber-600 animate-bounce" /> : <Info size={22} className="text-indigo-600" />}
                Konfirmasi Selesaikan Ujian
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body p={6}>
              <Stack gap={5}>
                <Text fontSize="sm" color="gray.700" lineHeight="relaxed">
                  Apakah Anda yakin ingin mengakhiri sesi ujian ini? Setelah dikonfirmasi, Anda tidak dapat mengubah jawaban Anda lagi.
                </Text>

                {/* Question stats summary card */}
                <Box p={4} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.100">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="0.05em">
                    Ringkasan Pengerjaan
                  </Text>
                  <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                    <Box p={3} borderRadius="xl" bg="emerald.50" border="1px solid" borderColor="emerald.100" textAlign="center">
                      <Text fontSize="2xs" color="emerald.700" fontWeight="bold">Dijawab</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color="emerald.800">{answeredCount}</Text>
                    </Box>
                    <Box p={3} borderRadius="xl" bg={hasUnanswered ? 'red.50' : 'gray.50'} border="1px solid" borderColor={hasUnanswered ? 'red.100' : 'gray.100'} textAlign="center">
                      <Text fontSize="2xs" color={hasUnanswered ? 'red.700' : 'gray.600'} fontWeight="bold">Belum</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color={hasUnanswered ? 'red.800' : 'gray.800'}>{unansweredCount}</Text>
                    </Box>
                    <Box p={3} borderRadius="xl" bg={hasFlagged ? 'amber.50' : 'gray.50'} border="1px solid" borderColor={hasFlagged ? 'amber.100' : 'gray.100'} textAlign="center">
                      <Text fontSize="2xs" color={hasFlagged ? 'amber.700' : 'gray.600'} fontWeight="bold">Ragu-Ragu</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color={hasFlagged ? 'amber.800' : 'gray.800'}>{flaggedCount}</Text>
                    </Box>
                  </Grid>
                </Box>

                {/* Dynamic Warning Alert */}
                {hasUnanswered ? (
                  <Flex gap={3} p={4} bg="red.50" borderRadius="2xl" border="1px solid" borderColor="red.100" align="start">
                    <AlertTriangle size={20} className="text-red-650 shrink-0 mt-0.5" />
                    <Stack gap={0.5}>
                      <Text fontSize="xs" fontWeight="bold" color="red.800">Perhatian!</Text>
                      <Text fontSize="xs" color="red.700" lineHeight="relaxed">
                        Anda harus menjawab seluruh <strong>{unansweredCount} soal</strong> yang tersisa sebelum diperbolehkan untuk menyelesaikan dan mengirimkan ujian.
                      </Text>
                    </Stack>
                  </Flex>
                ) : hasFlagged ? (
                  <Flex gap={3} p={4} bg="amber.50" borderRadius="2xl" border="1px solid" borderColor="amber.100" align="start">
                    <HelpCircle size={20} className="text-amber-650 shrink-0 mt-0.5" />
                    <Stack gap={0.5}>
                      <Text fontSize="xs" fontWeight="bold" color="amber.800">Catatan</Text>
                      <Text fontSize="xs" color="amber.700" lineHeight="relaxed">
                        Terdapat <strong>{flaggedCount} soal</strong> yang masih bertanda Ragu-Ragu. Anda dapat menyelesaikannya sekarang jika sudah yakin.
                      </Text>
                    </Stack>
                  </Flex>
                ) : (
                  <Flex gap={3} p={4} bg="emerald.50" borderRadius="2xl" border="1px solid" borderColor="emerald.100" align="start">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <Stack gap={0.5}>
                      <Text fontSize="xs" fontWeight="bold" color="emerald.800">Luar Biasa!</Text>
                      <Text fontSize="xs" color="emerald.700" lineHeight="relaxed">
                        Semua soal telah terjawab. Silakan periksa kembali jika masih ada sisa waktu, atau kirim sekarang.
                      </Text>
                    </Stack>
                  </Flex>
                )}
              </Stack>
            </Dialog.Body>

            <Dialog.Footer p={6} borderTop="1px solid" borderColor="gray.100" gap={3}>
              <Button variant="outline" borderRadius="xl" flex={1} onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                colorPalette={hasUnanswered ? 'gray' : 'indigo'}
                borderRadius="xl"
                flex={1}
                onClick={onConfirm}
                loading={isSubmitting}
                disabled={hasUnanswered || isSubmitting}
              >
                {hasUnanswered ? 'Belum Lengkap' : 'Ya, Selesaikan'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
