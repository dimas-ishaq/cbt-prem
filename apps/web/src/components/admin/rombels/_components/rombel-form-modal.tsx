import { Box, Button, Flex, Heading, Input, Select, Stack, Text } from '@chakra-ui/react';
import type { ListCollection } from '@chakra-ui/react';

type MajorOption = {
  label: string;
  value: string;
};

interface RombelFormModalProps {
  isOpen: boolean;
  editingName?: string;
  formData: {
    name: string;
    majorId: string;
  };
  majorOptions: ListCollection<MajorOption>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: { name: string; majorId: string }) => void;
}

export function RombelFormModal({ isOpen, editingName, formData, majorOptions, isSubmitting, onClose, onSubmit, onFormChange }: RombelFormModalProps) {
  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.700" backdropFilter="blur(10px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} p={4}>
      <Box bg="bg.surface" borderRadius="2xl" p={8} w="full" maxW="md" shadow="0 30px 80px rgba(0,0,0,0.55)" borderWidth="1px" borderColor="border.default">
        <Stack gap={2} mb={6}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color="brand.text">Rombongan Belajar</Text>
          <Heading size="lg" fontWeight="bold" color="text.primary">{editingName ? 'Ubah Rombel' : 'Tambah Rombel Baru'}</Heading>
          <Text color="text.secondary" fontSize="sm">Isi nama rombel dan jurusan dengan struktur yang konsisten agar mudah dikelola.</Text>
        </Stack>

        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Nama Rombel / Kelas <Box as="span" color="red.500">*</Box></Text>
              <Input id="rombel-name-input" required value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} placeholder="Contoh: X RPL 1, XI TKJ 2" borderRadius="xl" borderColor="border.default" bg="bg.canvas" color="text.primary" _placeholder={{ color: 'text.secondary' }} _focus={{ borderColor: 'brand.primary', boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)' }} />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Pilih Jurusan <Box as="span" color="red.500">*</Box></Text>
              <Select.Root collection={majorOptions} value={formData.majorId ? [formData.majorId] : []} onValueChange={(details) => onFormChange({ ...formData, majorId: details.value[0] || '' })} positioning={{ sameWidth: true }}>
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger id="rombel-major-select"><Select.ValueText placeholder="-- Pilih Jurusan --" /></Select.Trigger>
                  <Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {majorOptions.items.map((item: MajorOption) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>

            <Flex justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={onClose} borderRadius="xl" borderColor="border.default" color="text.primary" _hover={{ bg: 'bg.elevated' }} cursor="pointer">Batal</Button>
              <Button id="rombel-submit-button" type="submit" bg="brand.primary" color="on-primary" _hover={{ bg: 'brand.primary-hover' }} borderRadius="xl" loading={isSubmitting} cursor="pointer">Simpan</Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

