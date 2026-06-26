import { Box, Button, Flex, Heading, IconButton, Input, Stack, Text } from '@chakra-ui/react';
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
    <Box position="fixed" inset={0} display="flex" alignItems="center" justifyContent="center" zIndex={50} p={4} style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <Box bg="white" borderRadius="2xl" shadow="2xl" w="full" maxW="sm" overflow="hidden">
        <Flex px={6} py={4} borderBottom="1px solid" borderColor="gray.100" justify="space-between" align="center">
          <Box>
            <Heading size="md" fontWeight="bold" color="gray.900">Reset Password</Heading>
            <Text fontSize="sm" color="gray.500" mt={0.5}>{user.fullName}</Text>
          </Box>
          <IconButton variant="ghost" aria-label="Close" onClick={onClose} cursor="pointer" size="sm">
            <Text fontSize="xl" color="gray.400">×</Text>
          </IconButton>
        </Flex>
        <form onSubmit={onSubmit}>
          <Stack gap={4} p={6}>
            <Box bg="amber.50" borderRadius="lg" p={3} borderWidth="1px" borderColor="amber.200">
              <Text fontSize="xs" color="amber.800" fontWeight="medium">
                ⚠️ Password baru akan langsung aktif. Infokan kepada pengguna terkait.
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Password Baru <span style={{ color: 'red' }}>*</span></Text>
              <Input required type="password" minLength={6} value={newPassword} onChange={(e) => onChangePassword(e.target.value)} placeholder="Min. 6 karakter" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
            </Box>
            <Flex gap={3} pt={2}>
              <Button type="button" onClick={onClose} flex={1} variant="outline" borderRadius="lg" cursor="pointer">Batal</Button>
              <Button type="submit" flex={1} bg="amber.500" color="white" _hover={{ bg: 'amber.600' }} borderRadius="lg" cursor="pointer" loading={isLoading}>Reset Password</Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
