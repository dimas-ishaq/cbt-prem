import { Box, Button, Flex } from '@chakra-ui/react';
import { ExamSidebar } from './exam-sidebar';
import { QuestionCard } from './question-card';

type ExamOption = {
  id: string;
  content: string;
};

type ExamQuestion = {
  id: string;
  question: {
    id: string;
    content: string;
    type: string;
    options: ExamOption[];
    mediaUrl?: string;
    mediaType?: string;
  };
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
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  disableFinish?: boolean;
}

export function ExamWorkspace({ currentQuestion, currentQuestionIndex, answers, flaggedQuestions, onAnswer, onToggleFlag, questions, onSelectQuestion, onPrevious, onNext, onFinish, disableFinish }: ExamWorkspaceProps) {
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 360px' }} gap={6}>
      <Box>
        {currentQuestion && (
          <>
            <QuestionCard
              question={currentQuestion.question}
              index={currentQuestionIndex}
              selectedAnswer={answers[currentQuestion.question.id]}
              onAnswer={(answer) => onAnswer(currentQuestion.question.id, answer)}
              isFlagged={flaggedQuestions.includes(currentQuestion.question.id)}
              onToggleFlag={() => onToggleFlag(currentQuestion.question.id)}
            />
            <Flex mt={6} gap={3} justify="space-between" flexWrap="wrap">
              <Button onClick={onPrevious} disabled={isFirstQuestion} variant="outline" borderRadius="xl" px={6}>
                Sebelumnya
              </Button>
              {!isLastQuestion ? (
                <Button onClick={onNext} colorPalette="indigo" borderRadius="xl" px={6}>
                  Selanjutnya
                </Button>
              ) : (
                <Button onClick={onFinish} colorPalette={disableFinish ? 'gray' : 'red'} borderRadius="xl" px={6} disabled={disableFinish}>
                  Selesaikan Ujian
                </Button>
              )}
            </Flex>
          </>
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
