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
          <Dialog.Content borderRadius="3xl" overflow="hidden" boxShadow="2xl" bg="dd.surface">
            <Dialog.Header bg={hasUnanswered ? 'dd.status.warning.bg' : 'dd.brand.subtle'} py={5} borderBottom="1px solid" borderColor="dd.border">
              <Dialog.Title fontSize="lg" fontWeight="bold" color="dd.text" display="flex" alignItems="center" gap={2}>
                {hasUnanswered ? <AlertTriangle size={22} color="var(--chakra-colors-dd-status-warning-text)" /> : <Info size={22} color="var(--chakra-colors-dd-brand)" />}
                Konfirmasi Selesaikan Ujian
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body p={6} bg="dd.surface">
              <Stack gap={5}>
                <Text fontSize="sm" color="dd.text.muted" lineHeight="relaxed">
                  Apakah Anda yakin ingin mengakhiri sesi ujian ini? Setelah dikonfirmasi, Anda tidak dapat mengubah jawaban Anda lagi.
                </Text>

                <Box p={4} bg="dd.surface.alt" borderRadius="card" border="1px solid" borderColor="dd.border">
                  <Text fontSize="xs" fontWeight="bold" color="dd.text.muted" mb={3} textTransform="uppercase" letterSpacing="0.05em">
                    Ringkasan Pengerjaan
                  </Text>
                  <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                    <Box p={3} borderRadius="badge" bg="dd.status.success.bg" border="1px solid" borderColor="dd.border" textAlign="center">
                      <Text fontSize="2xs" color="dd.status.success.text" fontWeight="bold">Dijawab</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color="dd.status.success.text">{answeredCount}</Text>
                    </Box>
                    <Box p={3} borderRadius="badge" bg={hasUnanswered ? 'dd.status.danger.bg' : 'dd.surface.alt'} border="1px solid" borderColor="dd.border" textAlign="center">
                      <Text fontSize="2xs" color={hasUnanswered ? 'dd.status.danger.text' : 'dd.text.muted'} fontWeight="bold">Belum</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color={hasUnanswered ? 'dd.status.danger.text' : 'dd.text'}>{unansweredCount}</Text>
                    </Box>
                    <Box p={3} borderRadius="badge" bg={hasFlagged ? 'dd.status.warning.bg' : 'dd.surface.alt'} border="1px solid" borderColor="dd.border" textAlign="center">
                      <Text fontSize="2xs" color={hasFlagged ? 'dd.status.warning.text' : 'dd.text.muted'} fontWeight="bold">Ragu-Ragu</Text>
                      <Text fontSize="lg" fontWeight="extrabold" color={hasFlagged ? 'dd.status.warning.text' : 'dd.text'}>{flaggedCount}</Text>
                    </Box>
                  </Grid>
                </Box>

                {hasUnanswered ? (
                  <Flex gap={3} p={4} bg="dd.status.danger.bg" borderRadius="card" border="1px solid" borderColor="dd.border" align="start">
                    <AlertTriangle size={20} color="var(--chakra-colors-dd-status-danger-text)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Stack gap={0.5}>
                      <Text fontSize="xs" fontWeight="bold" color="dd.status.danger.text">Perhatian!</Text>
                      <Text fontSize="xs" color="dd.status.danger.text" lineHeight="relaxed">
                        Anda harus menjawab seluruh <strong>{unansweredCount} soal</strong> yang tersisa sebelum diperbolehkan untuk menyelesaikan dan mengirimkan ujian.
                      </Text>
                    </Stack>
                  </Flex>
                ) : hasFlagged ? (
                  <Flex gap={3} p={4} bg="dd.status.warning.bg" borderRadius="card" border="1px solid" borderColor="dd.border" align="start">
                    <HelpCircle size={20} color="var(--chakra-colors-dd-status-warning-text)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Stack gap={0.5}>
                      <Text fontSize="xs" fontWeight="bold" color="dd.status.warning.text">Catatan</Text>
                      <Text fontSize="xs" color="dd.status.warning.text" lineHeight="relaxed">
                        Terdapat <strong>{flaggedCount} soal</strong> yang masih bertanda Ragu-Ragu. Anda dapat menyelesaikannya sekarang jika sudah yakin.
                      </Text>
                    </Stack>
                  </Flex>
                ) : (
                  <Flex gap={3} p={4} bg="dd.status.success.bg" borderRadius="card" border="1px solid" borderColor="dd.border" align="start">
                    <CheckCircle size={20} color="var(--chakra-colors-dd-status-success-text)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Stack gap={0.5}>
                      <Text fontSize="xs" fontWeight="bold" color="dd.status.success.text">Luar Biasa!</Text>
                      <Text fontSize="xs" color="dd.status.success.text" lineHeight="relaxed">
                        Semua soal telah terjawab. Silakan periksa kembali jika masih ada sisa waktu, atau kirim sekarang.
                      </Text>
                    </Stack>
                  </Flex>
                )}
              </Stack>
            </Dialog.Body>

            <Dialog.Footer p={6} borderTop="1px solid" borderColor="dd.border" gap={3} bg="dd.surface">
              <Button variant="outline" borderRadius="card" flex={1} onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button
                borderRadius="card"
                flex={1}
                onClick={onConfirm}
                loading={isSubmitting}
                disabled={hasUnanswered || isSubmitting}
                bg={hasUnanswered ? 'dd.text.muted' : 'dd.brand'}
                color="white"
                _hover={{ bg: hasUnanswered ? 'dd.text.muted' : 'dd.brand.hover' }}
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
