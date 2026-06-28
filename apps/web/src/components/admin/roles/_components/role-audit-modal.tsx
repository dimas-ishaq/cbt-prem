import { Badge, Box, Button, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { AuditLog } from '../role-types';

interface RoleAuditModalProps {
  logs: AuditLog[];
  isLoading: boolean;
  onClose: () => void;
}

export function RoleAuditModal({ logs, isLoading, onClose }: RoleAuditModalProps) {
  return (
    <Box position="fixed" inset={0} bg="blackAlpha.700" display="flex" alignItems="center" justifyContent="center" zIndex={50} backdropFilter="blur(8px)">
      <Box bg="bg.surface" borderRadius="card" p={6} w="full" maxW="2xl" maxH="80vh" overflowY="auto" shadow="card-dark" border="1px solid" borderColor="border.default">
        <Heading size="lg" fontWeight="bold" mb={4}>Log Audit Perubahan Hak Akses</Heading>
        {isLoading ? (
          <Flex justify="center" py={8}><Spinner color="brand.text" /></Flex>
        ) : (
          <Stack gap={4}>
            {logs.map((log, index) => (
              <Box key={log.id} fontSize="sm" borderTop={index > 0 ? '1px solid' : 'none'} borderColor="border.default" pt={index > 0 ? 4 : 0}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Badge bg={log.actionType === 'ROLE_CREATE' ? 'status.success.bg' : log.actionType === 'ROLE_DELETE' ? 'status.danger.bg' : 'status.warning.bg'} color={log.actionType === 'ROLE_CREATE' ? 'status.success.text' : log.actionType === 'ROLE_DELETE' ? 'status.danger.text' : 'status.warning.text'} borderRadius="md">{log.actionType}</Badge>
                  <Text fontSize="xs" color="text.muted">{new Date(log.createdAt).toLocaleString('id-ID')}</Text>
                </Flex>
                <Text color="text.secondary" mb={2} fontSize="xs">Aktor ID: {log.actorId}</Text>
                {log.payloadBefore && <Box bg="bg.subtle" p={2} borderRadius="md" mb={2}><Text fontWeight="semibold" fontSize="xs" color="text.secondary">Sebelum:</Text><pre style={{ fontSize: '10px', overflowX: 'auto' }}>{JSON.stringify(log.payloadBefore, null, 2)}</pre></Box>}
                {log.payloadAfter && <Box bg="brand.subtle" p={2} borderRadius="md"><Text fontWeight="semibold" fontSize="xs" color="brand.text">Sesudah:</Text><pre style={{ fontSize: '10px', overflowX: 'auto' }}>{JSON.stringify(log.payloadAfter, null, 2)}</pre></Box>}
              </Box>
            ))}
            {logs.length === 0 && <Text py={8} textAlign="center" color="text.secondary" fontStyle="italic">Belum ada log audit untuk role ini.</Text>}
          </Stack>
        )}
        <Flex justify="flex-end" mt={6}><Button bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} onClick={onClose} borderRadius="lg" cursor="pointer">Tutup</Button></Flex>
      </Box>
    </Box>
  );
}
