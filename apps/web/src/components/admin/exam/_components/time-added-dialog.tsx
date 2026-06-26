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
          <Dialog.Content borderRadius="2xl" overflow="hidden">
            <Dialog.Header bg="green.50" py={4} borderBottom="1px solid" borderColor="green.100">
              <Dialog.Title fontSize="md" fontWeight="bold" color="green.700" display="flex" alignItems="center" gap={2}>
                <CheckCircle2 size={18} />
                Waktu Ujian Diperpanjang
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body p={6}>
              <Stack gap={3}>
                <Text fontSize="sm" color="gray.700" lineHeight="relaxed">
                  Pengawas telah menambahkan <strong>{minutes} menit</strong> ke waktu ujian Anda.
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Waktu ujian Anda sudah diperbarui dari server dan timer akan mengikuti durasi terbaru.
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer p={6} borderTop="1px solid" borderColor="gray.100">
              <Dialog.ActionTrigger asChild>
                <Button colorPalette="green" borderRadius="lg" w="full">Mengerti</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
