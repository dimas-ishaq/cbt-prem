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
    <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 360px' }} gap={5} fontFamily="body">
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
            <Flex mt={5} gap={3} justify="space-between" flexWrap="wrap">
              <Button
                onClick={onPrevious}
                disabled={isFirstQuestion}
                bg="dd.surface"
                color={isFirstQuestion ? 'dd.text.muted' : 'dd.text'}
                border="1px solid"
                borderColor="dd.border"
                borderRadius="card"
                px={5}
                height="38px"
                fontSize="13px"
                fontWeight="bold"
                _hover={isFirstQuestion ? {} : { bg: 'dd.canvas' }}
                cursor={isFirstQuestion ? 'not-allowed' : 'pointer'}
                opacity={isFirstQuestion ? 0.5 : 1}
                transition="all 0.15s ease"
              >
                Sebelumnya
              </Button>
              {!isLastQuestion ? (
                <Button
                  onClick={onNext}
                  bg="dd.brand"
                  color="white"
                  border="1px solid"
                  borderColor="dd.brand"
                  borderRadius="card"
                  px={5}
                  height="38px"
                  fontSize="13px"
                  fontWeight="bold"
                  _hover={{ bg: 'dd.brand.hover' }}
                  cursor="pointer"
                  transition="all 0.15s ease"
                >
                  Selanjutnya
                </Button>
              ) : (
                <Button
                  onClick={onFinish}
                  bg={disableFinish ? 'dd.surface.alt' : 'dd.status.danger.solid'}
                  color={disableFinish ? 'dd.text.muted' : 'white'}
                  border="1px solid"
                  borderColor={disableFinish ? 'dd.border' : 'dd.status.danger.solid' }
                  borderRadius="card"
                  px={5}
                  height="38px"
                  fontSize="13px"
                  fontWeight="bold"
                  disabled={disableFinish}
                  _hover={disableFinish ? {} : { bg: 'dd.status.danger.solid' }}
                  cursor={disableFinish ? 'not-allowed' : 'pointer'}
                  opacity={disableFinish ? 0.5 : 1}
                  transition="all 0.15s ease"
                >
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
