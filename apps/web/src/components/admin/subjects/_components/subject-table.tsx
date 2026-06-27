import { Badge, Box, Table, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { TablePagination } from '@/components/ui/pagination';
import { SubjectActions } from './subject-actions';
import type { Subject } from '../subject-types';

interface SubjectTableProps {
  subjects: Subject[];
  filteredCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

export function SubjectTable({ subjects, filteredCount, currentPage, pageSize, onPageChange, onPageSizeChange, onEdit, onDelete }: SubjectTableProps) {
  return (
    <Box bg="bg.surface" borderRadius="card" shadow="card-dark" borderWidth="1px" borderColor="border.default" overflow="hidden">
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row bg="bg.elevated">
            <Table.ColumnHeader px={5} py={4}>Kode</Table.ColumnHeader>
            <Table.ColumnHeader px={5} py={4}>Nama Mata Pelajaran</Table.ColumnHeader>
            <Table.ColumnHeader px={5} py={4}>Guru Pengampu</Table.ColumnHeader>
            <Table.ColumnHeader px={5} py={4}>Deskripsi</Table.ColumnHeader>
            <Table.ColumnHeader px={5} py={4} textAlign="end">Aksi</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {subjects.map((subject) => (
            <Table.Row key={subject.id} _hover={{ bg: 'bg.elevated' }}>
              <Table.Cell px={5} py={4} fontFamily="mono" fontWeight="bold" color="brand.text">{subject.code}</Table.Cell>
              <Table.Cell px={5} py={4} fontWeight="semibold" color="text.primary">{subject.name}</Table.Cell>
              <Table.Cell px={5} py={4}>
                <Wrap>
                  {(subject.teachers || []).length > 0 ? subject.teachers!.map((teacher) => (
                    <WrapItem key={teacher.id}>
                      <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={2} py={1}>{teacher.user?.fullName || teacher.user?.username || teacher.id}</Badge>
                    </WrapItem>
                  )) : <Badge colorPalette="gray" variant="subtle" borderRadius="full">Belum ada guru</Badge>}
                </Wrap>
              </Table.Cell>
              <Table.Cell px={5} py={4} fontSize="sm" color="text.secondary" maxW="xs" truncate>{subject.description || '-'}</Table.Cell>
              <Table.Cell px={5} py={4} textAlign="end"><SubjectActions onEdit={() => onEdit(subject)} onDelete={() => onDelete(subject)} /></Table.Cell>
            </Table.Row>
          ))}
          {filteredCount === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="text.secondary" fontStyle="italic">
                Tidak ada mata pelajaran yang ditemukan.
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
      <TablePagination currentPage={currentPage} totalCount={filteredCount} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
    </Box>
  );
}