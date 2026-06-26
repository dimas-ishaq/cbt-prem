import { Badge, Box, Flex, HStack, IconButton, Input, Table, Text } from '@chakra-ui/react';
import { Pencil, Search, Trash2 } from 'lucide-react';
import { TablePagination } from '@/components/ui/pagination';
import type { Major } from '../major-types';

interface MajorsTableProps {
  searchTerm: string;
  majors: Major[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (major: Major) => void;
  onDelete: (major: Major) => void;
}

export function MajorsTable({ searchTerm, majors, totalCount, currentPage, pageSize, onSearchChange, onPageChange, onPageSizeChange, onEdit, onDelete }: MajorsTableProps) {
  return (
    <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
      <Flex p={4} borderBottom="1px solid" borderColor="gray.100" align="center" bg="gray.50">
        <Box position="relative" flex={1} maxW="md">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400"><Search size={18} /></Box>
          <Input pl={10} placeholder="Cari jurusan berdasarkan nama atau kode..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} />
        </Box>
      </Flex>

      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="gray.50">
            {['Kode Jurusan', 'Nama Konsentrasi Keahlian', 'Deskripsi', 'Total Siswa', 'Aksi'].map((header) => (
              <Table.ColumnHeader key={header} px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign={header === 'Aksi' ? 'end' : undefined}>{header}</Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {majors.map((major) => (
            <Table.Row key={major.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
              <Table.Cell px={6} py={4} fontFamily="mono" fontSize="sm" fontWeight="bold" color="indigo.600">{major.code}</Table.Cell>
              <Table.Cell px={6} py={4} fontWeight="semibold" color="gray.900">{major.name}</Table.Cell>
              <Table.Cell px={6} py={4} fontSize="sm" color="gray.500" maxW="xs" truncate>{major.description || '-'}</Table.Cell>
              <Table.Cell px={6} py={4}><Badge colorPalette="blue" variant="subtle" borderRadius="md" px={2} py={0.5}>{major._count?.students || 0} Siswa</Badge></Table.Cell>
              <Table.Cell px={6} py={4} textAlign="end">
                <HStack gap={2} justify="flex-end">
                  <IconButton variant="ghost" color="indigo.600" _hover={{ bg: 'indigo.50' }} size="sm" borderRadius="lg" aria-label="Edit Jurusan" onClick={() => onEdit(major)} cursor="pointer"><Pencil size={18} /></IconButton>
                  <IconButton variant="ghost" color="red.600" _hover={{ bg: 'red.50' }} size="sm" borderRadius="lg" aria-label="Delete Jurusan" onClick={() => onDelete(major)} cursor="pointer"><Trash2 size={18} /></IconButton>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
          {totalCount === 0 && <Table.Row><Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">Tidak ada data jurusan yang ditemukan.</Table.Cell></Table.Row>}
        </Table.Body>
      </Table.Root>
      <TablePagination currentPage={currentPage} totalCount={totalCount} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
    </Box>
  );
}
