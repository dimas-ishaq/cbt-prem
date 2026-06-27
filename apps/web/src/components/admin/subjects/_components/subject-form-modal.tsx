'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge, Box, Button, Checkbox, Flex, Heading, Input, Stack, Text, Textarea, Wrap, WrapItem } from '@chakra-ui/react';
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

export function SubjectFormModal({
  isOpen,
  editingSubject,
  formData,
  teacherSearch,
  selectedTeachers,
  isSearchingTeachers,
  isSubmitting,
  onClose,
  onSubmit,
  onFormChange,
  onTeacherSearchChange,
}: SubjectFormModalProps) {
  const teacherSearchEnabled = teacherSearch.trim().length >= 3;

  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.700" backdropFilter="blur(8px)" display="flex" alignItems="center" justifyContent="center" zIndex={50} px={4}>
      <Box bg="bg.surface" borderRadius="card" p={8} w="full" maxW="lg" shadow="2xl" borderWidth="1px" borderColor="border.default">
        <Heading size="lg" fontWeight="black" mb={2} color="text.primary">
          {editingSubject ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
        </Heading>
        <Text color="text.secondary" mb={6}>
          Atur identitas mapel dan relasi guru pengampu.
        </Text>

        <form onSubmit={onSubmit}>
          <Stack gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="text.primary" mb={1}>
                Kode <Box as="span" color="danger.500">*</Box>
              </Text>
              <Input
                required
                value={formData.code}
                onChange={(e) => onFormChange({ ...formData, code: e.target.value })}
                placeholder="MTK"
                borderRadius="lg"
                bg="bg.elevated"
                borderColor="border.default"
                _focusVisible={{ borderColor: 'brand.solid', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="text.primary" mb={1}>
                Nama <Box as="span" color="danger.500">*</Box>
              </Text>
              <Input
                required
                value={formData.name}
                onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                placeholder="Matematika"
                borderRadius="lg"
                bg="bg.elevated"
                borderColor="border.default"
                _focusVisible={{ borderColor: 'brand.solid', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="text.primary" mb={1}>Deskripsi</Text>
              <Textarea
                value={formData.description}
                onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat..."
                borderRadius="lg"
                rows={3}
                bg="bg.elevated"
                borderColor="border.default"
                _focusVisible={{ borderColor: 'brand.solid', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
              />
            </Box>

            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="semibold" color="text.primary">Guru Pengampu</Text>
                <Text fontSize="xs" color="text.muted">Ketik minimal 3 karakter</Text>
              </Flex>

              <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="text.muted" pointerEvents="none">
                  <Search size={16} />
                </Box>
                <Input
                  value={teacherSearch}
                  onChange={(e) => onTeacherSearchChange(e.target.value)}
                  placeholder="Cari nama guru / username..."
                  borderRadius="lg"
                  pl={10}
                  bg="bg.elevated"
                  borderColor="border.default"
                  _focusVisible={{ borderColor: 'brand.solid', boxShadow: '0 0 0 1px var(--chakra-colors-brand-solid)' }}
                />
              </Box>

              {teacherSearchEnabled && (
                <Box mt={3} borderWidth="1px" borderColor="border.default" borderRadius="lg" maxH="260px" overflowY="auto" bg="bg.elevated">
                  <Stack gap={0}>
                    {isSearchingTeachers ? (
                      <Box px={4} py={3}>
                        <Text fontSize="sm" color="text.secondary">Mencari guru...</Text>
                      </Box>
                    ) : (
                      selectedTeachers.map((teacher) => {
                        const checked = formData.teacherIds.includes(teacher.id);
                        return (
                          <Box key={teacher.id} px={4} py={3} borderBottomWidth="1px" borderColor="border.default" _last={{ borderBottomWidth: 0 }} bg={checked ? 'brand.subtle' : 'transparent'}>
                            <Checkbox.Root
                              checked={checked}
                              onCheckedChange={(details) =>
                                onFormChange({
                                  ...formData,
                                  teacherIds: details.checked
                                    ? [...formData.teacherIds, teacher.id]
                                    : formData.teacherIds.filter((id) => id !== teacher.id),
                                })
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                <Stack gap={0}>
                                  <Text fontWeight="medium" color="text.primary">
                                    {teacher.user?.fullName || teacher.user?.username || teacher.id}
                                  </Text>
                                  <Text fontSize="xs" color="text.secondary">
                                    Username: {teacher.user?.username || '-'}
                                    {teacher.nip ? ` • NIP: ${teacher.nip}` : ' • NIP: -'}
                                  </Text>
                                </Stack>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          </Box>
                        );
                      })
                    )}
                  </Stack>
                </Box>
              )}

              {teacherSearchEnabled && !isSearchingTeachers && selectedTeachers.length === 0 && (
                <Text mt={2} fontSize="sm" color="text.secondary">
                  Tidak ada guru yang cocok.
                </Text>
              )}

              <Wrap mt={3}>
                {formData.teacherIds.map((id) => {
                  const teacher = selectedTeachers.find((item) => item.id === id);
                  return teacher ? (
                    <WrapItem key={id}>
                      <Badge px={2} py={1} borderRadius="full" colorPalette="purple" variant="subtle">
                        {teacher.user?.fullName || teacher.user?.username || teacher.id}
                      </Badge>
                    </WrapItem>
                  ) : null;
                })}
              </Wrap>
            </Box>

            <Flex gap={3} pt={4}>
              <Button type="button" onClick={onClose} flex={1} variant="outline" borderRadius="full" borderColor="border.default" color="text.primary" bg="bg.elevated" cursor="pointer">
                Batal
              </Button>
              <Button type="submit" flex={1} bg="primary" color="on-primary" _hover={{ bg: 'primary-hover' }} borderRadius="full" cursor="pointer" loading={isSubmitting}>
                Simpan
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
