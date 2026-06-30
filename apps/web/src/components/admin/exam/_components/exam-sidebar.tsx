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
    <Box
      w={{ base: 'full', lg: '360px' }}
      p={{ base: 3, md: 4 }}
      bg="dd.surface"
      borderRadius="card"
      border="1px solid"
      borderColor="dd.border"
      boxShadow={{ base: 'card-light', _dark: 'card-dark' }}
      h="fit-content"
      position={{ lg: 'sticky' }}
      top={{ lg: 6 }}
      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      minW={0}
    >
      <Text fontSize="11px" fontWeight="bold" color="dd.text.muted" textTransform="uppercase" letterSpacing="0.12em" mb={3}>
        Navigasi Soal
      </Text>

      <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={{ base: 2, md: 2.5 }} mb={5}>
        <Box p={{ base: 2, md: 3 }} borderRadius="badge" bg="dd.surface.alt" border="1px solid" borderColor="dd.border" borderTop="3px solid" borderTopColor="dd.status.success.solid">
          <Text fontSize="11px" color="dd.text.muted" fontWeight="semibold">Dijawab</Text>
          <Text fontSize={{ base: '18px', md: '20px' }} fontWeight="bold" color="dd.status.success.text" mt={1}>{answeredCount}</Text>
        </Box>
        <Box p={{ base: 2, md: 3 }} borderRadius="badge" bg="dd.surface.alt" border="1px solid" borderColor="dd.border" borderTop="3px solid" borderTopColor="dd.text.muted">
          <Text fontSize="11px" color="dd.text.muted" fontWeight="semibold">Belum</Text>
          <Text fontSize={{ base: '18px', md: '20px' }} fontWeight="bold" color="dd.text" mt={1}>{unansweredCount}</Text>
        </Box>
        <Box p={{ base: 2, md: 3 }} borderRadius="badge" bg="dd.surface.alt" border="1px solid" borderColor="dd.border" borderTop="3px solid" borderTopColor="dd.status.warning.solid">
          <Text fontSize="11px" color="dd.text.muted" fontWeight="semibold">Ragu-ragu</Text>
          <Text fontSize={{ base: '18px', md: '20px' }} fontWeight="bold" color="dd.status.warning.text" mt={1}>{flaggedCount}</Text>
        </Box>
      </Grid>

      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="13px" color="dd.text.muted">Soal aktif</Text>
        <Badge bg="dd.brand.subtle" color="dd.brand" border="1px solid" borderColor="dd.brand" px={3} py={0.5} borderRadius="badge" fontSize="11px" fontWeight="bold">
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
