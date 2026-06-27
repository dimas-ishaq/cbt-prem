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
        const examQuestionId = eq.id;
        const isAnswered = answeredQuestions.includes(examQuestionId);
        const isCurrent = currentIndex === idx;
        const isFlagged = flaggedQuestions.includes(examQuestionId);

        let colorPalette = 'gray';
        let variant: 'solid' | 'outline' | 'subtle' = 'outline';
        let customStyles = {};

        if (isCurrent) {
          colorPalette = 'indigo';
          variant = 'solid';
        } else if (isFlagged) {
          variant = 'solid';
          customStyles = {
            bg: 'orange.400',
            color: 'white',
            borderColor: 'orange.500',
            _hover: { bg: 'orange.500', transform: 'translateY(-2px)', shadow: 'md' },
          };
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
            _hover={isCurrent ? { transform: 'scale(1.05) translateY(-2px)', shadow: 'xl' } : undefined}
            transition="all 0.2s"
            {...customStyles}
          >
            {idx + 1}
          </Button>
        );
      })}
    </SimpleGrid>
  );
}
