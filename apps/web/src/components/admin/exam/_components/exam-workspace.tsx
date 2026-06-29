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
    <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: 'minmax(0, 1fr) 360px' }} gap={6} fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif">
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
                bg={{ base: '#FFFFFF', _dark: '#2D2D2D' }}
                color={isFirstQuestion ? { base: '#94A3B8', _dark: '#8A8A8A' } : { base: '#1F2328', _dark: '#E0E0E0' }}
                border="1px solid"
                borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
                borderRadius="md"
                px={5}
                height="38px"
                fontSize="13px"
                fontWeight="bold"
                _hover={isFirstQuestion ? {} : { bg: { base: '#F9FAFC', _dark: '#3D3D3D' } }}
                cursor={isFirstQuestion ? 'not-allowed' : 'pointer'}
                opacity={isFirstQuestion ? 0.5 : 1}
                transition="all 0.15s ease"
              >
                Sebelumnya
              </Button>
              {!isLastQuestion ? (
                <Button
                  onClick={onNext}
                  bg="#9C55E8"
                  color="#ffffff"
                  border="1px solid"
                  borderColor="#9C55E8"
                  borderRadius="md"
                  px={5}
                  height="38px"
                  fontSize="13px"
                  fontWeight="bold"
                  _hover={{ bg: '#a86bf5' }}
                  cursor="pointer"
                  transition="all 0.15s ease"
                >
                  Selanjutnya
                </Button>
              ) : (
                <Button
                  onClick={onFinish}
                  bg={disableFinish ? { base: '#E1E4E8', _dark: '#2D2D2D' } : '#EF4444'}
                  color={disableFinish ? { base: '#94A3B8', _dark: '#8A8A8A' } : '#ffffff'}
                  border="1px solid"
                  borderColor={disableFinish ? { base: '#E1E4E8', _dark: '#3D3D3D' } : '#EF4444'}
                  borderRadius="md"
                  px={5}
                  height="38px"
                  fontSize="13px"
                  fontWeight="bold"
                  disabled={disableFinish}
                  _hover={disableFinish ? {} : { bg: '#D32F2F' }}
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
