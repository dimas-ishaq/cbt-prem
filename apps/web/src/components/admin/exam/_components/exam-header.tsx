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
    <Flex
      as="header"
      bg="dd.surface"
      borderBottom="1px solid"
      borderColor="dd.border"
      px={6}
      py={4}
      justify="space-between"
      align="center"
      fontFamily="body"
    >
      <Box>
        <Heading size="md" color="dd.text" fontWeight="700">
          {title}
        </Heading>
        <Text fontSize="12px" color="dd.text.muted" mt={0.5}>
          {subjectName}
        </Text>
      </Box>
      <ExamTimer startTime={startTime} duration={duration} overrideEndTime={overrideEndTime} onTimeUp={onTimeUp} />
      <Button
        bg={disableFinish ? 'dd.surface.alt' : 'dd.status.danger.solid'}
        color={disableFinish ? 'dd.text.muted' : 'white'}
        onClick={onFinish}
        disabled={disableFinish}
        borderRadius="card"
        fontSize="13px"
        fontWeight="bold"
        px={4}
        height="36px"
        _hover={disableFinish ? {} : { bg: 'dd.status.danger.solid' }}
        _active={disableFinish ? {} : { bg: 'dd.status.danger.solid' }}
        cursor={disableFinish ? 'not-allowed' : 'pointer'}
        opacity={disableFinish ? 0.6 : 1}
        transition="all 0.15s ease"
      >
        <LogOut size={14} style={{ marginRight: 6 }} /> Selesai Ujian
      </Button>
    </Flex>
  );
}
