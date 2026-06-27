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

export function MajorsTable({
  searchTerm,
  majors,
  totalCount,
  currentPage,
  pageSize,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}: MajorsTableProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="card"
      shadow="card-dark"
      borderWidth="1px"
      borderColor="border.default"
      overflow="hidden"
    >
      <Flex p={4} borderBottom="1px solid" borderColor="border.default" align="center" bg="bg.elevated">
        <Box position="relative" flex={1} maxW="md">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="text.secondary">
            <Search size={18} />
          </Box>
          <Input
            id="majors-search-input"
            pl={10}
            placeholder="Cari jurusan berdasarkan nama atau kode..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            borderRadius="lg"
            borderColor="border.default"
            bg="bg.canvas"
            color="text.primary"
            _placeholder={{ color: 'text.secondary' }}
            _hover={{ borderColor: 'border.emphasized' }}
            _focus={{ borderColor: 'brand.primary', boxShadow: '0 0 0 1px var(--chakra-colors-brand-primary)' }}
          />
        </Box>
      </Flex>

      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="bg.elevated">
            {['Kode Jurusan', 'Nama Konsentrasi Keahlian', 'Deskripsi', 'Total Siswa', 'Aksi'].map((header) => (
              <Table.ColumnHeader
                key={header}
                px={6}
                py={4}
                fontWeight="semibold"
                color="text.secondary"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="0.08em"
                textAlign={header === 'Aksi' ? 'end' : undefined}
              >
                {header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {majors.map((major) => (
            <Table.Row key={major.id} _hover={{ bg: 'bg.elevated' }} transition="background 0.15s ease">
              <Table.Cell px={6} py={4} fontFamily="mono" fontSize="sm" fontWeight="bold" color="brand.text">
                {major.code}
              </Table.Cell>
              <Table.Cell px={6} py={4} fontWeight="semibold" color="text.primary">
                {major.name}
              </Table.Cell>
              <Table.Cell px={6} py={4} fontSize="sm" color="text.secondary" maxW="xs" truncate>
                {major.description || '-'}
              </Table.Cell>
              <Table.Cell px={6} py={4}>
                <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2} py={1}>
                  {major._count?.students || 0} Siswa
                </Badge>
              </Table.Cell>
              <Table.Cell px={6} py={4} textAlign="end">
                <HStack gap={2} justify="flex-end">
                  <IconButton
                    id={`major-edit-${major.id}`}
                    variant="ghost"
                    color="brand.text"
                    _hover={{ bg: 'bg.canvas' }}
                    size="sm"
                    borderRadius="lg"
                    aria-label="Edit Jurusan"
                    onClick={() => onEdit(major)}
                    cursor="pointer"
                  >
                    <Pencil size={18} />
                  </IconButton>
                  <IconButton
                    id={`major-delete-${major.id}`}
                    variant="ghost"
                    color="red.500"
                    _hover={{ bg: 'red.500/10' }}
                    size="sm"
                    borderRadius="lg"
                    aria-label="Delete Jurusan"
                    onClick={() => onDelete(major)}
                    cursor="pointer"
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
          {totalCount === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="text.secondary" fontStyle="italic">
                Tidak ada data jurusan yang ditemukan.
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>

      <Box borderTop="1px solid" borderColor="border.default">
        <TablePagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </Box>
    </Box>
  );
}

