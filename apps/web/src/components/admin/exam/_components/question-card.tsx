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
          <Box mb={5} borderRadius="md" overflow="hidden" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} maxW="2xl" bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} boxShadow="sm">
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
          <Box mb={5} p={4} bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} borderRadius="md" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} maxW="2xl">
            <Text fontSize="10px" fontWeight="bold" color={{ base: '#57606A', _dark: '#8A8A8A' }} mb={2.5} textTransform="uppercase" letterSpacing="wider">
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
          <Box mb={5} borderRadius="md" overflow="hidden" border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} aspectRatio={16/9} maxW="2xl" boxShadow="sm">
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
                    borderColor={isSelected ? '#9C55E8' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
                    bg={isSelected ? { base: 'rgba(156, 85, 232, 0.05)', _dark: 'rgba(156, 85, 232, 0.08)' } : { base: '#FFFFFF', _dark: '#1B1B1B' }}
                    _hover={isSelected || isDisabled ? {} : { bg: { base: '#F9FAFC', _dark: '#2D2D2D' }, borderColor: { base: '#D1D5DB', _dark: '#4D4D4D' } }}
                    boxShadow={isSelected ? '0 0 0 1px #9C55E8' : 'none'}
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
                      bg={isSelected ? '#9C55E8' : { base: '#F9FAFC', _dark: '#2D2D2D' }}
                      color={isSelected ? '#ffffff' : { base: '#57606A', _dark: '#8A8A8A' }}
                      borderColor={isSelected ? '#9C55E8' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
                    >
                      {label}
                    </Flex>
                    <RadioGroup.ItemText
                      color={{ base: '#1F2328', _dark: '#E0E0E0' }}
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
            <Text fontSize="10px" fontWeight="bold" color={{ base: '#57606A', _dark: '#8A8A8A' }} mb={1} textTransform="uppercase" letterSpacing="wider">
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
                  borderColor={isSelected ? '#9C55E8' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
                  bg={isSelected ? { base: 'rgba(156, 85, 232, 0.05)', _dark: 'rgba(156, 85, 232, 0.08)' } : { base: '#FFFFFF', _dark: '#1B1B1B' }}
                  _hover={isSelected || isDisabled ? {} : { bg: { base: '#F9FAFC', _dark: '#2D2D2D' }, borderColor: { base: '#D1D5DB', _dark: '#4D4D4D' } }}
                  boxShadow={isSelected ? '0 0 0 1px #9C55E8' : 'none'}
                  disabled={isDisabled}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control colorPalette="purple" mr={3} borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} />
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
                    bg={isSelected ? '#9C55E8' : { base: '#F9FAFC', _dark: '#2D2D2D' }}
                    color={isSelected ? '#ffffff' : { base: '#57606A', _dark: '#8A8A8A' }}
                    borderColor={isSelected ? '#9C55E8' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
                  >
                    {label}
                  </Flex>
                  <Checkbox.Label
                    color={{ base: '#1F2328', _dark: '#E0E0E0' }}
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
              bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }}
              border="1px solid"
              borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
              borderRadius="md"
              outline="none"
              resize="none"
              color={{ base: '#1F2328', _dark: '#E0E0E0' }}
              lineHeight="1.4"
              fontSize="13px"
              fontWeight="medium"
              _focus={{ borderColor: '#9C55E8', boxShadow: '0 0 0 1px #9C55E8' }}
              placeholder="Tuliskan lembar jawaban esai Anda di sini secara lengkap..."
              value={essayText}
              disabled={isDisabled}
              onChange={(e) => !isDisabled && setEssayText(e.target.value)}
              onBlur={() => !isDisabled && onAnswer(essayText)}
            />
            <Flex justify="space-between" align="center" fontSize="11px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontWeight="semibold" px={1}>
              <Text>Jawaban disimpan otomatis saat Anda beralih nomor atau mengklik area luar.</Text>
              <Text>{essayText.length} karakter</Text>
            </Flex>
          </Stack>
        );

      default:
        return <Text color="#EF4444" fontWeight="bold" fontSize="13px">Tipe soal tidak didukung: {question.type}</Text>;
    }
  };

  return (
    <Box
      bg={{ base: '#FFFFFF', _dark: '#242424' }}
      p={6}
      borderRadius="md"
      boxShadow="0 1px 4px rgba(0,0,0,0.05)"
      border="1px solid"
      borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
      position="relative"
      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    >
      {/* Question Header Status */}
      <Flex justify="space-between" align="center" mb={5}>
        <Badge bg="rgba(156, 85, 232, 0.15)" color="#9C55E8" border="1px solid" borderColor="rgba(156, 85, 232, 0.3)" px={3} py={1} borderRadius="md" fontWeight="bold" fontSize="11px" textTransform="uppercase" letterSpacing="wider">
          Soal No. {index + 1}
        </Badge>
        <Flex align="center" gap={3}>
          <Badge bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} color={{ base: '#57606A', _dark: '#8A8A8A' }} border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} px={2.5} py={1} borderRadius="md" fontSize="10px" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
            {question.type.replace('_', ' ')}
          </Badge>
          <Button
            onClick={onToggleFlag}
            size="sm"
            bg={isFlagged ? '#F5A623' : { base: '#F9FAFC', _dark: '#1B1B1B' }}
            color={isFlagged ? '#ffffff' : { base: '#57606A', _dark: '#8A8A8A' }}
            border="1px solid"
            borderColor={isFlagged ? '#F5A623' : { base: '#E1E4E8', _dark: '#3D3D3D' }}
            fontWeight="bold"
            fontSize="12px"
            borderRadius="md"
            px={3}
            height="32px"
            cursor="pointer"
            _hover={{ bg: isFlagged ? '#fbb33c' : { base: '#E1E4E8', _dark: '#2D2D2D' }, borderColor: isFlagged ? '#fbb33c' : { base: '#D1D5DB', _dark: '#4D4D4D' } }}
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
          color={{ base: '#1F2328', _dark: '#E0E0E0' }}
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
