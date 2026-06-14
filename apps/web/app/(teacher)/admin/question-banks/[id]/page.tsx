'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, ChevronLeft, HelpCircle, FileDown } from 'lucide-react';
import { useState, use, useRef } from 'react';
import Link from 'next/link';
import { QuestionForm } from '@/components/admin/question-form';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
  IconButton,
  Badge,
  SimpleGrid,
  HStack,
} from '@chakra-ui/react';

interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  points: number;
  options: Option[];
}

interface QuestionBank {
  id: string;
  name: string;
  subject: {
    name: string;
  };
  questions: Question[];
}

const difficultyColor: Record<string, { bg: string; color: string }> = {
  MUDAH: { bg: 'green.100', color: 'green.700' },
  SEDANG: { bg: 'yellow.100', color: 'yellow.700' },
  SULIT: { bg: 'red.100', color: 'red.700' },
};

export default function QuestionBankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: bank, isLoading } = useQuery<QuestionBank>({
    queryKey: ['question-bank', id],
    queryFn: async () => {
      const response = await api.get(`/question-banks/${id}`);
      return response.data;
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (newQuestion: any) => api.post('/questions', { ...newQuestion, questionBankId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      setIsAddingQuestion(false);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => api.delete(`/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/questions/import/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      alert('Questions imported successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to import questions');
    },
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Loading question bank...</Text>
      </Flex>
    );
  }

  if (!bank) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Text color="gray.500">Question bank not found</Text>
      </Flex>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  return (
    <Stack gap={6}>
      <Flex align="center" justify="space-between">
        <HStack gap={4}>
          <IconButton
            asChild
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
            borderRadius="full"
            aria-label="Back to Question Banks"
            size="sm"
          >
            <Link href="/admin/question-banks">
              <ChevronLeft size={24} />
            </Link>
          </IconButton>
          <Box>
            <Heading size="xl" fontWeight="bold" color="gray.900">
              {bank.name}
            </Heading>
            <Text color="gray.500">
              {bank.subject.name} • {bank.questions.length} Questions
            </Text>
          </Box>
        </HStack>
        {!isAddingQuestion && (
          <HStack gap={3}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".docx"
              style={{ display: 'none' }}
            />
            <Button
              variant="outline"
              borderColor="gray.300"
              color="gray.700"
              _hover={{ bg: 'gray.50' }}
              borderRadius="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              cursor="pointer"
            >
              <FileDown size={20} />
              {importMutation.isPending ? 'Importing...' : 'Import from Word'}
            </Button>
            <Button
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="lg"
              onClick={() => setIsAddingQuestion(true)}
              cursor="pointer"
            >
              <Plus size={20} />
              Add Question
            </Button>
          </HStack>
        )}
      </Flex>

      {isAddingQuestion ? (
        <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" p={8}>
          <Heading size="lg" fontWeight="bold" mb={6}>
            Create New Question
          </Heading>
          <QuestionForm
            onSubmit={(data) => createQuestionMutation.mutate(data)}
            onCancel={() => setIsAddingQuestion(false)}
            isSubmitting={createQuestionMutation.isPending}
          />
        </Box>
      ) : (
        <Stack gap={4}>
          {bank.questions.map((question, idx) => {
            const dc = difficultyColor[question.difficulty] ?? { bg: 'yellow.100', color: 'yellow.700' };
            return (
              <Box
                key={question.id}
                bg="white"
                borderRadius="xl"
                shadow="sm"
                borderWidth="1px"
                borderColor="gray.100"
                overflow="hidden"
              >
                <Box p={6}>
                  <Flex justify="space-between" align="flex-start" mb={4}>
                    <HStack gap={3}>
                      <Flex
                        w={8}
                        h={8}
                        align="center"
                        justify="center"
                        borderRadius="full"
                        bg="indigo.50"
                        color="indigo.600"
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {idx + 1}
                      </Flex>
                      <Badge
                        fontSize="xs"
                        fontWeight="semibold"
                        px={2}
                        py={1}
                        bg="gray.100"
                        color="gray.600"
                        borderRadius="full"
                      >
                        {question.type}
                      </Badge>
                      <Badge
                        fontSize="xs"
                        fontWeight="semibold"
                        px={2}
                        py={1}
                        bg={dc.bg}
                        color={dc.color}
                        borderRadius="full"
                      >
                        {question.difficulty}
                      </Badge>
                    </HStack>
                    <IconButton
                      variant="ghost"
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      size="sm"
                      borderRadius="lg"
                      aria-label="Delete Question"
                      onClick={() => {
                        if (confirm('Delete this question?')) {
                          deleteQuestionMutation.mutate(question.id);
                        }
                      }}
                      cursor="pointer"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Flex>

                  <Box
                    color="gray.900"
                    fontWeight="medium"
                    mb={4}
                    dangerouslySetInnerHTML={{ __html: question.content }}
                  />

                  {question.type !== 'ESSAY' && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                      {question.options.map((option, optIdx) => (
                        <Flex
                          key={option.id}
                          p={3}
                          borderWidth="1px"
                          borderColor={option.isCorrect ? 'green.500' : 'gray.200'}
                          bg={option.isCorrect ? 'green.50' : 'transparent'}
                          borderRadius="lg"
                          align="center"
                          gap={3}
                        >
                          <Flex
                            w={6}
                            h={6}
                            align="center"
                            justify="center"
                            borderRadius="full"
                            borderWidth="1px"
                            fontSize="xs"
                            fontWeight="bold"
                            bg={option.isCorrect ? 'green.600' : 'gray.100'}
                            borderColor={option.isCorrect ? 'green.600' : 'gray.200'}
                            color={option.isCorrect ? 'white' : 'gray.600'}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </Flex>
                          <Box dangerouslySetInnerHTML={{ __html: option.content }} />
                        </Flex>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              </Box>
            );
          })}

          {bank.questions.length === 0 && (
            <Box
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
                <HelpCircle size={32} />
              </Flex>
              <Heading size="md" fontWeight="medium" color="gray.900">
                No questions in this bank
              </Heading>
              <Text color="gray.500" mt={2}>
                Start adding questions to use them in your exams.
              </Text>
              <Button
                mt={6}
                bg="indigo.600"
                color="white"
                _hover={{ bg: 'indigo.700' }}
                borderRadius="lg"
                onClick={() => setIsAddingQuestion(true)}
                cursor="pointer"
              >
                <Plus size={20} />
                Add First Question
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
}
