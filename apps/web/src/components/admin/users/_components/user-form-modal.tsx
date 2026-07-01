import { Box, Button, Flex, Heading, IconButton, Input, Select, Stack, Text, Separator } from '@chakra-ui/react';
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
    <Box
      position="fixed"
      inset={0}
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={50}
      p={4}
      bg="blackAlpha.600"
      backdropFilter="blur(4px)"
    >
      <Box bg="bg.surface" borderRadius="card" shadow="2xl" w="full" maxW="lg" border="1px solid" borderColor="border.default">
        <Flex px={6} py={4} borderBottom="1px solid" borderColor="border.default" justify="space-between" align="center">
          <Heading size="md" fontWeight="bold" color="text.primary">
            {mode === 'create' ? '+ Tambah Pengguna Baru' : `Edit: ${selectedUser?.fullName}`}
          </Heading>
          <IconButton variant="ghost" aria-label="Close" onClick={onClose} cursor="pointer" size="sm" color="text.muted" _hover={{ bg: 'bg.subtle' }}>
            <Text fontSize="xl">×</Text>
          </IconButton>
        </Flex>

        <form onSubmit={onSubmit}>
          <Stack gap={4} p={6}>
            {mode === 'create' && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={2}>Role <Box as="span" color="status.danger.text">*</Box></Text>
                <Flex gap={2}>
                  {ROLE_OPTIONS.map(({ label, value }) => (
                    <Button
                      key={value}
                      type="button"
                      onClick={() => onChangeForm({ ...form, role: value })}
                      flex={1}
                      py={2.5}
                      px={2}
                      borderRadius="lg"
                      borderWidth="2px"
                      fontWeight="semibold"
                      fontSize="sm"
                      cursor="pointer"
                      transition="all 0.15s"
                      variant="outline"
                      borderColor={form.role === value ? 'brand.solid' : 'border.default'}
                      bg={form.role === value ? 'brand.subtle' : 'bg.surface'}
                      color={form.role === value ? 'brand.text' : 'text.secondary'}
                      _hover={{ borderColor: 'brand.solid', bg: 'brand.subtle', color: 'brand.text' }}
                    >
                      {label}
                    </Button>
                  ))}
                </Flex>
              </Box>
            )}

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Nama Lengkap <Box as="span" color="status.danger.text">*</Box></Text>
              <Input
                required
                value={form.fullName}
                onChange={(e) => onChangeForm({ ...form, fullName: e.target.value })}
                placeholder="cth. Budi Santoso, S.Pd"
                borderRadius="input"
                borderColor="border.default"
                bg="input.bg"
                _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
              />
            </Box>

            <Flex gap={3}>
              {mode === 'create' && (
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Username <Box as="span" color="status.danger.text">*</Box></Text>
                  <Input
                    required
                    value={form.username}
                    onChange={(e) => onChangeForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="johndoe123"
                    fontFamily="mono"
                    borderRadius="input"
                    borderColor="border.default"
                    bg="input.bg"
                    _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
                  />
                </Box>
              )}
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Email</Text>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChangeForm({ ...form, email: e.target.value })}
                  placeholder="user@sekolah.sch.id"
                  borderRadius="input"
                  borderColor="border.default"
                  bg="input.bg"
                  _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
                />
              </Box>
            </Flex>

            {mode === 'create' && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Password <Box as="span" color="status.danger.text">*</Box></Text>
                <Input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => onChangeForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 karakter"
                  borderRadius="input"
                  borderColor="border.default"
                  bg="input.bg"
                  _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
                />
              </Box>
            )}

            {form.role === 'SISWA' ? (
              <Flex gap={3}>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>NIS (Opsional)</Text>
                  <Input
                    value={form.nis}
                    onChange={(e) => onChangeForm({ ...form, nis: e.target.value })}
                    placeholder="cth. 100234"
                    borderRadius="input"
                    borderColor="border.default"
                    bg="input.bg"
                    _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Rombel / Kelas</Text>
                  <Select.Root collection={rombelOptions} value={form.rombelId ? [form.rombelId] : []} onValueChange={(details) => onChangeForm({ ...form, rombelId: details.value[0] || '' })} positioning={{ sameWidth: true }}>
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger borderRadius="input">
                        <Select.ValueText placeholder="-- Pilih Rombel --" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                        <Select.ClearTrigger />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content>
                        {rombelOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                </Box>
              </Flex>
            ) : (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>NIP (Opsional)</Text>
                <Input
                  value={form.nip}
                  onChange={(e) => onChangeForm({ ...form, nip: e.target.value })}
                  placeholder="cth. 1987654321"
                  borderRadius="input"
                  borderColor="border.default"
                  bg="input.bg"
                  _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
                />
              </Box>
            )}

            <Separator />

            <Flex gap={3} pt={2}>
              <Button type="button" onClick={onClose} flex={1} variant="outline" borderRadius="lg" cursor="pointer" borderColor="border.default" color="text.primary">
                Batal
              </Button>
              <Button type="submit" flex={1} borderRadius="lg" cursor="pointer" bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} loading={isLoading}>
                {mode === 'create' ? 'Buat Akun' : 'Simpan Perubahan'}
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}