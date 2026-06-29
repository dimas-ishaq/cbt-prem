import { CheckCircle2 } from 'lucide-react';
import { Button, Dialog, Portal, Stack, Text } from '@chakra-ui/react';

interface TimeAddedDialogProps {
  open: boolean;
  minutes: number;
  onOpenChange: (open: boolean) => void;
}

export function TimeAddedDialog({ open, minutes, onOpenChange }: TimeAddedDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(details: any) => onOpenChange(details.open)} size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="2xl" overflow="hidden" bg="bg.surface" borderWidth="1px" borderColor="border.default">
            <Dialog.Header bg="status.success.bg" py={4} borderBottom="1px solid" borderColor="border.default">
              <Dialog.Title fontSize="md" fontWeight="bold" color="status.success.text" display="flex" alignItems="center" gap={2}>
                <CheckCircle2 size={18} />
                Waktu Ujian Diperpanjang
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p={6}>
              <Stack gap={3}>
                <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                  Pengawas telah menambahkan <strong>{minutes} menit</strong> ke waktu ujian Anda.
                </Text>
                <Text fontSize="sm" color="text.muted">
                  Waktu ujian Anda sudah diperbarui dari server dan timer akan mengikuti durasi terbaru.
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer p={6} borderTop="1px solid" borderColor="border.default">
              <Dialog.ActionTrigger asChild>
                <Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" w="full">Mengerti</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
