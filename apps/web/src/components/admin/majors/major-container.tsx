'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, Text, Button, Stack, Spinner } from '@chakra-ui/react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { Plus } from 'lucide-react';
import { useMajors } from './hooks/use-majors';
import { filterMajors, paginateMajors } from './major-utils';
import type { Major, MajorFormData } from './major-types';
import { MajorFormModal } from './_components/major-form-modal';
import { MajorsTable } from './_components/majors-table';

const emptyForm: MajorFormData = { name: '', code: '', description: '' };

export function MajorContainer() {
  const { user } = useAuthStore();
  const router = useRouter();
  const confirmDialog = useConfirm();

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const [formData, setFormData] = useState<MajorFormData>(emptyForm);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingMajor(null);
  };

  const { majors, isLoading, createMutation, updateMutation, deleteMutation } = useMajors(() => {
    setIsModalOpen(false);
    resetForm();
  });

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setFormData({
      name: major.name,
      code: major.code,
      description: major.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMajor) {
      updateMutation.mutate({ id: editingMajor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredMajors = useMemo(() => filterMajors(majors, searchTerm), [majors, searchTerm]);
  const paginatedMajors = useMemo(
    () => paginateMajors(filteredMajors, currentPage, pageSize),
    [filteredMajors, currentPage, pageSize],
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat data jurusan...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Konsentrasi Keahlian (Jurusan)
          </Heading>
          <Text color="gray.500" mt={1}>
            Kelola daftar jurusan dan konsentrasi keahlian akademik sekolah.
          </Text>
        </Box>
        <Button
          bg="indigo.600"
          color="white"
          _hover={{ bg: 'indigo.700' }}
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="medium"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          cursor="pointer"
        >
          <Plus size={20} style={{ marginRight: '6px' }} />
          Tambah Jurusan
        </Button>
      </Flex>

      <MajorsTable
        searchTerm={searchTerm}
        majors={paginatedMajors}
        totalCount={filteredMajors.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onSearchChange={setSearchTerm}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onEdit={handleEdit}
        onDelete={async (major) => {
          const confirmed = await confirmDialog({
            title: 'Hapus Jurusan',
            description: `Apakah Anda yakin ingin menghapus jurusan "${major.name}"? Siswa yang terikat akan kehilangan asosiasi jurusan.`,
            confirmText: 'Hapus',
          });
          if (confirmed) deleteMutation.mutate(major.id);
        }}
      />
      <MajorFormModal
        isOpen={isModalOpen}
        editingMajor={editingMajor}
        formData={formData}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        onFormChange={setFormData}
      />
    </Stack>
  );
}

