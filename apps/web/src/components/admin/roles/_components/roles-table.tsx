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
      <Box bg="bg.surface" p={4} borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default">
        <Flex align="center" position="relative" maxW="md">
          <Box position="absolute" left={3} color="text.muted"><Search size={18} /></Box>
          <Input pl={10} placeholder="Cari role berdasarkan nama atau deskripsi..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} borderRadius="lg" borderColor="border.default" bg="bg.elevated" _focus={{ borderColor: 'brand.text', boxShadow: '0 0 0 1px var(--chakra-colors-brand-text)' }} />
        </Flex>
      </Box>

      <Box bg="bg.surface" borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default" overflow="hidden">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {['Nama Role', 'Deskripsi', 'Status', 'Aksi'].map((header) => (
                <Table.ColumnHeader key={header} px={6} py={4} fontWeight="semibold" color="text.secondary" fontSize="xs" textTransform="uppercase" textAlign={header === 'Aksi' ? 'end' : undefined}>{header}</Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roles.map((role) => (
              <Table.Row key={role.id} _hover={{ bg: 'bg.subtle' }} transition="background 0.15s">
                <Table.Cell px={6} py={4} fontWeight="medium" color="text.primary">
                  <HStack gap={2}><Text>{role.name}</Text>{role.isSystem && <Badge bg="brand.subtle" color="brand.text" borderRadius="full" px={2} py={0.5} fontSize="2xs">Sistem</Badge>}</HStack>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="text.secondary" maxW="sm" truncate>{role.description || '-'}</Table.Cell>
                <Table.Cell px={6} py={4}><Badge bg={role.isActive ? 'status.success.bg' : 'status.danger.bg'} color={role.isActive ? 'status.success.text' : 'status.danger.text'} variant="subtle" borderRadius="md" px={2}>{role.isActive ? 'Aktif' : 'Non-Aktif'}</Badge></Table.Cell>
                <Table.Cell px={6} py={4} textAlign="end">
                  <HStack gap={2} justify="flex-end">
                    <IconButton variant="ghost" color="brand.text" _hover={{ bg: 'brand.subtle' }} size="sm" borderRadius="lg" aria-label="Edit Hak Akses" onClick={() => onEdit(role)} cursor="pointer"><Pencil size={16} /></IconButton>
                    <IconButton variant="ghost" color="brand.text" _hover={{ bg: 'brand.subtle' }} size="sm" borderRadius="lg" aria-label="Duplikasi Role" onClick={() => onClone(role)} cursor="pointer"><Copy size={16} /></IconButton>
                    <IconButton variant="ghost" color="brand.text" _hover={{ bg: 'brand.subtle' }} size="sm" borderRadius="lg" aria-label="Log Audit" onClick={() => onAudit(role.id)} cursor="pointer"><History size={16} /></IconButton>
                    {!role.isSystem && <IconButton variant="ghost" color="status.danger.text" _hover={{ bg: 'status.danger.bg' }} size="sm" borderRadius="lg" aria-label="Delete Role" onClick={() => onDelete(role)} cursor="pointer"><Trash2 size={16} /></IconButton>}
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
            {totalCount === 0 && <Table.Row><Table.Cell colSpan={4} px={6} py={12} textAlign="center" color="text.secondary" fontStyle="italic">Tidak ada role kustom yang ditemukan.</Table.Cell></Table.Row>}
          </Table.Body>
        </Table.Root>
        <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
      </Box>
    </>
  );
}
