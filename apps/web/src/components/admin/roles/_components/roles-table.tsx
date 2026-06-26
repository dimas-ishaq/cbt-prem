import { Badge, Box, Flex, HStack, IconButton, Input, Table, Text } from '@chakra-ui/react';
import { Copy, History, Pencil, Search, Trash2 } from 'lucide-react';
import { TablePagination } from '@/components/ui/pagination';
import type { RoleDetail } from '../role-types';

interface RolesTableProps {
  searchTerm: string;
  roles: RoleDetail[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (role: RoleDetail) => void;
  onClone: (role: RoleDetail) => void;
  onAudit: (roleId: string) => void;
  onDelete: (role: RoleDetail) => void;
}

export function RolesTable({ searchTerm, roles, totalCount, currentPage, pageSize, onSearchChange, onPageChange, onPageSizeChange, onEdit, onClone, onAudit, onDelete }: RolesTableProps) {
  return (
    <>
      <Box bg="white" p={4} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
        <Flex align="center" position="relative" maxW="md">
          <Box position="absolute" left={3} color="gray.400"><Search size={18} /></Box>
          <Input pl={10} placeholder="Cari role berdasarkan nama atau deskripsi..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
        </Flex>
      </Box>

      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="gray.50">
              {['Nama Role', 'Deskripsi', 'Status', 'Aksi'].map((header) => (
                <Table.ColumnHeader key={header} px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign={header === 'Aksi' ? 'end' : undefined}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roles.map((role) => (
              <Table.Row key={role.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                <Table.Cell px={6} py={4} fontWeight="medium" color="gray.900">
                  <HStack gap={2}><Text>{role.name}</Text>{role.isSystem && <Badge colorPalette="blue" variant="solid" borderRadius="full" px={2} py={0.5} fontSize="2xs">Sistem</Badge>}</HStack>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.500" maxW="sm" truncate>{role.description || '-'}</Table.Cell>
                <Table.Cell px={6} py={4}><Badge colorPalette={role.isActive ? 'green' : 'red'} variant="subtle" borderRadius="md" px={2}>{role.isActive ? 'Aktif' : 'Non-Aktif'}</Badge></Table.Cell>
                <Table.Cell px={6} py={4} textAlign="end">
                  <HStack gap={2} justify="flex-end">
                    <IconButton variant="ghost" color="indigo.600" _hover={{ bg: 'indigo.50' }} size="sm" borderRadius="lg" aria-label="Edit Hak Akses" onClick={() => onEdit(role)} cursor="pointer"><Pencil size={16} /></IconButton>
                    <IconButton variant="ghost" color="teal.600" _hover={{ bg: 'teal.50' }} size="sm" borderRadius="lg" aria-label="Duplikasi Role" onClick={() => onClone(role)} cursor="pointer"><Copy size={16} /></IconButton>
                    <IconButton variant="ghost" color="purple.600" _hover={{ bg: 'purple.50' }} size="sm" borderRadius="lg" aria-label="Log Audit" onClick={() => onAudit(role.id)} cursor="pointer"><History size={16} /></IconButton>
                    {!role.isSystem && <IconButton variant="ghost" color="red.500" _hover={{ bg: 'red.50' }} size="sm" borderRadius="lg" aria-label="Delete Role" onClick={() => onDelete(role)} cursor="pointer"><Trash2 size={16} /></IconButton>}
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
            {totalCount === 0 && <Table.Row><Table.Cell colSpan={4} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">Tidak ada role kustom yang ditemukan.</Table.Cell></Table.Row>}
          </Table.Body>
        </Table.Root>
        <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
      </Box>
    </>
  );
}
