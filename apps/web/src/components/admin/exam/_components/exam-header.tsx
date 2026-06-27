import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { LogOut } from 'lucide-react';
import { ExamTimer } from './exam-timer';

interface ExamHeaderProps {
  title: string;
  subjectName?: string;
  startTime: string;
  duration: number;
  overrideEndTime?: string;
  onTimeUp: () => void;
  onFinish: () => void;
  disableFinish?: boolean;
}

export function ExamHeader({ title, subjectName, startTime, duration, overrideEndTime, onTimeUp, onFinish, disableFinish }: ExamHeaderProps) {
  return (
    <Flex as="header" bg="white" borderBottom="1px solid" borderColor="gray.100" px={6} py={4} justify="space-between" align="center">
      <Box>
        <Heading size="md">{title}</Heading>
        <Text fontSize="sm" color="gray.500">{subjectName}</Text>
      </Box>
      <ExamTimer startTime={startTime} duration={duration} overrideEndTime={overrideEndTime} onTimeUp={onTimeUp} />
      <Button colorPalette={disableFinish ? 'gray' : 'red'} onClick={onFinish} disabled={disableFinish}>
        <LogOut size={16} /> Selesai Ujian
      </Button>
    </Flex>
  );
}
