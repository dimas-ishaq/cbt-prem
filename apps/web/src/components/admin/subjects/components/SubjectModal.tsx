import { Box, Button, Form, IconButton, Spinner, SimpleGrid, Text, Textarea, Input } from '@chakra-ui/react';
import { Plus, Pencil, Trash2, Search, Upload, Download } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';
import { SubjectActions } from './SubjectActions';
import { SubjectSearch } from './SubjectSearch';

interface Teacher {
  id: string;
  user?: { fullName: string; username?: string };
  nip?: string;
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  teacherIds: string[];
}

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSubject?: any; // Subject or null
}

export function SubjectModal({ isOpen, onClose, editingSubject }: SubjectModalProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    description: '',
    teacherIds: [],
  });
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherResults, setTeacherResults] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<Teacher[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', code: '', description: '', teacherIds: [] });
      setTeacherSearch('');
      setSelectedTeachers([]);
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '', teacherIds: [] });
    setTeacherSearch('');
    setSelectedTeachers([]);
  };

  const handleEdit = (subject: any) => {
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description ?? '',
      teacherIds: subject.teachers?.map((t: any) => t.id) ?? [],
    });
    setTeacherSearch(subject.teachers?.[0]?.user?.fullName ?? '');
    setSelectedTeachers(subject.teachers ?? []);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalSubmitting(true);
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, formData);
        toast.success(t('subjectUpdateSuccess'));
      } else {
        await api.post('/subjects', formData);
        toast.success(t('subjectCreateSuccess'));
      }
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('subjectError'));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) => api.post('/subjects', data),
    onSuccess: () => {
      resetForm();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('subjectError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) => api.put(`/subjects/${id}`, data),
    onSuccess: () => {
      resetForm();
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || t('subjectError')),
  });

  const handleTeacherSelect = (teacher: Teacher, checked: boolean) => {
    setSelectedTeachers((prev) => {
      const next = checked ? [...prev, teacher] : prev.filter((t) => t.id !== teacher.id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!importFile) return;
    const form = new FormData();
    form.append('file', importFile);
    setIsModalSubmitting(true);
    try {
      const res = await api.post('/subjects/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(t('subjectImportSuccess', { count: res.data.importedCount }));
      setImportFile(null);
    } catch (err: any) {
      const payload = err.response?.data;
      if (payload?.errors?.length) {
        toast.error(payload.errors[0]);
      } else {
        toast.error(payload?.message || t('subjectImportError'));
      }
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const teacherSearchEnabled = teacherSearch.trim().length >= 3;
  const { data: teacherResults: fetchedTeachers, isFetching: isFetchingTeachers } = useQuery<Teacher[], Error>({
    queryKey: ['teachers', teacherSearch],
    queryFn: async () => {
      const res = await api.get('/teachers', { params: { search: teacherSearch.trim() } });
      return res.data.map((t: any) => ({
        id: t.id,
        user: t.user,
        nip: t.nip,
      }));
    },
    enabled: teacherSearchEnabled,
    staleTime: 5 * 60 * 1000,
  });

  // Build selected teachers list (includes those from editing subject)
  const selectedTeachersMemo = useMemo<Teacher[]>(() => {
    const memo = new Map<string, Teacher>();
    (editingSubject?.teachers ?? []).forEach((t: any) => memo.set(t.id, t));
    (teacherResults ?? []).forEach((t: Teacher) => memo.set(t.id, t));
    return Array.from(memo.values());
  }, [editingSubject?.teachers, teacherResults]);

  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={50}>
      <Box bg="white" borderRadius="xl" p={8} w="full" maxW="lg" shadow="2xl">
        <Heading size="lg" fontWeight="bold" mb={6}>
          {editingSubject ? t('editSubject') : t('addSubject')}
        </Heading>
        <form onSubmit={handleSubmit}>
          <SimpleGrid gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Kode <span style={{ color: 'red' }}>*</span>
              </Text>
              <Input
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="MTK"
                borderRadius="lg"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Nama <span style={{ color: 'red' }}>*</span>
              </Text>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Matematika"
                borderRadius="lg"
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Deskripsi
              </Text>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat..."
                borderRadius="lg"
                rows={3}
              />
            </Box>

            {/* Teacher selection */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Guru Pengampu
              </Text>
              <Input
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Cari nama guru / username..."
                borderRadius="lg"
                pl={10}
                borderColor="gray.200"
              />
              {teacherSearchEnabled && (
                <Box position="relative" mt={2}>
                  <Box position="absolute" left={3} top={3} color="gray.400">
                    <Search size={16} />
                  </Box>
                  {isFetchingTeachers ? (
                    <Box px={4} py={3}>
                      <Text fontSize="sm" color="gray.500">Mencari guru...</Text>
                    </Box>
                  ) : selectedTeachersMemo.length > 0 ? (
                    <Stack gap={0}>
                      {selectedTeachersMemo.map((teacher) => {
                        const checked = formData.teacherIds.includes(teacher.id);
                        return (
                          <Box key={teacher.id} px={4} py={3} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }}>
                            <Checkbox.Root
                              checked={checked}
                              onCheckedChange={(details) => handleTeacherSelect(teacher, details.checked)}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                <Stack gap={0}>
                                  <Text fontWeight="medium" color="gray.800">
                                    {teacher.user?.fullName || teacher.user?.username || teacher.id}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    Username: {teacher.user?.username || '-'}
                                    {teacher.nip ? ` • NIP: ${teacher.nip}` : ' • NIP: -'}
                                  </Text>
                                </Stack>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>

            {/* Import CSV */}
            <Box mt={3}>
              <Button
                as="a"
                href="/templates/subjects-template.csv"
                download
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                color="gray.700"
                _hover={{ bg: 'gray.50' }}
                borderRadius="lg"
                cursor="pointer"
              >
                <Download size={18} style={{ marginRight: 6 }} />
                {t('downloadTemplate')}
              </Button>
              <Button
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                color="gray.700"
                _hover={{ bg: 'gray.50' }}
                borderRadius="lg"
                cursor="pointer"
              >
                <Upload size={18} style={{ marginRight: 6 }} />
                {t('importCsv')}
              </Button>
              <Input
                type="file"
                hidden
                accept=".csv,text/csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <Button
                disabled={!importFile || isModalSubmitting}
                onClick={() => importFile && handleImport()}
                bg="indigo.600"
                color="white"
                _hover={{ bg: 'indigo.700' }}
                borderRadius="lg"
                cursor="pointer"
              >
                {t('uploadBtn')}
              </Button>
            </Box>
          </SimpleGrid>
          <Flex gap={3} pt={4}>
            <Button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              flex="1"
              variant="outline"
              borderRadius="lg"
              cursor="pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              flex="1"
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
              cursor="pointer"
              loading={isModalSubmitting}
            >
              Simpan
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}