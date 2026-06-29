'use client';

import { SimpleGrid, Button } from '@chakra-ui/react';

interface Props {
  questions: any[];
  currentIndex: number;
  onSelect: (index: number) => void;
  answeredQuestions: string[]; // examQuestionIds
  flaggedQuestions: string[]; // examQuestionIds
}

export function ExamNav({ questions, currentIndex, onSelect, answeredQuestions, flaggedQuestions }: Props) {
  return (
    <SimpleGrid columns={5} gap={2.5}>
      {questions.map((eq, idx) => {
        const questionId = eq.question.id;
        const isAnswered = answeredQuestions.includes(questionId);
        const isCurrent = currentIndex === idx;
        const isFlagged = flaggedQuestions.includes(questionId);

        let bg: string | Record<string, string> = { base: '#F9FAFC', _dark: '#2D2D2D' };
        let color: string | Record<string, string> = { base: '#1F2328', _dark: '#E0E0E0' };
        let borderColor: string | Record<string, string> = { base: '#E1E4E8', _dark: '#3D3D3D' };
        let hoverBg: string | Record<string, string> = { base: '#E1E4E8', _dark: '#3D3D3D' };

        if (isCurrent) {
          bg = '#9C55E8';
          color = '#ffffff';
          borderColor = '#9C55E8';
          hoverBg = '#a86bf5';
        } else if (isFlagged) {
          bg = '#F5A623';
          color = '#ffffff';
          borderColor = '#F5A623';
          hoverBg = '#fbb33c';
        } else if (isAnswered) {
          bg = '#1ABE71';
          color = '#ffffff';
          borderColor = '#1ABE71';
          hoverBg = '#22d884';
        }

        return (
          <Button
            key={idx}
            onClick={() => onSelect(idx)}
            bg={bg}
            color={color}
            border="1px solid"
            borderColor={borderColor}
            w="44px"
            h="44px"
            borderRadius="md"
            fontSize="13px"
            fontWeight="bold"
            cursor="pointer"
            boxShadow={isCurrent ? '0 0 8px rgba(156, 85, 232, 0.4)' : 'none'}
            _hover={{
              bg: hoverBg,
              transform: 'translateY(-1px)',
              shadow: 'sm',
            }}
            transition="all 0.15s ease"
          >
            {idx + 1}
          </Button>
        );
      })}
    </SimpleGrid>
  );
}
