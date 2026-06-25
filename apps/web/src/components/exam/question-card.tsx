'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Badge,
  Textarea,
  Image,
  RadioGroup,
  Checkbox,
} from '@chakra-ui/react';

interface Option {
  id: string;
  content: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  options: Option[];
  mediaUrl?: string;
  mediaType?: string;
}

interface Props {
  question: Question;
  index: number;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  isFlagged: boolean;
  onToggleFlag: () => void;
}

export function QuestionCard({ question, index, onAnswer, selectedAnswer, isFlagged, onToggleFlag }: Props) {
  const [essayText, setEssayText] = useState(selectedAnswer || '');

  useEffect(() => {
    if (question.type === 'ESSAY') {
      setEssayText(selectedAnswer || '');
    }
  }, [selectedAnswer, question.id, question.type]);

  const handleMultipleResponseChange = (optionId: string) => {
    const currentAnswers = selectedAnswer ? selectedAnswer.split(',') : [];
    let newAnswers: string[];
    
    if (currentAnswers.includes(optionId)) {
      newAnswers = currentAnswers.filter(id => id !== optionId);
    } else {
      newAnswers = [...currentAnswers, optionId];
    }
    
    onAnswer(newAnswers.join(','));
  };

  const renderMedia = () => {
    if (!question.mediaUrl) return null;

    switch (question.mediaType) {
      case 'image':
        return (
          <Box mb={6} borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.150" maxW="2xl" bg="white" boxShadow="xs">
            <Image 
              src={question.mediaUrl} 
              alt="Question media" 
              w="full"
              h="auto"
              objectFit="contain"
            />
          </Box>
        );
      case 'audio':
        return (
          <Box mb={6} p={4} bg="gray.50/50" borderRadius="2xl" border="1px solid" borderColor="gray.150" maxW="2xl">
            <Text fontSize="2xs" fontWeight="bold" color="gray.400" mb={2.5} textTransform="uppercase" letterSpacing="wider">
              Lampiran Audio:
            </Text>
            <audio controls className="w-full">
              <source src={question.mediaUrl} />
              Browser Anda tidak mendukung pemutar audio.
            </audio>
          </Box>
        );
      case 'video':
        return (
          <Box mb={6} borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.150" bg="black" aspectRatio={16/9} maxW="2xl" boxShadow="sm">
            <video controls className="w-full h-full">
              <source src={question.mediaUrl} />
              Browser Anda tidak mendukung pemutar video.
            </video>
          </Box>
        );
      default:
        return null;
    }
  };

  const renderOptions = () => {
    switch (question.type) {
      case 'PILIHAN_GANDA':
      case 'BENAR_SALAH':
        return (
          <RadioGroup.Root
            value={selectedAnswer || ''}
            onValueChange={(details) => onAnswer(details.value || '')}
            width="full"
          >
            <Stack gap={3.5}>
              {question.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const isSelected = selectedAnswer === option.id;
                return (
                  <RadioGroup.Item
                    key={option.id}
                    value={option.id}
                    as="label"
                    display="flex"
                    alignItems="center"
                    p={4}
                    border="1px solid"
                    borderRadius="xl"
                    cursor="pointer"
                    transition="all 0.2s"
                    borderColor={isSelected ? 'indigo.650' : 'gray.200'}
                    bg={isSelected ? 'indigo.50/40' : 'white'}
                    _hover={isSelected ? {} : { bg: 'gray.50/60', borderColor: 'gray.300' }}
                    boxShadow={isSelected ? '0 0 0 2px rgba(79, 70, 229, 0.1)' : 'none'}
                  >
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator colorPalette="indigo" mr={3} />
                    <Flex
                      flexShrink={0}
                      w={8.5}
                      h={8.5}
                      align="center"
                      justify="center"
                      borderRadius="xl"
                      border="1px solid"
                      mr={4}
                      fontWeight="bold"
                      fontSize="sm"
                      transition="all 0.2s"
                      bg={isSelected ? 'indigo.600' : 'white'}
                      color={isSelected ? 'white' : 'gray.500'}
                      borderColor={isSelected ? 'indigo.650' : 'gray.250'}
                      boxShadow={isSelected ? 'md' : 'none'}
                    >
                      {label}
                    </Flex>
                    <RadioGroup.ItemText
                      color="gray.700"
                      fontSize="sm"
                      fontWeight="semibold"
                      lineHeight="relaxed"
                      as="span"
                      dangerouslySetInnerHTML={{ __html: option.content }}
                    />
                  </RadioGroup.Item>
                );
              })}
            </Stack>
          </RadioGroup.Root>
        );

      case 'MULTIPLE_RESPONSE':
        return (
          <Stack gap={3.5}>
            <Text fontSize="2xs" fontWeight="bold" color="gray.400" mb={2.5} textTransform="uppercase" letterSpacing="wider">
              Pilih satu atau lebih jawaban:
            </Text>
            {question.options.map((option, idx) => {
              const label = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer?.split(',').includes(option.id);
              return (
                <Checkbox.Root
                  key={option.id}
                  checked={!!isSelected}
                  onCheckedChange={() => handleMultipleResponseChange(option.id)}
                  as="label"
                  display="flex"
                  alignItems="center"
                  p={4}
                  border="1px solid"
                  borderRadius="xl"
                  cursor="pointer"
                  transition="all 0.2s"
                  borderColor={isSelected ? 'indigo.650' : 'gray.200'}
                  bg={isSelected ? 'indigo.50/40' : 'white'}
                  _hover={isSelected ? {} : { bg: 'gray.50/60', borderColor: 'gray.300' }}
                  boxShadow={isSelected ? '0 0 0 2px rgba(79, 70, 229, 0.1)' : 'none'}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control colorPalette="indigo" mr={3} />
                  <Flex
                    flexShrink={0}
                    w={8.5}
                    h={8.5}
                    align="center"
                    justify="center"
                    borderRadius="xl"
                    border="1px solid"
                    mr={4}
                    fontWeight="bold"
                    fontSize="sm"
                    transition="all 0.2s"
                    bg={isSelected ? 'indigo.600' : 'white'}
                    color={isSelected ? 'white' : 'gray.500'}
                    borderColor={isSelected ? 'indigo.650' : 'gray.250'}
                    boxShadow={isSelected ? 'md' : 'none'}
                  >
                    {label}
                  </Flex>
                  <Checkbox.Label
                    color="gray.700"
                    fontSize="sm"
                    fontWeight="semibold"
                    lineHeight="relaxed"
                    as="span"
                    dangerouslySetInnerHTML={{ __html: option.content }}
                  />
                </Checkbox.Root>
              );
            })}
          </Stack>
        );

      case 'ESSAY':
        return (
          <Stack gap={4}>
            <Textarea
              w="full"
              h={64}
              p={4}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="xl"
              outline="none"
              resize="none"
              color="gray.700"
              lineHeight="relaxed"
              fontSize="sm"
              fontWeight="medium"
              bg="gray.50/20"
              _focus={{ ring: '4px', ringColor: 'indigo.50', borderColor: 'indigo.650' }}
              placeholder="Tuliskan lembar jawaban esai Anda di sini secara lengkap..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              onBlur={() => onAnswer(essayText)}
            />
            <Flex justify="between" align="center" fontSize="2xs" color="gray.400" fontWeight="semibold" px={1}>
              <Text>Jawaban disimpan otomatis saat Anda beralih nomor atau mengklik area luar.</Text>
              <Text>{essayText.length} karakter</Text>
            </Flex>
          </Stack>
        );

      default:
        return <Text color="red.500" fontWeight="bold">Tipe soal tidak didukung: {question.type}</Text>;
    }
  };

  return (
    <Box bg="white" p={8} borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100" position="relative">
      {/* Question Header Status */}
      <Flex justify="between" align="center" mb={6}>
        <Badge colorPalette="indigo" px={3} py={1.5} borderRadius="lg" variant="subtle" fontWeight="bold" fontSize="2xs" textTransform="uppercase" letterSpacing="wider">
          Soal No. {index + 1}
        </Badge>
        <Flex align="center" gap={3}>
          <Badge bg="gray.100" color="gray.600" px={2.5} py={1} borderRadius="md" fontSize="2xs" fontWeight="extrabold" textTransform="uppercase" letterSpacing="wider">
            {question.type.replace('_', ' ')}
          </Badge>
          <Button
            onClick={onToggleFlag}
            size="sm"
            variant={isFlagged ? 'subtle' : 'outline'}
            colorPalette={isFlagged ? 'amber' : 'gray'}
            fontWeight="bold"
            fontSize="xs"
            borderRadius="lg"
            px={3}
            py={1.5}
            cursor="pointer"
          >
            <Bookmark size={14} className={isFlagged ? 'fill-amber-500 text-amber-600' : 'text-gray-450'} />
            <Text color={isFlagged ? 'amber.700' : 'gray.600'}>Ragu-Ragu</Text>
          </Button>
        </Flex>
      </Flex>

      {/* Question Content */}
      <Box mb={8}>
        {renderMedia()}
        <Text 
          fontSize="md"
          color="gray.850"
          fontWeight="semibold"
          lineHeight="relaxed"
          dangerouslySetInnerHTML={{ __html: question.content }}
        />
      </Box>

      {/* Answer Options */}
      {renderOptions()}
    </Box>
  );
}
