import { Badge, Box, Button, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import type { AuditLog } from '../role-types';

interface RoleAuditModalProps {
  logs: AuditLog[];
  isLoading: boolean;
  onClose: () => void;
}

export function RoleAuditModal({ logs, isLoading, onClose }: RoleAuditModalProps) {
  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={50}>
      <Box bg="white" borderRadius="xl" p={6} w="full" maxW="2xl" maxH="80vh" overflowY="auto" shadow="2xl">
        <Heading size="lg" fontWeight="bold" mb={4}>Log Audit Perubahan Hak Akses</Heading>
        {isLoading ? (
          <Flex justify="center" py={8}><Spinner color="indigo.600" /></Flex>
        ) : (
          <Stack gap={4}>
            {logs.map((log, index) => (
              <Box key={log.id} fontSize="sm" borderTop={index > 0 ? '1px solid' : 'none'} borderColor="gray.100" pt={index > 0 ? 4 : 0}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Badge colorPalette={log.actionType === 'ROLE_CREATE' ? 'green' : log.actionType === 'ROLE_DELETE' ? 'red' : 'orange'} borderRadius="md">{log.actionType}</Badge>
                  <Text fontSize="xs" color="gray.400">{new Date(log.createdAt).toLocaleString('id-ID')}</Text>
                </Flex>
                <Text color="gray.600" mb={2} fontSize="xs">Aktor ID: {log.actorId}</Text>
                {log.payloadBefore && <Box bg="gray.50" p={2} borderRadius="md" mb={2}><Text fontWeight="semibold" fontSize="xs" color="gray.500">Sebelum:</Text><pre style={{ fontSize: '10px', overflowX: 'auto' }}>{JSON.stringify(log.payloadBefore, null, 2)}</pre></Box>}
                {log.payloadAfter && <Box bg="indigo.50/30" p={2} borderRadius="md"><Text fontWeight="semibold" fontSize="xs" color="indigo.500">Sesudah:</Text><pre style={{ fontSize: '10px', overflowX: 'auto' }}>{JSON.stringify(log.payloadAfter, null, 2)}</pre></Box>}
              </Box>
            ))}
            {logs.length === 0 && <Text py={8} textAlign="center" color="gray.500" fontStyle="italic">Belum ada log audit untuk role ini.</Text>}
          </Stack>
        )}
        <Flex justify="flex-end" mt={6}><Button bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} onClick={onClose} borderRadius="lg" cursor="pointer">Tutup</Button></Flex>
      </Box>
    </Box>
  );
}
