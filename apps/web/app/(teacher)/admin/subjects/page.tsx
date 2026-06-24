'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import {
  Box, Flex, Heading, Text, Button, Table, Stack, Input, Textarea, Spinner, IconButton, HStack, Badge, SimpleGrid, Wrap, WrapItem, Checkbox,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { Plus, Pencil, Trash2, Search, BookOpen, GraduationCap, Link2, Upload, Download } from 'lucide-react';

interface TeacherSummary {
  id: string;
  nip?: string | null;
  user?: { fullName: string; username?: string };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  teachers?: TeacherSummary[];
  _count?: { teachers: number; questionBanks: number; exams: number };
}

const emptyForm = { name: '', code: '', description: '', teacherIds: [] as string[] };

export default function SubjectsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [importFile, setImportFile] = useState<File | null>(null);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/admin');
  }, [user, router]);

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return Array.isArray(response.data) ? response.data : response.data?.data || [];
    },
  });

  const teacherSearchEnabled = teacherSearch.trim().length >= 3;
  const { data: teacherResults, isFetching: isSearchingTeachers } = useQuery<TeacherSummary[]>({
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
    (teacherResults || []).forEach((teacher) => merged.set(teacher.id, teacher));
    return Array.from(merged.values());
  }, [editingSubject?.teachers, teacherResults]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(t('subjectCreateSuccess'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('subjectCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => api.put(`/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsModalOpen(false);
      resetForm();
      toast.success(t('subjectUpdateSuccess'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('subjectUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(t('subjectDeleteSuccess'));
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('subjectDeleteError')),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.post('/subjects/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setImportFile(null);
      toast.success(t('subjectImportSuccess', { count: res.data.importedCount }));
    },
    onError: (err: any) => {
      const payload = err.response?.data;
      if (payload?.errors?.length) {
        toast.error(payload.errors[0]);
      } else {
        toast.error(payload?.message || t('subjectImportError'));
      }
    },
  });

  const resetForm = () => { setFormData(emptyForm); setEditingSubject(null); setTeacherSearch(''); };
  const handleEdit = (subject: Subject) => { setEditingSubject(subject); setFormData({ name: subject.name, code: subject.code, description: subject.description || '', teacherIds: subject.teachers?.map((t) => t.id) || [] }); setTeacherSearch(subject.teachers?.[0]?.user?.fullName || subject.teachers?.[0]?.user?.username || ''); setIsModalOpen(true); };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); editingSubject ? updateMutation.mutate({ id: editingSubject.id, data: formData }) : createMutation.mutate(formData); };
  const rawSubjects = subjects as unknown;
  const subjectList = Array.isArray(rawSubjects)
    ? rawSubjects
    : Array.isArray((rawSubjects as { data?: unknown[] } | null)?.data)
      ? ((rawSubjects as { data?: unknown[] }).data || [])
      : [];

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return subjectList.filter((subject) =>
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query) ||
      (subject.description || '').toLowerCase().includes(query),
    );
  }, [subjectList, searchTerm]);

  const totalSubjects = subjectList.length;
  const totalRelations = subjectList.reduce((acc, subject) => acc + (subject._count?.teachers || 0), 0);
  const subjectsWithTeachers = subjectList.filter((subject) => (subject._count?.teachers || 0) > 0).length;

  if (isLoading) return <Flex justify="center" align="center" py={16}><Spinner size="lg" color="indigo.600" /><Text ml={3} color="gray.500">{t('loadingSubjects')}</Text></Flex>;

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center" gap={4} wrap="wrap">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">{t('subjectsTitle')}</Heading>
          <Text color="gray.500" mt={1}>{t('subjectsDesc')}</Text>
        </Box>
        <HStack gap={3} wrap="wrap">
          <Button as="a" {...({ href: "/templates/subjects-template.csv", download: true } as any)} bg="white" borderWidth="1px" borderColor="gray.200" color="gray.700" _hover={{ bg: 'gray.50' }} borderRadius="lg" cursor="pointer"><Download size={18} style={{ marginRight: '6px' }} />{t('downloadTemplate')}</Button>
          <Button as="label" bg="white" borderWidth="1px" borderColor="gray.200" color="gray.700" _hover={{ bg: 'gray.50' }} borderRadius="lg" cursor="pointer"><Upload size={18} style={{ marginRight: '6px' }} />{t('importCsv')}<Input hidden type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} /></Button>
          <Button disabled={!importFile || importMutation.isPending} onClick={() => importFile && importMutation.mutate(importFile)} bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" cursor="pointer">{t('uploadBtn')}</Button>
          <Button bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" onClick={() => { resetForm(); setIsModalOpen(true); }} cursor="pointer"><Plus size={20} style={{ marginRight: '6px' }} />{t('addSubject')}</Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm"><Flex align="center" gap={4}><Box p={3} bg="indigo.50" borderRadius="lg" color="indigo.600"><BookOpen size={24} /></Box><Box><Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">Total Mapel</Text><Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>{totalSubjects}</Text></Box></Flex></Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm"><Flex align="center" gap={4}><Box p={3} bg="teal.50" borderRadius="lg" color="teal.600"><Link2 size={24} /></Box><Box><Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">Relasi Guru</Text><Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>{totalRelations}</Text></Box></Flex></Box>
        <Box bg="white" p={5} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm"><Flex align="center" gap={4}><Box p={3} bg="orange.50" borderRadius="lg" color="orange.600"><GraduationCap size={24} /></Box><Box><Text fontSize="xs" color="gray.500" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">Mapel Terhubung</Text><Text fontSize="2xl" fontWeight="bold" color="gray.900" mt={1}>{subjectsWithTeachers}</Text></Box></Flex></Box>
      </SimpleGrid>

      <Box bg="white" p={4} borderRadius="xl" borderWidth="1px" borderColor="gray.100" shadow="sm"><Box position="relative"><Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none"><Search size={18} /></Box><Input placeholder="Cari mata pelajaran berdasarkan nama, kode, atau deskripsi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} pl={10} borderRadius="lg" borderColor="gray.200" _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }} /></Box></Box>

      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Table.Root size="md">
          <Table.Header><Table.Row bg="gray.50"><Table.ColumnHeader px={6} py={4}>Kode</Table.ColumnHeader><Table.ColumnHeader px={6} py={4}>Nama Mata Pelajaran</Table.ColumnHeader><Table.ColumnHeader px={6} py={4}>Guru Pengampu</Table.ColumnHeader><Table.ColumnHeader px={6} py={4}>Deskripsi</Table.ColumnHeader><Table.ColumnHeader px={6} py={4} textAlign="end">Aksi</Table.ColumnHeader></Table.Row></Table.Header>
          <Table.Body>
            {filteredSubjects.map((subject) => (
              <Table.Row key={subject.id} _hover={{ bg: 'gray.50' }}>
                <Table.Cell px={6} py={4} fontFamily="mono" fontWeight="bold" color="indigo.600">{subject.code}</Table.Cell>
                <Table.Cell px={6} py={4} fontWeight="semibold" color="gray.900">{subject.name}</Table.Cell>
                <Table.Cell px={6} py={4}><Wrap>{(subject.teachers || []).length > 0 ? subject.teachers!.map((teacher: any) => <WrapItem key={teacher.id}><Badge colorPalette="blue" variant="subtle" borderRadius="md" px={2} py={1}>{teacher.user?.fullName || teacher.user?.username || teacher.id}</Badge></WrapItem>) : <Badge colorPalette="gray" variant="subtle">Belum ada guru</Badge>}</Wrap></Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.500" maxW="xs" truncate>{subject.description || '-'}</Table.Cell>
                <Table.Cell px={6} py={4} textAlign="end"><HStack gap={2} justify="flex-end"><IconButton aria-label="Edit mata pelajaran" variant="ghost" color="indigo.600" _hover={{ bg: 'indigo.50' }} size="sm" borderRadius="lg" onClick={() => handleEdit(subject)} cursor="pointer"><Pencil size={18} /></IconButton><IconButton aria-label="Delete mata pelajaran" variant="ghost" color="red.600" _hover={{ bg: 'red.50' }} size="sm" borderRadius="lg" onClick={async () => { const confirmed = await confirmDialog({ title: 'Hapus Mata Pelajaran', description: `Apakah Anda yakin ingin menghapus mata pelajaran "${subject.name}"? Relasi guru dan data turunannya akan ikut terpengaruh.`, confirmText: 'Hapus' }); if (confirmed) deleteMutation.mutate(subject.id); }} cursor="pointer"><Trash2 size={18} /></IconButton></HStack></Table.Cell>
              </Table.Row>
            ))}
            {filteredSubjects.length === 0 && <Table.Row><Table.Cell colSpan={5} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">Tidak ada mata pelajaran yang ditemukan.</Table.Cell></Table.Row>}
          </Table.Body>
        </Table.Root>
      </Box>

      {isModalOpen && (<Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={50} px={4}><Box bg="white" borderRadius="xl" p={8} w="full" maxW="lg" shadow="2xl"><Heading size="lg" fontWeight="bold" mb={6}>{editingSubject ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}</Heading><form onSubmit={handleSubmit}><Stack gap={4}><Box><Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Kode <span style={{ color: 'red' }}>*</span></Text><Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="MTK" borderRadius="lg" /></Box><Box><Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Nama <span style={{ color: 'red' }}>*</span></Text><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Matematika" borderRadius="lg" /></Box><Box><Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Deskripsi</Text><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi singkat..." borderRadius="lg" rows={3} /></Box><Box><Flex justify="space-between" align="center" mb={2}><Text fontSize="sm" fontWeight="medium" color="gray.700">Guru Pengampu</Text><Text fontSize="xs" color="gray.500">Ketik minimal 3 karakter</Text></Flex><Input value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} placeholder="Cari nama guru / username..." borderRadius="lg" pl={10} /><Box position="relative" mt={2}><Box position="absolute" left={3} top={3} color="gray.400"><Search size={16} /></Box></Box>{teacherSearchEnabled && (<Box mt={3} borderWidth="1px" borderColor="gray.200" borderRadius="lg" maxH="260px" overflowY="auto"><Stack gap={0}>{isSearchingTeachers ? <Box px={4} py={3}><Text fontSize="sm" color="gray.500">Mencari guru...</Text></Box> : selectedTeachers.map((teacher) => { const checked = formData.teacherIds.includes(teacher.id); return (<Box key={teacher.id} px={4} py={3} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }} bg={checked ? 'indigo.50' : 'white'}><Checkbox.Root checked={checked} onCheckedChange={(details) => setFormData({ ...formData, teacherIds: details.checked ? [...formData.teacherIds, teacher.id] : formData.teacherIds.filter((id) => id !== teacher.id) })}><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label><Stack gap={0}><Text fontWeight="medium" color="gray.800">{teacher.user?.fullName || teacher.user?.username || teacher.id}</Text><Text fontSize="xs" color="gray.500">Username: {teacher.user?.username || '-'}{teacher.nip ? ` • NIP: ${teacher.nip}` : ' • NIP: -'}</Text></Stack></Checkbox.Label></Checkbox.Root></Box>); })}</Stack></Box>)}{teacherSearchEnabled && !isSearchingTeachers && selectedTeachers.length === 0 && <Text mt={2} fontSize="sm" color="gray.500">Tidak ada guru yang cocok.</Text>}<Wrap mt={3}>{formData.teacherIds.map((id) => { const teacher = selectedTeachers.find((item) => item.id === id); return teacher ? <WrapItem key={id}><Badge colorPalette="indigo" variant="subtle" borderRadius="md" px={2} py={1}>{teacher.user?.fullName || teacher.user?.username || teacher.id}</Badge></WrapItem> : null; })}</Wrap></Box><Flex gap={3} pt={4}><Button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} flex={1} variant="outline" borderRadius="lg" cursor="pointer">Batal</Button><Button type="submit" flex={1} bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" cursor="pointer" loading={createMutation.isPending || updateMutation.isPending}>Simpan</Button></Flex></Stack></form></Box></Box>)}
    </Stack>
  );
}
