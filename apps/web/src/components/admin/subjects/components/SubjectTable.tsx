import { Badge, Box, Table, Text, Wrap, WrapItem } from '@chakra-ui/react';
import { TablePagination } from '@/components/ui/pagination';
import { SubjectActions } from './SubjectActions';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  teachers?: { id: string; user?: { fullName: string; username?: string } }[];
  _count?: { teachers: number; questionBanks: number; exams: number };
}

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
    <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
      <Table.Root size="md">
        <Table.Header>
          <Table.Row bg="gray.50">
            <Table.ColumnHeader px={6} py={4}>Kode</Table.ColumnHeader>
            <Table.ColumnHeader px={6} py={4}>Nama Mata Pelajaran</Table.ColumnHeader>
            <Table.ColumnHeader px={6} py={4}>Guru Pengampu</Table.ColumnHeader>
            <Table.ColumnHeader px={6} py={4}>Deskripsi</Table.ColumnHeader>
            <Table.ColumnHeader px={6} py={4} textAlign="end">Aksi</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {subjects.map((subject) => (
            <Table.Row key={subject.id} _hover={{ bg: 'gray.50' }}>
              <Table.Cell px={6} py={4} fontFamily="mono" fontWeight="bold" color="indigo.600">{subject.code}</Table.Cell>
              <Table.Cell px={6} py={4} fontWeight="semibold" color="gray.900">{subject.name}</Table.Cell>
              <Table.Cell px={6} py={4}>
                <Wrap>
                  {(subject.teachers || []).length > 0 ? subject.teachers!.map((teacher) => (
                    <WrapItem key={teacher.id}>
                      <Badge colorPalette="blue" variant="subtle" borderRadius="md" px={2} py={1}>
                        {teacher.user?.fullName || teacher.user?.username || teacher.id}
                      </Badge>
                    </WrapItem>
                  )) : <Badge colorPalette="gray" variant="subtle">Belum ada guru</Badge>}
                </Wrap>
              </Table.Cell>
              <Table.Cell px={6} py={4} fontSize="sm" color="gray.500" maxW="xs" truncate>{subject.description || '-'}</Table.Cell>
              <Table.Cell px={6} py={4} textAlign="end">
                <SubjectActions onEdit={() => onEdit(subject)} onDelete={() => onDelete(subject)} />
              </Table.Cell>
            </Table.Row>
          ))}
          {filteredCount === 0 && (
            <Table.Row>
              <Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
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