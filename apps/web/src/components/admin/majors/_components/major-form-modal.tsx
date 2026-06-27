import { Box, Button, Flex, Heading, Input, Stack, Text, Textarea } from '@chakra-ui/react';

import type { Major, MajorFormData } from '../major-types';

interface MajorFormModalProps {
  isOpen: boolean;
  editingMajor: Major | null;
  formData: MajorFormData;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: MajorFormData) => void;
}

export function MajorFormModal({ isOpen, editingMajor, formData, isSubmitting, onClose, onSubmit, onFormChange }: MajorFormModalProps) {
  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.700" backdropFilter="blur(10px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} p={4}>
      <Box bg="bg.surface" borderRadius="2xl" p={8} w="full" maxW="md" shadow="0 30px 80px rgba(0,0,0,0.55)" borderWidth="1px" borderColor="border.default">
        <Stack gap={2} mb={6}>
          <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.12em" color="brand.text">
            Konsentrasi Keahlian
          </Text>
          <Heading size="lg" fontWeight="bold" color="text.primary">
            {editingMajor ? 'Ubah Konsentrasi Keahlian' : 'Tambah Jurusan Baru'}
          </Heading>
          <Text color="text.secondary" fontSize="sm">
            Isi data inti jurusan dengan format yang ringkas dan konsisten.
          </Text>
        </Stack>

        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>
                Kode Jurusan <Box as="span" color="red.500">*</Box>
              </Text>
              <Input
                id="major-code-input"
                required
                value={formData.code}
                onChange={(e) => onFormChange({ ...formData, code: e.target.value })}
                placeholder="e.g. RPL, TKJ, MM"
                borderRadius="xl"
                borderColor="border.default"
                bg="bg.canvas"
                color="text.primary"
                _placeholder={{ color: 'text.secondary' }}
                _focus={{ borderColor: 'brand.primary', boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)' }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>
                Nama Jurusan <Box as="span" color="red.500">*</Box>
              </Text>
              <Input
                id="major-name-input"
                required
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="e.g. Rekayasa Perangkat Lunak"
                borderRadius="xl"
                borderColor="border.default"
                bg="bg.canvas"
                color="text.primary"
                _placeholder={{ color: 'text.secondary' }}
                _focus={{ borderColor: 'brand.primary', boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)' }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>
                Deskripsi Ringkas
              </Text>
              <Textarea
                id="major-description-input"
                value={formData.description}
                onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                placeholder="Keterangan mengenai konsentrasi keahlian..."
                borderRadius="xl"
                borderColor="border.default"
                bg="bg.canvas"
                color="text.primary"
                _placeholder={{ color: 'text.secondary' }}
                _focus={{ borderColor: 'brand.primary', boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)' }}
                rows={3}
              />
            </Box>
            <Flex justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={onClose} borderRadius="xl" borderColor="border.default" color="text.primary" _hover={{ bg: 'bg.elevated' }} cursor="pointer">
                Batal
              </Button>
              <Button
                id="major-submit-button"
                type="submit"
                bg="brand.primary"
                color="on-primary"
                _hover={{ bg: 'brand.primary-hover' }}
                borderRadius="xl"
                loading={isSubmitting}
                cursor="pointer"
              >
                Simpan
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

