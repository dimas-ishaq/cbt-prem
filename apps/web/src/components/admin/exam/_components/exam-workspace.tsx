import { Box } from '@chakra-ui/react';
import { QuestionCard } from './question-card';
import { ExamNav } from './exam-nav';

type ExamQuestion = {
  id: string;
  question: unknown;
};

interface ExamWorkspaceProps {
  currentQuestion: ExamQuestion | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: string[];
  onAnswer: (questionId: string, answer: string) => void;
  onToggleFlag: (questionId: string) => void;
  questions: ExamQuestion[];
  onSelectQuestion: (index: number) => void;
}

export function ExamWorkspace({ currentQuestion, currentQuestionIndex, answers, flaggedQuestions, onAnswer, onToggleFlag, questions, onSelectQuestion }: ExamWorkspaceProps) {
  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 360px' }} gap={6} p={8}>
      <Box>
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion.question}
            index={currentQuestionIndex}
            selectedAnswer={answers[currentQuestion.id]}
            onAnswer={(answer) => onAnswer(currentQuestion.id, answer)}
            isFlagged={flaggedQuestions.includes(currentQuestion.id)}
            onToggleFlag={() => onToggleFlag(currentQuestion.id)}
          />
        )}
      </Box>
      <ExamSidebar
        questions={questions}
        currentIndex={currentQuestionIndex}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        onSelectQuestion={onSelectQuestion}
      />
    </Box>
  );
}
