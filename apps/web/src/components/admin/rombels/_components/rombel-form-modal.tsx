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
    <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={50}>
      <Box bg="white" borderRadius="xl" p={8} w="full" maxW="md" shadow="2xl">
        <Heading size="lg" fontWeight="bold" mb={6}>
          {editingName ? 'Ubah Rombel' : 'Tambah Rombel Baru'}
        </Heading>
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Nama Rombel / Kelas <Box as="span" color="red.500">*</Box>
              </Text>
              <Input
                required
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="Contoh: X RPL 1, XI TKJ 2"
                borderRadius="lg"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Pilih Jurusan <Box as="span" color="red.500">*</Box>
              </Text>
              <Select.Root
                collection={majorOptions}
                value={formData.majorId ? [formData.majorId] : []}
                onValueChange={(details) => onFormChange({ ...formData, majorId: details.value[0] || '' })}
                positioning={{ sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="-- Pilih Jurusan --" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {majorOptions.items.map((item: MajorOption) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>

            <Flex justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={onClose} borderRadius="lg" cursor="pointer">
                Batal
              </Button>
              <Button type="submit" bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" loading={isSubmitting} cursor="pointer">
                Simpan
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
