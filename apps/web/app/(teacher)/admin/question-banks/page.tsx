'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, FileText, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Stack,
  Input,
  Spinner,
  Badge,
} from '@chakra-ui/react';

interface QuestionBank {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  _count: {
    questions: number;
  };
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function QuestionBanksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subjectId: '' });
  const queryClient = useQueryClient();

  const { data: questionBanks, isLoading } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks'],
    queryFn: async () => {
      const response = await api.get('/question-banks');
      return response.data;
    },
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newBank: typeof formData) => api.post('/question-banks', newBank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setIsModalOpen(false);
      setFormData({ name: '', subjectId: '' });
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Loading question banks...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Question Banks
          </Heading>
          <Text color="gray.500" mt={1}>
            Organize your questions into banks by subject.
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
          New Question Bank
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {questionBanks?.map((bank) => (
          <Box
            key={bank.id}
            bg="white"
            borderRadius="xl"
            shadow="sm"
            borderWidth="1px"
            borderColor="gray.100"
            _hover={{ shadow: 'md' }}
            transition="all 0.2s"
            role="group"
          >
            <Box p={6}>
              <Flex justify="space-between" align="flex-start" mb={4}>
                <Box p={2} bg="indigo.50" color="indigo.600" borderRadius="lg">
                  <FileText size={24} />
                </Box>
                <Badge
                  fontSize="xs"
                  fontWeight="semibold"
                  px={2}
                  py={1}
                  bg="gray.100"
                  color="gray.600"
                  borderRadius="full"
                >
                  {bank.subject.name}
                </Badge>
              </Flex>
              <Heading
                size="md"
                fontWeight="bold"
                color="gray.900"
                _groupHover={{ color: 'indigo.600' }}
                transition="color 0.15s"
              >
                {bank.name}
              </Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {bank._count.questions} questions
              </Text>

              <Flex mt={6} align="center" justify="space-between">
                <Text fontSize="xs" color="gray.400">
                  Created {new Date(bank.createdAt).toLocaleDateString()}
                </Text>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  fontSize="sm"
                  fontWeight="semibold"
                  color="indigo.600"
                  _hover={{ color: 'indigo.700' }}
                  p={0}
                  h="auto"
                  cursor="pointer"
                >
                  <Link href={`/admin/question-banks/${bank.id}`}>
                    Manage Questions
                    <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                  </Link>
                </Button>
              </Flex>
            </Box>
          </Box>
        ))}

        {questionBanks?.length === 0 && (
          <Box
            gridColumn="1 / -1"
            bg="gray.50"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="gray.200"
            borderRadius="xl"
            p={12}
            textAlign="center"
          >
            <Flex
              display="inline-flex"
              p={4}
              bg="gray.100"
              borderRadius="full"
              color="gray.400"
              mb={4}
            >
              <FileText size={32} />
            </Flex>
            <Heading size="md" fontWeight="medium" color="gray.900">
              No question banks yet
            </Heading>
            <Text color="gray.500" mt={2}>
              Start by creating your first question bank to add questions.
            </Text>
            <Button
              mt={6}
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
              onClick={() => setIsModalOpen(true)}
              cursor="pointer"
            >
              <Plus size={20} />
              Create Bank
            </Button>
          </Box>
        )}
      </SimpleGrid>

      {/* Create Modal */}
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
          <Box bg="white" borderRadius="xl" p={8} w="full" maxW="md" shadow="2xl">
            <Heading size="lg" fontWeight="bold" mb={6}>
              Create Question Bank
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
                    Bank Name
                  </Text>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Midterm Exam Prep"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Subject
                  </Text>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      outline: 'none',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select Subject</option>
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
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
                    {createMutation.isPending ? 'Creating...' : 'Create Bank'}
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
