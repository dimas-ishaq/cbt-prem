import { useQuery } from '@tanstack/react-query';
import { Box, Button, Checkbox, Flex, Heading, Input, Stack, Text, Textarea, Wrap, WrapItem } from '@chakra-ui/react';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import type { Subject, SubjectFormData, TeacherSummary } from '../subject-types';

interface SubjectFormModalProps {
  isOpen: boolean;
  editingSubject: Subject | null;
  formData: SubjectFormData;
  teacherSearch: string;
  selectedTeachers: TeacherSummary[];
  isSearchingTeachers: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onFormChange: (next: SubjectFormData) => void;
  onTeacherSearchChange: (value: string) => void;
}

export function SubjectFormModal({ isOpen, editingSubject, formData, teacherSearch, selectedTeachers, isSearchingTeachers, isSubmitting, onClose, onSubmit, onFormChange, onTeacherSearchChange }: SubjectFormModalProps) {
  const teacherSearchEnabled = teacherSearch.trim().length >= 3;

  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" display="flex" alignItems="center" justifyContent="center" zIndex={50} px={4}>
      <Box bg="white" borderRadius="xl" p={8} w="full" maxW="lg" shadow="2xl">
        <Heading size="lg" fontWeight="bold" mb={6}>{editingSubject ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}</Heading>
        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Kode <Box as="span" color="red.500">*</Box></Text>
              <Input required value={formData.code} onChange={(e) => onFormChange({ ...formData, code: e.target.value })} placeholder="MTK" borderRadius="lg" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Nama <Box as="span" color="red.500">*</Box></Text>
              <Input required value={formData.name} onChange={(e) => onFormChange({ ...formData, name: e.target.value })} placeholder="Matematika" borderRadius="lg" />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Deskripsi</Text>
              <Textarea value={formData.description} onChange={(e) => onFormChange({ ...formData, description: e.target.value })} placeholder="Deskripsi singkat..." borderRadius="lg" rows={3} />
            </Box>
            <Box>
              <Flex justify="space-between" align="center" mb={2}><Text fontSize="sm" fontWeight="medium" color="gray.700">Guru Pengampu</Text><Text fontSize="xs" color="gray.500">Ketik minimal 3 karakter</Text></Flex>
              <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400" pointerEvents="none"><Search size={16} /></Box>
                <Input value={teacherSearch} onChange={(e) => onTeacherSearchChange(e.target.value)} placeholder="Cari nama guru / username..." borderRadius="lg" pl={10} />
              </Box>
              {teacherSearchEnabled && (
                <Box mt={3} borderWidth="1px" borderColor="gray.200" borderRadius="lg" maxH="260px" overflowY="auto">
                  <Stack gap={0}>
                    {isSearchingTeachers ? <Box px={4} py={3}><Text fontSize="sm" color="gray.500">Mencari guru...</Text></Box> : selectedTeachers.map((teacher) => {
                      const checked = formData.teacherIds.includes(teacher.id);
                      return (
                        <Box key={teacher.id} px={4} py={3} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }} bg={checked ? 'indigo.50' : 'white'}>
                          <Checkbox.Root checked={checked} onCheckedChange={(details) => onFormChange({ ...formData, teacherIds: details.checked ? [...formData.teacherIds, teacher.id] : formData.teacherIds.filter((id) => id !== teacher.id) })}>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Stack gap={0}>
                                <Text fontWeight="medium" color="gray.800">{teacher.user?.fullName || teacher.user?.username || teacher.id}</Text>
                                <Text fontSize="xs" color="gray.500">Username: {teacher.user?.username || '-'}{teacher.nip ? ` • NIP: ${teacher.nip}` : ' • NIP: -'}</Text>
                              </Stack>
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
              {teacherSearchEnabled && !isSearchingTeachers && selectedTeachers.length === 0 && <Text mt={2} fontSize="sm" color="gray.500">Tidak ada guru yang cocok.</Text>}
              <Wrap mt={3}>{formData.teacherIds.map((id) => { const teacher = selectedTeachers.find((item) => item.id === id); return teacher ? <WrapItem key={id}><Text px={2} py={1} bg="indigo.50" color="indigo.700" borderRadius="md" fontSize="sm">{teacher.user?.fullName || teacher.user?.username || teacher.id}</Text></WrapItem> : null; })}</Wrap>
            </Box>
            <Flex gap={3} pt={4}>
              <Button type="button" onClick={onClose} flex={1} variant="outline" borderRadius="lg" cursor="pointer">Batal</Button>
              <Button type="submit" flex={1} bg="indigo.600" color="white" _hover={{ bg: 'indigo.700' }} borderRadius="lg" cursor="pointer" loading={isSubmitting}>Simpan</Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
