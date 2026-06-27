import { Box } from '@chakra-ui/react';
import { ExamNav } from './exam-nav';

type ExamQuestion = {
  id: string;
};

interface ExamSidebarProps {
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: string[];
  onSelectQuestion: (index: number) => void;
}

export function ExamSidebar({ questions, currentIndex, answers, flaggedQuestions, onSelectQuestion }: ExamSidebarProps) {
  return (
    <Box w="360px" p={4}>
      <ExamNav
        questions={questions}
        currentIndex={currentIndex}
        onSelect={onSelectQuestion}
        answeredQuestions={Object.keys(answers).filter((k) => answers[k]?.trim())}
        flaggedQuestions={flaggedQuestions}
      />
    </Box>
  );
}

