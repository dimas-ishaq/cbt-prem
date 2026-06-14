'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Stack,
  Input,
  Textarea,
  Spinner,
  IconButton,
  HStack,
} from '@chakra-ui/react';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

export default function SubjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const queryClient = useQueryClient();

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newSubject: typeof formData) => api.post('/subjects', newSubject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Loading subjects...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Subjects
          </Heading>
          <Text color="gray.500" mt={1}>
            Manage school subjects and codes.
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
          onClick={() => setIsModalOpen(true)}
          cursor="pointer"
        >
          <Plus size={20} />
          Add Subject
        </Button>
      </Flex>

      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Flex p={4} borderBottom="1px solid" borderColor="gray.100" align="center" bg="gray.50">
          <Box position="relative" flex={1} maxW="md">
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
              <Search size={18} />
            </Box>
            <Input
              pl={10}
              pr={4}
              py={2}
              placeholder="Search subjects..."
              borderRadius="lg"
              borderColor="gray.200"
              _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
            />
          </Box>
        </Flex>

        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Code
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Name
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                Description
              </Table.ColumnHeader>
              <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign="end">
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {subjects?.map((subject) => (
              <Table.Row key={subject.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                <Table.Cell px={6} py={4} fontFamily="mono" fontSize="sm">
                  {subject.code}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontWeight="medium" color="gray.900">
                  {subject.name}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" maxW="xs" truncate>
                  {subject.description}
                </Table.Cell>
                <Table.Cell px={6} py={4} textAlign="end">
                  <HStack gap={2} justify="flex-end">
                    <IconButton
                      variant="ghost"
                      color="indigo.600"
                      _hover={{ bg: 'indigo.50' }}
                      size="sm"
                      borderRadius="lg"
                      aria-label="Edit Subject"
                      cursor="pointer"
                    >
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      color="red.600"
                      _hover={{ bg: 'red.50' }}
                      size="sm"
                      borderRadius="lg"
                      aria-label="Delete Subject"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this subject?')) {
                          deleteMutation.mutate(subject.id);
                        }
                      }}
                      cursor="pointer"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
            {subjects?.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={4} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
                  No subjects found.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Create Subject Modal */}
      {isModalOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p={8}
            w="full"
            maxW="md"
            shadow="2xl"
            animation="fadeIn 0.2s ease-out"
          >
            <Heading size="lg" fontWeight="bold" mb={6}>
              Add New Subject
            </Heading>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
            >
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Subject Code
                  </Text>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. MATH-101"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Subject Name
                  </Text>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Mathematics"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Description
                  </Text>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Flex gap={3} pt={4}>
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    flex={1}
                    variant="outline"
                    borderRadius="lg"
                    fontWeight="medium"
                    cursor="pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    flex={1}
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    fontWeight="medium"
                    cursor="pointer"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Subject'}
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
