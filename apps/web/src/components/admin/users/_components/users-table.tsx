import { Box, Button, Flex, HStack, IconButton, Input, Spinner, Stack, Table, Text } from '@chakra-ui/react';
import { KeyRound, Pencil, Search, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import { TablePagination } from '@/components/ui/pagination';
import type { ActiveTab, UserData } from '../user-types';
import { TABS } from '../user-utils';
import { UserAvatar } from './user-avatar';
import { UserRoleBadge } from './user-role-badge';

interface UsersTableProps {
  activeTab: ActiveTab;
  searchTerm: string;
  counts: Record<ActiveTab, number>;
  users: UserData[];
  filteredCount: number;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  onTabChange: (tab: ActiveTab) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onDelete: (user: UserData) => void;
  onToggleActive: (user: UserData) => void;
}

export function UsersTable({ activeTab, searchTerm, counts, users, filteredCount, isLoading, currentPage, pageSize, onTabChange, onSearchChange, onPageChange, onPageSizeChange, onEdit, onResetPassword, onDelete, onToggleActive }: UsersTableProps) {
  return (
    <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
      <Flex p={4} borderBottom="1px solid" borderColor="gray.100" align="center" gap={3} bg="gray.50" wrap="wrap">
        <Flex gap={1} bg="gray.200" p={1} borderRadius="lg">
          {TABS.map(({ key, label }) => (
            <Button key={key} onClick={() => onTabChange(key)} size="xs" px={3} py={1.5} borderRadius="md" fontSize="xs" fontWeight="medium" bg={activeTab === key ? 'white' : 'transparent'} shadow={activeTab === key ? 'sm' : 'none'} color={activeTab === key ? 'indigo.700' : 'gray.500'} _hover={{ color: 'gray.700' }} cursor="pointer" variant="ghost">
              {label}
              <Box as="span" ml={1} px={1.5} py={0.5} borderRadius="full" fontSize="10px" bg={activeTab === key ? 'indigo.100' : 'gray.300'} color={activeTab === key ? 'indigo.700' : 'gray.500'}>
                {counts[key]}
              </Box>
            </Button>
          ))}
        </Flex>

        <Box position="relative" flex={1} minW="200px" maxW="360px">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400"><Search size={15} /></Box>
          <Input pl={9} placeholder="Cari nama, username, atau email..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} size="sm" borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
        </Box>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" py={16}><Spinner size="lg" color="indigo.600" /></Flex>
      ) : (
        <>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="gray.50">
                {['Pengguna', 'Username', 'Role', 'Info Profil', 'Status', 'Aksi'].map((header) => (
                  <Table.ColumnHeader key={header} px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase" textAlign={header === 'Aksi' ? 'end' : undefined}>{header}</Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((u) => (
                <Table.Row key={u.id} _hover={{ bg: 'gray.50/60' }} transition="background 0.1s">
                  <Table.Cell px={5} py={3}>
                    <HStack gap={3}>
                      <UserAvatar name={u.fullName} role={u.role} />
                      <Box><Text fontWeight="semibold" fontSize="sm" color="gray.900">{u.fullName}</Text><Text fontSize="xs" color="gray.400">{u.email}</Text></Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={5} py={3}><Text fontSize="sm" fontFamily="mono" color="gray.600">{u.username}</Text></Table.Cell>
                  <Table.Cell px={5} py={3}><UserRoleBadge role={u.role} /></Table.Cell>
                  <Table.Cell px={5} py={3}>
                    {u.role === 'SISWA' && u.student ? (
                      <Box><Text fontSize="xs" color="gray.700" fontWeight="medium">NIS: {u.student.nis || '-'}</Text><Text fontSize="xs" color="gray.400">{u.student.rombel?.name || 'Belum ada rombel'} · {u.student.major?.code || 'Belum ada jurusan'}</Text></Box>
                    ) : u.role === 'GURU' && u.teacher ? (
                      <Box><Text fontSize="xs" color="gray.700" fontWeight="medium">NIP: {u.teacher.nip || '-'}</Text><Text fontSize="xs" color="gray.400">{u.teacher.subjects.length > 0 ? u.teacher.subjects.map((s) => s.name).join(', ') : 'Belum ada mapel'}</Text></Box>
                    ) : <Text fontSize="xs" color="gray.400">—</Text>}
                  </Table.Cell>
                  <Table.Cell px={5} py={3}>
                    <IconButton variant="ghost" size="xs" color={u.isActive ? 'green.600' : 'gray.400'} _hover={{ bg: u.isActive ? 'green.50' : 'gray.100' }} borderRadius="lg" aria-label={u.isActive ? 'Nonaktifkan' : 'Aktifkan'} onClick={() => onToggleActive(u)} cursor="pointer" title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                      {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </IconButton>
                  </Table.Cell>
                  <Table.Cell px={5} py={3} textAlign="end">
                    <HStack gap={1} justify="flex-end">
                      <IconButton variant="ghost" size="xs" color="indigo.600" _hover={{ bg: 'indigo.50' }} borderRadius="lg" aria-label="Edit" onClick={() => onEdit(u)} cursor="pointer" title="Edit profil"><Pencil size={14} /></IconButton>
                      <IconButton variant="ghost" size="xs" color="amber.600" _hover={{ bg: 'yellow.50' }} borderRadius="lg" aria-label="Reset Password" onClick={() => onResetPassword(u)} cursor="pointer" title="Reset password"><KeyRound size={14} /></IconButton>
                      <IconButton variant="ghost" size="xs" color="red.600" _hover={{ bg: 'red.50' }} borderRadius="lg" aria-label="Hapus" onClick={() => onDelete(u)} cursor="pointer" title="Hapus pengguna"><Trash2 size={14} /></IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
              {filteredCount === 0 && (
                <Table.Row><Table.Cell colSpan={6} px={6} py={16} textAlign="center"><Stack align="center" gap={2}><Users size={32} color="#d1d5db" /><Text color="gray.400" fontStyle="italic" fontSize="sm">{searchTerm ? 'Tidak ada pengguna yang cocok dengan pencarian' : 'Belum ada data pengguna'}</Text></Stack></Table.Cell></Table.Row>
              )}
            </Table.Body>
          </Table.Root>
          <TablePagination currentPage={currentPage} totalCount={filteredCount} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
        </>
      )}
    </Box>
  );
}
