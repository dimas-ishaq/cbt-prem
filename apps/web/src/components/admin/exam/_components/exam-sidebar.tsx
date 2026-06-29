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
      w="360px"
      p={4}
      bg={{ base: '#FFFFFF', _dark: '#242424' }}
      borderRadius="md"
      border="1px solid"
      borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
      boxShadow="0 1px 4px rgba(0,0,0,0.05)"
      h="fit-content"
      position={{ lg: 'sticky' }}
      top={{ lg: 6 }}
      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    >
      <Text fontSize="11px" fontWeight="bold" color={{ base: '#57606A', _dark: '#8A8A8A' }} textTransform="uppercase" letterSpacing="0.12em" mb={3}>
        Navigasi Soal
      </Text>

      <Grid templateColumns="repeat(3, 1fr)" gap={2.5} mb={5}>
        <Box p={3} borderRadius="md" bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} borderTop="3px solid #1ABE71">
          <Text fontSize="11px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontWeight="semibold">Dijawab</Text>
          <Text fontSize="20px" fontWeight="bold" color="#1ABE71" mt={1}>{answeredCount}</Text>
        </Box>
        <Box p={3} borderRadius="md" bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} borderTop="3px solid #8A8A8A">
          <Text fontSize="11px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontWeight="semibold">Belum</Text>
          <Text fontSize="20px" fontWeight="bold" color={{ base: '#1F2328', _dark: '#E0E0E0' }} mt={1}>{unansweredCount}</Text>
        </Box>
        <Box p={3} borderRadius="md" bg={{ base: '#F9FAFC', _dark: '#1B1B1B' }} border="1px solid" borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }} borderTop="3px solid #F5A623">
          <Text fontSize="11px" color={{ base: '#57606A', _dark: '#8A8A8A' }} fontWeight="semibold">Ragu-ragu</Text>
          <Text fontSize="20px" fontWeight="bold" color="#F5A623" mt={1}>{flaggedCount}</Text>
        </Box>
      </Grid>

      <Flex align="center" justify="space-between" mb={4}>
        <Text fontSize="13px" color={{ base: '#57606A', _dark: '#8A8A8A' }}>Soal aktif</Text>
        <Badge bg="rgba(156, 85, 232, 0.15)" color="#9C55E8" border="1px solid" borderColor="rgba(156, 85, 232, 0.3)" px={3} py={0.5} borderRadius="md" fontSize="11px" fontWeight="bold">
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
