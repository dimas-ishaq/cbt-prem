'use client';

import { SimpleGrid, Button } from '@chakra-ui/react';

interface Props {
  questions: any[];
  currentIndex: number;
  onSelect: (index: number) => void;
  answeredQuestions: string[]; // questionIds
  flaggedQuestions: string[]; // questionIds
}

export function ExamNav({ questions, currentIndex, onSelect, answeredQuestions, flaggedQuestions }: Props) {
  return (
    <SimpleGrid columns={5} gap={2.5}>
      {questions.map((eq, idx) => {
        const questionId = eq.question.id;
        const isAnswered = answeredQuestions.includes(questionId);
        const isCurrent = currentIndex === idx;
        const isFlagged = flaggedQuestions.includes(questionId);

        let colorPalette = 'gray';
        let variant: 'solid' | 'outline' | 'subtle' = 'outline';

        if (isCurrent) {
          colorPalette = 'indigo';
          variant = 'solid';
        } else if (isFlagged) {
          colorPalette = 'amber';
          variant = 'solid';
        } else if (isAnswered) {
          colorPalette = 'emerald';
          variant = 'solid';
        }

        return (
          <Button
            key={idx}
            onClick={() => onSelect(idx)}
            colorPalette={colorPalette}
            variant={variant}
            w={11}
            h={11}
            borderRadius="xl"
            fontSize="sm"
            fontWeight="bold"
            cursor="pointer"
            boxShadow={isCurrent ? 'lg' : 'none'}
            transform={isCurrent ? 'scale(1.05)' : 'none'}
            zIndex={isCurrent ? 10 : 1}
            _hover={{ transform: 'scale(1.05)' }}
            transition="all 0.2s"
          >
            {idx + 1}
          </Button>
        );
      })}
    </SimpleGrid>
  );
}
