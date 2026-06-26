'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { Box, Flex, Heading, Text, Button, Stack, Input, Spinner, HStack } from '@chakra-ui/react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { Plus, Upload, Download } from 'lucide-react';
import { SubjectCardStats } from './_components/subject-card-stats';
import { SubjectSearch } from './_components/subject-search';
import { SubjectTable } from './_components/subject-table';
import { SubjectFormModal } from './_components/subject-form-modal';
import { useSubjects } from './hooks/use-subjects';
import type { Subject, TeacherSummary } from './subject-types';
import { emptySubjectForm } from './subject-types';

export function SubjectContainer() {
  const { user } = useAuthStore();
  const router = useRouter();
  const confirmDialog = useConfirm();
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState(emptySubjectForm);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/admin');
  }, [user, router]);

  const resetForm = () => {
    setFormData(emptySubjectForm);
    setEditingSubject(null);
    setTeacherSearch('');
  };

  const { subjects, isLoading, createMutation, updateMutation, deleteMutation, importMutation } = useSubjects(() => {
    setIsModalOpen(false);
    resetForm();
  });

  const teacherSearchEnabled = teacherSearch.trim().length >= 3;
  const { data: teacherResults = [], isFetching: isSearchingTeachers } = useQuery<TeacherSummary[]>({
    queryKey: ['teachers', 'search', teacherSearch],
    queryFn: async () => {
      const response = await api.get('/teachers', { params: { search: teacherSearch.trim() } });
      return response.data.map((teacher: any) => ({ id: teacher.id, nip: teacher.nip, user: teacher.user }));
    },
    enabled: teacherSearchEnabled,
  });

  const selectedTeachers = useMemo(() => {
    const merged = new Map<string, TeacherSummary>();
    (editingSubject?.teachers || []).forEach((teacher) => merged.set(teacher.id, teacher));
    teacherResults.forEach((teacher) => merged.set(teacher.id, teacher));
    return Array.from(merged.values());
  }, [editingSubject?.teachers, teacherResults]);

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      teacherIds: subject.teachers?.map((teacher) => teacher.id) || [],
    });
    setTeacherSearch(subject.teachers?.[0]?.user?.fullName || subject.teachers?.[0]?.user?.username || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
      return;
    }
    createMutation.mutate(formData);
  };

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return subjects.filter((subject) =>
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query) ||
      (subject.description || '').toLowerCase().includes(query),
    );
  }, [subjects, searchTerm]);

  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, currentPage, pageSize]);

  const totalSubjects = subjects.length;
  const totalRelations = subjects.reduce((acc, subject) => acc + (subject._count?.teachers || 0), 0);
  const subjectsWithTeachers = subjects.filter((subject) => (subject._count?.teachers || 0) > 0).length;

  if (isLoading) {
    return <Flex justify="center" align="center" py={16}><Spinner size="lg" color="indigo.600" /><Text ml={3} color="gray.500">{t('loadingSubjects')}</Text></Flex>;
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center" gap={4} wrap="wrap">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">{t('subjectsTitle')}</Heading>
          <Text color="gray.500" mt={1}>{t('subjectsDesc')}</Text>
        </Box>
        <HStack gap={3} wrap="wrap">
          <Button as="a" {...({ href: '/templates/subjects-template.csv', download: true } as any)} bg="white" borderWidth="1px" borderColor="gray.200" color="gray.700" _hover={{ bg: 'gray.50' }} borderRadius="lg" cursor="pointer"><Download size={18} style={{ marginRight: '6px' }} />{t('downloadTemplate')}</Button>
          <Button as="label" bg="white" borderWidth="1px" borderColor="gray.200" color="gray.700" _hover={{ bg: 'gray.50' }} borderRadius="lg" cursor="pointer"><Upload size={18} style={{ marginRight: '6px' }} />{t('importCsv')}<Input hidden type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} /></Button>
          <Button disabled={!importFile || importMutation.isPending} onClick={() => importFile && importMutation.mutate(importFile)} bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" cursor="pointer">{t('uploadBtn')}</Button>
          <Button bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer"><Plus size={20} style={{ marginRight: '6px' }} />{t('addSubject')}</Button>
        </HStack>
      </Flex>

      <SubjectCardStats totalSubjects={totalSubjects} totalRelations={totalRelations} subjectsWithTeachers={subjectsWithTeachers} />
      <SubjectSearch value={searchTerm} onChange={setSearchTerm} />
      <SubjectTable
        subjects={paginatedSubjects}
        filteredCount={filteredSubjects.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onEdit={handleEdit}
        onDelete={async (subject) => {
          const confirmed = await confirmDialog({
            title: 'Hapus Mata Pelajaran',
            description: `Apakah Anda yakin ingin menghapus mata pelajaran "${subject.name}"? Relasi guru dan data turunannya akan ikut terpengaruh.`,
            confirmText: 'Hapus',
          });
          if (confirmed) deleteMutation.mutate(subject.id);
        }}
      />
      <SubjectFormModal
        isOpen={isModalOpen}
        editingSubject={editingSubject}
        formData={formData}
        teacherSearch={teacherSearch}
        selectedTeachers={selectedTeachers}
        isSearchingTeachers={isSearchingTeachers}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        onFormChange={setFormData}
        onTeacherSearchChange={setTeacherSearch}
      />
    </Stack>
  );
}
