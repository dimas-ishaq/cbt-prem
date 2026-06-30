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
    <Box display="flex" flexDir={{ base: 'column', lg: 'row' }} gap={{ base: 4, lg: 5 }} fontFamily="body">
      <Box flex={1} minW={0}>
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
                px={{ base: 3, md: 5 }}
                height={{ base: '36px', md: '38px' }}
                fontSize={{ base: '12px', md: '13px' }}
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
                  px={{ base: 4, md: 5 }}
                  height={{ base: '36px', md: '38px' }}
                  fontSize={{ base: '12px', md: '13px' }}
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
                  px={{ base: 4, md: 5 }}
                  height={{ base: '36px', md: '38px' }}
                  fontSize={{ base: '12px', md: '13px' }}
                  fontWeight="bold"
                  disabled={disableFinish}
                  _hover={disableFinish ? {} : { bg: 'dd.status.danger.solid' }}
                  cursor={disableFinish ? 'not-allowed' : 'pointer'}
                  opacity={disableFinish ? 0.5 : 1}
                  transition="all 0.15s ease"
                >
                  <Box display={{ base: 'none', md: 'inline' }}>Selesaikan Ujian</Box>
                  <Box display={{ base: 'inline', md: 'none' }}>Selesai</Box>
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
