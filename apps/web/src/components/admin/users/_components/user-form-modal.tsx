import { Box, Button, Flex, Heading, IconButton, Input, Select, Stack, Text } from '@chakra-ui/react';
import type { ListCollection } from '@chakra-ui/react';
import type { UserData, UserFormData } from '../user-types';
import { ROLE_OPTIONS } from '../user-utils';

type UserModalMode = 'create' | 'edit';

interface UserFormModalProps {
  mode: UserModalMode;
  selectedUser: UserData | null;
  form: UserFormData;
  rombelOptions: ListCollection<{ label: string; value: string }>;
  isLoading: boolean;
  onChangeForm: (form: UserFormData) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function UserFormModal({ mode, selectedUser, form, rombelOptions, isLoading, onChangeForm, onClose, onSubmit }: UserFormModalProps) {
  return (
    <Box position="fixed" inset={0} display="flex" alignItems="center" justifyContent="center" zIndex={50} p={4} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <Box bg="white" borderRadius="2xl" shadow="2xl" w="full" maxW="lg" overflow="hidden">
        <Flex px={6} py={4} borderBottom="1px solid" borderColor="gray.100" justify="space-between" align="center">
          <Heading size="md" fontWeight="bold" color="gray.900">
            {mode === 'create' ? '+ Tambah Pengguna Baru' : `Edit: ${selectedUser?.fullName}`}
          </Heading>
          <IconButton variant="ghost" aria-label="Close" onClick={onClose} cursor="pointer" size="sm">
            <Text fontSize="xl" color="gray.400">×</Text>
          </IconButton>
        </Flex>

        <form onSubmit={onSubmit}>
          <Stack gap={4} p={6}>
            {mode === 'create' && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>Role <span style={{ color: 'red' }}>*</span></Text>
                <Flex gap={2}>
                  {ROLE_OPTIONS.map(({ label, value }) => (
                    <Button key={value} type="button" onClick={() => onChangeForm({ ...form, role: value })} flex={1} py={2.5} px={2} borderRadius="lg" borderWidth="2px" fontWeight="semibold" fontSize="sm" cursor="pointer" transition="all 0.15s" variant="outline" borderColor={form.role === value ? 'indigo.500' : 'gray.200'} bg={form.role === value ? 'indigo.50' : 'white'} color={form.role === value ? 'indigo.700' : 'gray.500'} _hover={{ borderColor: 'indigo.400', bg: 'indigo.50', color: 'indigo.700' }}>
                      {label}
                    </Button>
                  ))}
                </Flex>
              </Box>
            )}

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Nama Lengkap <span style={{ color: 'red' }}>*</span></Text>
              <Input required value={form.fullName} onChange={(e) => onChangeForm({ ...form, fullName: e.target.value })} placeholder="cth. Budi Santoso, S.Pd" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
            </Box>

            <Flex gap={3}>
              {mode === 'create' && (
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Username <span style={{ color: 'red' }}>*</span></Text>
                  <Input required value={form.username} onChange={(e) => onChangeForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} placeholder="johndoe123" fontFamily="mono" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
                </Box>
              )}
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Email</Text>
                <Input type="email" value={form.email} onChange={(e) => onChangeForm({ ...form, email: e.target.value })} placeholder="user@sekolah.sch.id" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
              </Box>
            </Flex>

            {mode === 'create' && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Password <span style={{ color: 'red' }}>*</span></Text>
                <Input required type="password" value={form.password} onChange={(e) => onChangeForm({ ...form, password: e.target.value })} placeholder="Min. 6 karakter" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
              </Box>
            )}

            {form.role === 'SISWA' && (
              <Flex gap={3}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>NIS (Opsional)</Text>
                  <Input value={form.nis} onChange={(e) => onChangeForm({ ...form, nis: e.target.value })} placeholder="cth. 100234" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Rombel / Kelas</Text>
                  <Select.Root collection={rombelOptions} value={form.rombelId ? [form.rombelId] : []} onValueChange={(details) => onChangeForm({ ...form, rombelId: details.value[0] || '' })} positioning={{ sameWidth: true }}>
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger><Select.ValueText placeholder="-- Pilih Rombel --" /></Select.Trigger>
                      <Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {rombelOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Box>
              </Flex>
            )}

            <Flex gap={3} pt={2}>
              <Button type="button" onClick={onClose} flex={1} variant="outline" borderRadius="lg" cursor="pointer">Batal</Button>
              <Button type="submit" flex={1} bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" cursor="pointer" loading={isLoading}>
                {mode === 'create' ? 'Buat Akun' : 'Simpan Perubahan'}
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
