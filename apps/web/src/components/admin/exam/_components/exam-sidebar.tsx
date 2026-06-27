import { Badge, Box, Flex, Grid, Text } from '@chakra-ui/react';
import { ExamNav } from './exam-nav';

type ExamQuestion = {
  id: string;
  question: {
    id: string;
  };
};

interface ExamSidebarProps {
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  flaggedQuestions: string[];
  onSelectQuestion: (index: number) => void;
}

export function ExamSidebar({ questions, currentIndex, answers, flaggedQuestions, onSelectQuestion }: ExamSidebarProps) {
  const answeredQuestions = Object.keys(answers).filter((k) => answers[k]?.trim());
  const totalQuestions = questions.length;
  const answeredCount = answeredQuestions.length;
  const flaggedCount = flaggedQuestions.length;
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  return (
    <Box w="360px" p={4} bg="white" borderRadius="3xl" border="1px solid" borderColor="gray.100" boxShadow="sm" h="fit-content" position={{ lg: 'sticky' }} top={{ lg: 6 }}>
      <Text fontSize="sm" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="0.12em" mb={4}>
        Navigasi Soal
      </Text>

      <Grid templateColumns="repeat(3, 1fr)" gap={3} mb={5}>
        <Box p={3} borderRadius="2xl" bg="emerald.50" border="1px solid" borderColor="emerald.100">
          <Text fontSize="xs" color="emerald.700" fontWeight="semibold">Dijawab</Text>
          <Text fontSize="2xl" fontWeight="bold" color="emerald.800">{answeredCount}</Text>
        </Box>
        <Box p={3} borderRadius="2xl" bg="gray.50" border="1px solid" borderColor="gray.100">
          <Text fontSize="xs" color="gray.600" fontWeight="semibold">Belum</Text>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">{unansweredCount}</Text>
        </Box>
        <Box p={3} borderRadius="2xl" bg="amber.50" border="1px solid" borderColor="amber.100">
          <Text fontSize="xs" color="amber.700" fontWeight="semibold">Ragu-ragu</Text>
          <Text fontSize="2xl" fontWeight="bold" color="amber.800">{flaggedCount}</Text>
        </Box>
      </Grid>

      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="sm" color="gray.600">Soal aktif</Text>
        <Badge colorPalette="indigo" variant="subtle" px={3} py={1} borderRadius="full">
          {currentIndex + 1} / {totalQuestions}
        </Badge>
      </Flex>

      <ExamNav
        questions={questions}
        currentIndex={currentIndex}
        onSelect={onSelectQuestion}
        answeredQuestions={answeredQuestions}
        flaggedQuestions={flaggedQuestions}
      />
    </Box>
  );
}
