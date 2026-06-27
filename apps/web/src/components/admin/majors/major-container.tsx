'use client';

import { Box, Button, Flex, Heading, HStack, Spinner, Stack, Text } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useConfirm } from '@/components/ui/confirmation-dialog';
import { useAuthStore } from '@/store/auth.store';

import { MajorFormModal } from './_components/major-form-modal';
import { MajorsTable } from './_components/majors-table';
import { useMajors } from './hooks/use-majors';
import { filterMajors, paginateMajors } from './major-utils';
import type { Major, MajorFormData } from './major-types';

const emptyForm: MajorFormData = { name: '', code: '', description: '' };

export function MajorContainer() {
  const { user } = useAuthStore();
  const router = useRouter();
  const confirmDialog = useConfirm();

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/admin');
  }, [user, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<MajorFormData>(emptyForm);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingMajor(null);
  };

  const { majors, isLoading, createMutation, updateMutation, deleteMutation } = useMajors(() => {
    setIsModalOpen(false);
    resetForm();
  });

  const filteredMajors = useMemo(() => filterMajors(majors, searchTerm), [majors, searchTerm]);
  const paginatedMajors = useMemo(
    () => paginateMajors(filteredMajors, currentPage, pageSize),
    [filteredMajors, currentPage, pageSize],
  );

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setFormData({ name: major.name, code: major.code, description: major.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMajor) updateMutation.mutate({ id: editingMajor.id, data: formData });
    else createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="brand.primary" />
        <Text ml={3} color="text.secondary">
          Memuat data jurusan...
        </Text>
      </Flex>
    );
  }

  return (
    <Stack
      gap={6}
      p={{ base: 4, md: 6 }}
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="2xl"
      bg="bg.surface"
      shadow="card-dark"
    >
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', lg: 'row' }} gap={4}>
        <Box maxW="2xl">
          <Stack gap={3}>
            <Box>
              <Text
                as="span"
                display="inline-flex"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="semibold"
                letterSpacing="0.08em"
                textTransform="uppercase"
                bg="bg.elevated"
                color="brand.text"
                borderWidth="1px"
                borderColor="border.default"
              >
                Akademik / Kurikulum
              </Text>
            </Box>
            <Heading size="xl" fontWeight="bold" color="text.primary" letterSpacing="-0.03em">
              Konsentrasi Keahlian
            </Heading>
            <Text color="text.secondary" maxW="xl" lineHeight="tall">
              Kelola jurusan dengan tampilan yang lebih cepat dipindai: ringkas, kontras tinggi,
              dan siap untuk pengambilan keputusan operasional.
            </Text>
          </Stack>
        </Box>

        <HStack gap={3} flexWrap="wrap" justify={{ base: 'flex-start', lg: 'flex-end' }}>
          <Box px={4} py={3} borderRadius="xl" bg="bg.elevated" borderWidth="1px" borderColor="border.default">
            <Text fontSize="xs" color="text.secondary" textTransform="uppercase" letterSpacing="0.08em">
              Total jurusan
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="text.primary">
              {majors.length}
            </Text>
          </Box>
          <Box px={4} py={3} borderRadius="xl" bg="bg.elevated" borderWidth="1px" borderColor="border.default">
            <Text fontSize="xs" color="text.secondary" textTransform="uppercase" letterSpacing="0.08em">
              Hasil tampil
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="text.primary">
              {filteredMajors.length}
            </Text>
          </Box>
          <Button
            bg="brand.primary"
            color="on-primary"
            _hover={{ bg: 'brand.primary-hover', transform: 'translateY(-1px)', shadow: 'lg' }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s ease"
            borderRadius="xl"
            px={5}
            py={6}
            fontWeight="semibold"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            cursor="pointer"
            leftIcon={<Plus size={18} />}
          >
            Tambah Jurusan
          </Button>
        </HStack>
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
