'use client';

import { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { RichTextEditor } from './rich-text-editor';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Input,
  SimpleGrid,
  HStack,
  IconButton,
} from '@chakra-ui/react';

interface Option {
  content: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ onSubmit, onCancel, isSubmitting }: QuestionFormProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('PILIHAN_GANDA');
  const [difficulty, setDifficulty] = useState('SEDANG');
  const [points, setPoints] = useState(1);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [options, setOptions] = useState<Option[]>([
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
  ]);

  const addOption = () => {
    setOptions([...options, { content: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof Option, value: any) => {
    setOptions((prev) => {
      return prev.map((opt, i) => {
        if (i !== index) {
          // If setting one to correct in single choice, others must be false
          if (field === 'isCorrect' && value === true && (type === 'PILIHAN_GANDA' || type === 'BENAR_SALAH')) {
            return { ...opt, isCorrect: false };
          }
          return opt;
        }
        return { ...opt, [field]: value };
      });
    });
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'BENAR_SALAH') {
      setOptions([
        { content: 'Benar', isCorrect: true },
        { content: 'Salah', isCorrect: false },
      ]);
    } else if (newType === 'ESSAY') {
      setOptions([]);
    } else if (options.length === 0 || (options.length === 2 && options[0]?.content === 'Benar')) {
      // Re-initialize for choice types if it was essay or true/false
      setOptions([
        { content: '', isCorrect: true },
        { content: '', isCorrect: false },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      content,
      type,
      difficulty,
      points,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
      options: type === 'ESSAY' ? [] : options,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap={6}>
        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
              Question Content
            </Text>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Type your question here..."
            />
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.100">
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Media URL (Optional)
              </Text>
              <Input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                borderRadius="lg"
                borderColor="gray.200"
                _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                Media Type
              </Text>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                disabled={!mediaUrl}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  outline: 'none',
                  fontSize: '14px',
                  opacity: !mediaUrl ? 0.5 : 1,
                }}
              >
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Type</Text>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
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
                <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                <option value="MULTIPLE_RESPONSE">Multiple Response</option>
                <option value="ESSAY">Essay</option>
                <option value="BENAR_SALAH">Benar / Salah</option>
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Difficulty</Text>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
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
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Points</Text>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                borderRadius="lg"
                borderColor="gray.200"
                _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
              />
            </Box>
          </SimpleGrid>
        </Stack>

        {type !== 'ESSAY' && (
          <Stack gap={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="bold" color="gray.900" textTransform="uppercase" letterSpacing="wider">
                Options
              </Text>
              {type !== 'BENAR_SALAH' && (
                <Button
                  type="button"
                  onClick={addOption}
                  variant="ghost"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="indigo.600"
                  _hover={{ color: 'indigo.700' }}
                  size="sm"
                  cursor="pointer"
                >
                  <Plus size={16} />
                  Add Option
                </Button>
              )}
            </Flex>

            <Stack gap={3}>
              {options.map((option, idx) => (
                <Flex key={idx} align="flex-start" gap={3}>
                  <Flex
                    as="button"
                    onClick={() => updateOption(idx, 'isCorrect', !option.isCorrect)}
                    mt={2}
                    p={1}
                    borderRadius="full"
                    transition="all 0.15s"
                    color={option.isCorrect ? 'green.600' : 'gray.300'}
                    bg={option.isCorrect ? 'green.50' : 'transparent'}
                    _hover={{ color: option.isCorrect ? 'green.700' : 'gray.400' }}
                    cursor="pointer"
                    align="center"
                    justify="center"
                  >
                    <CheckCircle2 size={24} />
                  </Flex>
                  <Box flex={1}>
                    {type === 'BENAR_SALAH' ? (
                      <Input
                        type="text"
                        readOnly
                        value={option.content}
                        bg="gray.50"
                        borderRadius="lg"
                        borderColor="gray.200"
                      />
                    ) : (
                      <RichTextEditor
                        value={option.content}
                        onChange={(val) => updateOption(idx, 'content', val)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="min-h-[100px]"
                      />
                    )}
                  </Box>
                  {options.length > 2 && type !== 'BENAR_SALAH' && (
                    <IconButton
                      type="button"
                      onClick={() => removeOption(idx)}
                      variant="ghost"
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      size="sm"
                      borderRadius="lg"
                      mt={2}
                      aria-label="Remove option"
                      cursor="pointer"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  )}
                </Flex>
              ))}
            </Stack>
          </Stack>
        )}

        <Flex gap={3} pt={6} borderTop="1px solid" borderColor="gray.100">
          <Button
            type="button"
            onClick={onCancel}
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
            disabled={isSubmitting}
            flex={1}
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="lg"
            fontWeight="medium"
            cursor="pointer"
          >
            {isSubmitting ? 'Saving...' : 'Save Question'}
          </Button>
        </Flex>
      </Stack>
    </form>
  );
}
