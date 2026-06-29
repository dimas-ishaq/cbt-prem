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
  isDisabled?: boolean;
}

export function QuestionCard({ question, index, onAnswer, selectedAnswer, isFlagged, onToggleFlag, isDisabled = false }: Props) {
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
          <Box mb={5} borderRadius="md" overflow="hidden" border="1px solid" borderColor="dd.border" maxW="2xl" bg="dd.canvas" boxShadow="sm">
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
          <Box mb={5} p={4} bg="dd.canvas" borderRadius="md" border="1px solid" borderColor="dd.border" maxW="2xl">
            <Text fontSize="10px" fontWeight="bold" color="dd.text.muted" mb={2.5} textTransform="uppercase" letterSpacing="wider">
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
          <Box mb={5} borderRadius="md" overflow="hidden" border="1px solid" borderColor="dd.border" bg="dd.canvas" aspectRatio={16/9} maxW="2xl" boxShadow="sm">
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
            onValueChange={(details) => !isDisabled && onAnswer(details.value || '')}
            width="full"
            disabled={isDisabled}
          >
            <Stack gap={2.5}>
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
                    p={3.5}
                    border="1px solid"
                    borderRadius="md"
                    cursor={isDisabled ? 'not-allowed' : 'pointer'}
                    transition="all 0.12s ease"
                    borderColor={isSelected ? 'dd.brand' : 'dd.border'}
                    bg={isSelected ? 'dd.brand.subtle' : 'dd.surface'}
                    _hover={isSelected || isDisabled ? {} : { bg: 'dd.canvas', borderColor: 'dd.border.strong' }}
                    boxShadow={isSelected ? 'dd.focus.ring' : 'none'}
                    disabled={isDisabled}
                  >
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator colorPalette="purple" mr={3} />
                    <Flex
                      flexShrink={0}
                      w="32px"
                      h="32px"
                      align="center"
                      justify="center"
                      borderRadius="md"
                      border="1px solid"
                      mr={4}
                      fontWeight="bold"
                      fontSize="13px"
                      transition="all 0.12s ease"
                      bg={isSelected ? 'dd.brand' : 'dd.surface.alt'}
                      color={isSelected ? 'white' : 'dd.text.muted'}
                      borderColor={isSelected ? 'dd.brand' : 'dd.border'}
                    >
                      {label}
                    </Flex>
                    <RadioGroup.ItemText
                      color="dd.text"
                      fontSize="13px"
                      fontWeight="semibold"
                      lineHeight="1.4"
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
          <Stack gap={2.5}>
            <Text fontSize="10px" fontWeight="bold" color="dd.text.muted" mb={1} textTransform="uppercase" letterSpacing="wider">
              Pilih satu atau lebih jawaban:
            </Text>
            {question.options.map((option, idx) => {
              const label = String.fromCharCode(65 + idx);
              const isSelected = selectedAnswer?.split(',').includes(option.id);
              return (
                <Checkbox.Root
                  key={option.id}
                  checked={!!isSelected}
                  onCheckedChange={() => !isDisabled && handleMultipleResponseChange(option.id)}
                  as="label"
                  display="flex"
                  alignItems="center"
                  p={3.5}
                  border="1px solid"
                  borderRadius="md"
                  cursor={isDisabled ? 'not-allowed' : 'pointer'}
                  transition="all 0.12s ease"
                  borderColor={isSelected ? 'dd.brand' : 'dd.border'}
                  bg={isSelected ? { base: 'rgba(156, 85, 232, 0.05)', _dark: 'rgba(156, 85, 232, 0.08)' } : { base: 'white', _dark: 'dd.canvas' }}
                  _hover={isSelected || isDisabled ? {} : { bg: 'dd.canvas', borderColor: 'dd.border.strong' }}
                  boxShadow={isSelected ? 'dd.focus.ring' : 'none'}
                  disabled={isDisabled}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control colorPalette="purple" mr={3} borderColor="dd.border" />
                  <Flex
                    flexShrink={0}
                    w="32px"
                    h="32px"
                    align="center"
                    justify="center"
                    borderRadius="md"
                    border="1px solid"
                    mr={4}
                    fontWeight="bold"
                    fontSize="13px"
                    transition="all 0.12s ease"
                    bg={isSelected ? 'dd.brand' : 'dd.surface.alt'}
                    color={isSelected ? 'white' : 'dd.text.muted'}
                    borderColor={isSelected ? 'dd.brand' : 'dd.border'}
                  >
                    {label}
                  </Flex>
                  <Checkbox.Label
                    color="dd.text"
                    fontSize="13px"
                    fontWeight="semibold"
                    lineHeight="1.4"
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
          <Stack gap={3}>
            <Textarea
              w="full"
              h={56}
              p={4}
              bg="dd.canvas"
              border="1px solid"
              borderColor="dd.border"
              borderRadius="md"
              outline="none"
              resize="none"
              color="dd.text"
              lineHeight="1.4"
              fontSize="13px"
              fontWeight="medium"
              _focus={{ borderColor: 'dd.brand', boxShadow: 'dd.focus.ring' }}
              placeholder="Tuliskan lembar jawaban esai Anda di sini secara lengkap..."
              value={essayText}
              disabled={isDisabled}
              onChange={(e) => !isDisabled && setEssayText(e.target.value)}
              onBlur={() => !isDisabled && onAnswer(essayText)}
            />
            <Flex justify="space-between" align="center" fontSize="11px" color="dd.text.muted" fontWeight="semibold" px={1}>
              <Text>Jawaban disimpan otomatis saat Anda beralih nomor atau mengklik area luar.</Text>
              <Text>{essayText.length} karakter</Text>
            </Flex>
          </Stack>
        );

      default:
        return <Text color="dd.status.danger.text" fontWeight="bold" fontSize="13px">Tipe soal tidak didukung: {question.type}</Text>;
    }
  };

  return (
    <Box
      bg="dd.surface"
      p={6}
      borderRadius="md"
      boxShadow="0 1px 4px rgba(0,0,0,0.05)"
      border="1px solid"
      borderColor="dd.border"
      position="relative"
      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    >
      {/* Question Header Status */}
      <Flex justify="space-between" align="center" mb={5}>
        <Badge bg="dd.brand.subtle" color="dd.brand" border="1px solid" borderColor="dd.brand" px={3} py={1} borderRadius="md" fontWeight="bold" fontSize="11px" textTransform="uppercase" letterSpacing="wider">
          Soal No. {index + 1}
        </Badge>
        <Flex align="center" gap={3}>
          <Badge bg={{ base: 'dd.canvas', _dark: 'dd.canvas' }} color="dd.text.muted" border="1px solid" borderColor="dd.border" px={2.5} py={1} borderRadius="md" fontSize="10px" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
            {question.type.replace('_', ' ')}
          </Badge>
          <Button
            onClick={onToggleFlag}
            size="sm"
            bg={isFlagged ? 'dd.status.warning.solid' : 'dd.canvas'}
            color={isFlagged ? 'white' : 'dd.text.muted'}
            border="1px solid"
            borderColor={isFlagged ? 'dd.status.warning.solid' : 'dd.border'}
            fontWeight="bold"
            fontSize="12px"
            borderRadius="md"
            px={3}
            height="32px"
            cursor="pointer"
            _hover={{ bg: isFlagged ? 'dd.status.warning.text' : 'dd.canvas', borderColor: isFlagged ? 'dd.status.warning.text' : 'dd.border.strong' }}
            transition="all 0.15s ease"
          >
            <Bookmark size={12} style={{ marginRight: 6 }} className={isFlagged ? 'fill-white text-white' : 'text-gray-450'} />
            Ragu-Ragu
          </Button>
        </Flex>
      </Flex>

      {/* Question Content */}
      <Box mb={6}>
        {renderMedia()}
        <Text 
          fontSize="14px"
          color="dd.text"
          fontWeight="semibold"
          lineHeight="1.4"
          dangerouslySetInnerHTML={{ __html: question.content }}
        />
      </Box>

      {/* Answer Options */}
      {renderOptions()}
    </Box>
  );
}
