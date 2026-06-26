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
    <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={50}>
      <Box bg="white" borderRadius="xl" p={8} w="full" maxW="md" shadow="2xl">
        <Heading size="lg" fontWeight="bold" mb={6}>{editingMajor ? 'Ubah Konsentrasi Keahlian' : 'Tambah Jurusan Baru'}</Heading>
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Kode Jurusan <Box as="span" color="red.500">*</Box></Text>
              <Input required value={formData.code} onChange={(e) => onFormChange({ ...formData, code: e.target.value })} placeholder="e.g. RPL, TKJ, MM" borderRadius="lg" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Nama Jurusan <Box as="span" color="red.500">*</Box></Text>
              <Input required value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} placeholder="e.g. Rekayasa Perangkat Lunak" borderRadius="lg" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Deskripsi Ringkas</Text>
              <Textarea value={formData.description} onChange={(e) => onFormChange({ ...formData, description: e.target.value })} placeholder="Keterangan mengenai konsentrasi keahlian..." borderRadius="lg" rows={3} />
            </Box>
            <Flex justify="flex-end" gap={3} pt={4}>
              <Button variant="outline" onClick={onClose} borderRadius="lg" cursor="pointer">Batal</Button>
              <Button type="submit" bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" loading={isSubmitting} cursor="pointer">Simpan</Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
