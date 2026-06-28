import { Box, Button, Flex, Grid, Heading, Input, Select, Stack, Text, Textarea } from '@chakra-ui/react';
import type { Menu, RoleDetail, SubMenu } from '../role-types';
import { PermissionMatrix } from './permission-matrix';

interface RoleFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface RoleFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'clone';
  selectedRole: RoleDetail | null;
  formData: RoleFormData;
  statusOptions: any;
  matrix: Menu[];
  matrixSearch: string;
  selectedPermissionIds: string[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: RoleFormData) => void;
  onMatrixSearchChange: (value: string) => void;
  onPermissionToggle: (permissionId: string) => void;
  onSelectMenuAll: (menu: Menu, isSelected: boolean) => void;
  onSelectSubMenuAll: (subMenu: SubMenu, isSelected: boolean) => void;
}

export function RoleFormModal({ isOpen, mode, selectedRole, formData, statusOptions, matrix, matrixSearch, selectedPermissionIds, isSubmitting, onClose, onSubmit, onFormChange, onMatrixSearchChange, onPermissionToggle, onSelectMenuAll, onSelectSubMenuAll }: RoleFormModalProps) {
  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.700" display="flex" alignItems="center" justifyContent="center" zIndex={50} py={6} backdropFilter="blur(8px)">
      <Box bg="bg.surface" borderRadius="card" p={6} w="full" maxW="4xl" maxH="90vh" overflowY="auto" shadow="card-dark" position="relative" border="1px solid" borderColor="border.default">
        <Heading size="lg" fontWeight="bold" mb={4}>
          {mode === 'create' && 'Buat Role Baru'}
          {mode === 'edit' && `Ubah Role: ${selectedRole?.name}`}
          {mode === 'clone' && `Duplikasi Role: ${selectedRole?.name}`}
        </Heading>

        <form onSubmit={onSubmit}>
          <Stack gap={6}>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Nama Role <Box as="span" color="status.danger.text">*</Box></Text>
                <Input required value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} placeholder="Contoh: Pengawas Ujian Piket" borderRadius="lg" />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Status Peran</Text>
                <Select.Root collection={statusOptions} value={[formData.isActive ? 'true' : 'false']} onValueChange={(details) => onFormChange({ ...formData, isActive: details.value[0] === 'true' })} positioning={{ sameWidth: true }}>
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger><Select.ValueText placeholder="Pilih status" /></Select.Trigger>
                    <Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {statusOptions.items.map((item: any) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Box>
            </Grid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Deskripsi Ringkas</Text>
              <Textarea value={formData.description} onChange={(e) => onFormChange({ ...formData, description: e.target.value })} placeholder="Tulis tujuan hak akses role ini dibuat..." borderRadius="lg" rows={2} />
            </Box>

            {mode !== 'clone' && (
              <PermissionMatrix
                matrix={matrix}
                searchTerm={matrixSearch}
                selectedPermissionIds={selectedPermissionIds}
                onSearchChange={onMatrixSearchChange}
                onPermissionToggle={onPermissionToggle}
                onSelectMenuAll={onSelectMenuAll}
                onSelectSubMenuAll={onSelectSubMenuAll}
              />
            )}

            <Flex justify="flex-end" gap={3} borderTop="1px solid" borderColor="border.default" pt={4}>
              <Button variant="outline" onClick={onClose} borderRadius="lg" cursor="pointer">Batal</Button>
              <Button type="submit" bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} borderRadius="lg" loading={isSubmitting} cursor="pointer">Simpan Perubahan</Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
