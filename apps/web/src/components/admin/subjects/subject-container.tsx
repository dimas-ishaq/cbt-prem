'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, Plus, Upload } from 'lucide-react';
import { Badge, Box, Button, Flex, Heading, HStack, Input, SimpleGrid, Spinner, Stack, Text } from '@chakra-ui/react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { SubjectCardStats } from './_components/subject-card-stats';
import { SubjectSearch } from './_components/subject-search';
import { SubjectTable } from './_components/subject-table';
import { SubjectFormModal } from './_components/subject-form-modal';
import { useSubjects } from './hooks/use-subjects';
import type { Subject, TeacherSummary } from './subject-types';
import { emptySubjectForm } from './subject-types';

type TeacherApiItem = {
  id: string;
  nip: string | null;
  user?: { fullName?: string; username?: string } | null;
};

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

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  useEffect(() => { if (user && user.role !== 'SUPER_ADMIN') router.push('/admin'); }, [user, router]);

  const resetForm = () => { setFormData(emptySubjectForm); setEditingSubject(null); setTeacherSearch(''); };

  const { subjects, isLoading, createMutation, updateMutation, deleteMutation, importMutation } = useSubjects(() => { setIsModalOpen(false); resetForm(); });

  const teacherSearchEnabled = teacherSearch.trim().length >= 3;
  const { data: teacherResults = [], isFetching: isSearchingTeachers } = useQuery<TeacherSummary[]>({
    queryKey: ['teachers', 'search', teacherSearch],
    queryFn: async () => {
      const response = await api.get('/teachers', { params: { search: teacherSearch.trim() } });
      const items = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      return (items as TeacherApiItem[]).map((teacher) => ({ id: teacher.id, nip: teacher.nip, user: teacher.user ?? null }));
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
    setFormData({ name: subject.name, code: subject.code, description: subject.description || '', teacherIds: subject.teachers?.map((teacher) => teacher.id) || [] });
    setTeacherSearch(subject.teachers?.[0]?.user?.fullName || subject.teachers?.[0]?.user?.username || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (editingSubject) { updateMutation.mutate({ id: editingSubject.id, data: formData }); return; } createMutation.mutate(formData); };

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return subjects.filter((subject) => subject.name.toLowerCase().includes(query) || subject.code.toLowerCase().includes(query) || (subject.description || '').toLowerCase().includes(query));
  }, [subjects, searchTerm]);

  const paginatedSubjects = useMemo(() => filteredSubjects.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize), [filteredSubjects, currentPage, pageSize]);
  const totalSubjects = subjects.length;
  const totalRelations = subjects.reduce((acc, subject) => acc + (subject._count?.teachers || 0), 0);
  const subjectsWithTeachers = subjects.filter((subject) => (subject._count?.teachers || 0) > 0).length;

  if (isLoading) return <Flex minH="60vh" justify="center" align="center" bg="bg.canvas"><Spinner size="lg" color="brand.solid" /><Text ml={3} color="text.secondary">{t('loadingSubjects')}</Text></Flex>;

  return (
    <Stack gap={6} bg="bg.canvas" color="text.primary" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 4, md: 6 }}>
      <Box position="relative" overflow="hidden" bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="card" p={{ base: 5, md: 6 }} shadow="card-dark">
        <Box position="absolute" inset="auto -40px -40px auto" boxSize="160px" borderRadius="full" bg="brand.subtle" />
        <Flex position="relative" justify="space-between" align="flex-start" gap={4} wrap="wrap">
          <Box maxW="3xl">
            <Badge colorPalette="purple" variant="subtle" borderRadius="full" px={3} py={1}>Master Data</Badge>
            <Heading size="xl" fontWeight="black" letterSpacing="tight" mt={3}>{t('subjectsTitle')}</Heading>
            <Text color="text.secondary" mt={2}>{t('subjectsDesc')}</Text>
          </Box>
          <HStack gap={3} wrap="wrap">
            <Button as="a" {...({ href: '/templates/subjects-template.csv', download: true } as any)} variant="outline" borderColor="border.default" color="text.primary" bg="bg.elevated" _hover={{ borderColor: 'border.brand' }} borderRadius="full"><Download size={18} style={{ marginRight: '6px' }} />{t('downloadTemplate')}</Button>
            <Button as="label" variant="outline" borderColor="border.default" color="text.primary" bg="bg.elevated" _hover={{ borderColor: 'border.brand' }} borderRadius="full" cursor="pointer"><Upload size={18} style={{ marginRight: '6px' }} />{t('importCsv')}<Input hidden type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} /></Button>
            <Button disabled={!importFile || importMutation.isPending} onClick={() => importFile && importMutation.mutate(importFile)} bg="primary" color="on-primary" _hover={{ bg: 'primary-hover' }} borderRadius="full" cursor="pointer">{t('uploadBtn')}</Button>
            <Button bg="primary" color="on-primary" _hover={{ bg: 'primary-hover' }} borderRadius="full" onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer"><Plus size={20} style={{ marginRight: '6px' }} />{t('addSubject')}</Button>
          </HStack>
        </Flex>
      </Box>

      <SubjectCardStats totalSubjects={totalSubjects} totalRelations={totalRelations} subjectsWithTeachers={subjectsWithTeachers} />
      <SubjectSearch value={searchTerm} onChange={setSearchTerm} />
      <Box bg="bg.surface" borderRadius="card" borderWidth="1px" borderColor="border.default" shadow="card-dark" p={4}>
        <Flex align="center" gap={2} mb={4}><AlertTriangle size={16} color="var(--chakra-colors-warning-500)" /><Text fontSize="sm" color="text.secondary">Gunakan pencarian untuk menemukan mapel, kode, atau deskripsi lebih cepat.</Text></Flex>
        <SubjectTable subjects={paginatedSubjects} filteredCount={filteredSubjects.length} currentPage={currentPage} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} onEdit={handleEdit} onDelete={async (subject) => { const confirmed = await confirmDialog({ title: 'Hapus Mata Pelajaran', description: `Apakah Anda yakin ingin menghapus mata pelajaran "${subject.name}"? Relasi guru dan data turunannya akan ikut terpengaruh.`, confirmText: 'Hapus' }); if (confirmed) deleteMutation.mutate(subject.id); }} />
      </Box>

      <SubjectFormModal isOpen={isModalOpen} editingSubject={editingSubject} formData={formData} teacherSearch={teacherSearch} selectedTeachers={selectedTeachers} isSearchingTeachers={isSearchingTeachers} isSubmitting={createMutation.isPending || updateMutation.isPending} onClose={() => { setIsModalOpen(false); resetForm(); }} onSubmit={handleSubmit} onFormChange={setFormData} onTeacherSearchChange={setTeacherSearch} />
    </Stack>
  );
}

