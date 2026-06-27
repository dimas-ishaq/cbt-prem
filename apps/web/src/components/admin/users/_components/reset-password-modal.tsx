import { Box, Button, Flex, Heading, IconButton, Input, Stack, Text, Separator } from '@chakra-ui/react';
import type { UserData } from '../user-types';

interface ResetPasswordModalProps {
  user: UserData;
  newPassword: string;
  isLoading: boolean;
  onChangePassword: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function ResetPasswordModal({ user, newPassword, isLoading, onChangePassword, onClose, onSubmit }: ResetPasswordModalProps) {
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
      <Box bg="bg.surface" borderRadius="card" shadow="2xl" w="full" maxW="sm" border="1px solid" borderColor="border.default">
        <Flex px={6} py={4} borderBottom="1px solid" borderColor="border.default" justify="space-between" align="center">
          <Box>
            <Heading size="md" fontWeight="bold" color="text.primary">Reset Password</Heading>
            <Text fontSize="sm" color="text.secondary" mt={0.5}>{user.fullName}</Text>
          </Box>
          <IconButton variant="ghost" aria-label="Close" onClick={onClose} cursor="pointer" size="sm" color="text.muted" _hover={{ bg: 'bg.subtle' }}>
            <Text fontSize="xl">×</Text>
          </IconButton>
        </Flex>
        <form onSubmit={onSubmit}>
          <Stack gap={4} p={6}>
            <Box bg="status.warning.bg" borderRadius="lg" p={3} borderWidth="1px" borderColor="status.warning.text">
              <Text fontSize="xs" color="status.warning.text" fontWeight="medium">
                ⚠️ Password baru akan langsung aktif. Infokan kepada pengguna terkait.
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.primary" mb={1}>Password Baru <Box as="span" color="status.danger.text">*</Box></Text>
              <Input
                required
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => onChangePassword(e.target.value)}
                placeholder="Min. 6 karakter"
                borderRadius="input"
                borderColor="border.default"
                bg="input.bg"
                _focus={{ borderColor: 'input.focus.border', boxShadow: '0 0 0 1px var(--chakra-colors-input-focus-border)' }}
              />
            </Box>
            <Separator />
            <Flex gap={3} pt={2}>
              <Button type="button" onClick={onClose} flex={1} variant="outline" borderRadius="lg" cursor="pointer" borderColor="border.default" color="text.primary">
                Batal
              </Button>
              <Button type="submit" flex={1} borderRadius="lg" cursor="pointer" bg="status.warning.text" color="text.inverted" _hover={{ bg: 'status.warning.text' }} loading={isLoading}>
                Reset Password
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}