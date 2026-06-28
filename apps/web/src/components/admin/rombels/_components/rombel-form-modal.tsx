import { Box, Button, Flex, Heading, Input, NativeSelect, Stack, Text } from '@chakra-ui/react';
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
    grade: string;
  };
  majorOptions: ListCollection<MajorOption>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: { name: string; majorId: string; grade: string }) => void;
}

export function RombelFormModal({ isOpen, editingName, formData, majorOptions, isSubmitting, onClose, onSubmit, onFormChange }: RombelFormModalProps) {
  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.700" backdropFilter="blur(10px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} p={4}>
      <Box bg="bg.surface" borderRadius="lg" p={5} w="full" maxW="md" shadow="shadows.elevated" borderWidth="1px" borderColor="border.default">
        <Stack gap={1.5} mb={4}>
          <Text fontSize="2xs" textTransform="uppercase" letterSpacing="0.12em" color="brand.text">Rombongan Belajar</Text>
          <Heading size="md" fontWeight="bold" color="text.primary">{editingName ? 'Ubah Rombel' : 'Tambah Rombel Baru'}</Heading>
          <Text color="text.secondary" fontSize="xs">Isi nama rombel dan jurusan dengan struktur yang konsisten agar mudah dikelola.</Text>
        </Stack>

        <form onSubmit={onSubmit}>
          <Stack gap={3.5}>
            {/* Dropdown Tingkat Kelas dengan Chakra NativeSelect */}
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="text.primary" mb={1}>Tingkat Kelas <Box as="span" color="red.500">*</Box></Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  aria-required="true"
                  value={formData.grade}
                  onChange={(e) => onFormChange({ ...formData, grade: e.target.value })}
                  borderRadius="md"
                  borderColor="border.default"
                  bg="bg.canvas"
                  color="text.primary"
                  _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                >
                  <option value="" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>-- Pilih Tingkat Kelas --</option>
                  <option value="X" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Kelas X</option>
                  <option value="XI" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Kelas XI</option>
                  <option value="XII" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>Kelas XII</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator color="text.secondary" />
              </NativeSelect.Root>
            </Box>

            {/* Nama Rombel (e.g. RPL 1) */}
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="text.primary" mb={1}>Nama Rombel / Kelas (Tanpa Tingkat) <Box as="span" color="red.500">*</Box></Text>
              <Input id="rombel-name-input" required value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} placeholder="Contoh: RPL 1, TKJ 2" borderRadius="md" borderColor="border.default" bg="bg.canvas" color="text.primary" _placeholder={{ color: 'text.secondary' }} _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }} size="sm" />
            </Box>

            {/* Dropdown Jurusan dengan Chakra NativeSelect */}
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="text.primary" mb={1}>Pilih Jurusan <Box as="span" color="red.500">*</Box></Text>
              <NativeSelect.Root size="sm">
                <NativeSelect.Field
                  id="rombel-major-select"
                  aria-required="true"
                  value={formData.majorId}
                  onChange={(e) => onFormChange({ ...formData, majorId: e.target.value })}
                  borderRadius="md"
                  borderColor="border.default"
                  bg="bg.canvas"
                  color="text.primary"
                  _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                >
                  <option value="" style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>-- Pilih Jurusan --</option>
                  {majorOptions.items.map((item: MajorOption) => (
                    <option key={item.value} value={item.value} style={{ backgroundColor: 'var(--chakra-colors-bg-surface)' }}>
                      {item.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="text.secondary" />
              </NativeSelect.Root>
            </Box>

            <Flex justify="flex-end" gap={2.5} pt={3}>
              <Button variant="outline" onClick={onClose} borderRadius="md" borderColor="border.default" color="text.primary" bg="transparent" _hover={{ bg: 'bg.elevated' }} cursor="pointer" size="sm">Batal</Button>
              <Button id="rombel-submit-button" type="submit" bg="brand.primary" color="on-primary" _hover={{ bg: 'brand.primary-hover' }} borderRadius="md" loading={isSubmitting} cursor="pointer" size="sm">Simpan</Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
