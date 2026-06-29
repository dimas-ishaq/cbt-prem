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

        let bg: string | Record<string, string> = 'dd.surface.alt';
        let color: string | Record<string, string> = 'dd.text';
        let borderColor: string | Record<string, string> = 'dd.border';
        let hoverBg: string | Record<string, string> = 'dd.surface';

        if (isCurrent) {
          bg = 'dd.brand';
          color = 'white';
          borderColor = 'dd.brand';
          hoverBg = 'dd.brand.hover';
        } else if (isFlagged) {
          bg = 'dd.status.warning.solid';
          color = 'white';
          borderColor = 'dd.status.warning.solid';
          hoverBg = 'dd.status.warning.text';
        } else if (isAnswered) {
          bg = 'dd.status.success.solid';
          color = 'white';
          borderColor = 'dd.status.success.solid';
          hoverBg = 'dd.status.success.text';
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
            boxShadow={isCurrent ? '0 0 0 1px var(--chakra-colors-dd-brand)' : 'none'}
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
