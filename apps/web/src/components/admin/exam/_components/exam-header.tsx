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
      bg={{ base: '#FFFFFF', _dark: '#242424' }}
      borderBottom="1px solid"
      borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
      px={6}
      py={4}
      justify="space-between"
      align="center"
      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    >
      <Box>
        <Heading size="md" color={{ base: '#1F2328', _dark: '#E0E0E0' }} fontWeight="700">
          {title}
        </Heading>
        <Text fontSize="12px" color={{ base: '#57606A', _dark: '#8A8A8A' }} mt={0.5}>
          {subjectName}
        </Text>
      </Box>
      <ExamTimer startTime={startTime} duration={duration} overrideEndTime={overrideEndTime} onTimeUp={onTimeUp} />
      <Button
        bg={disableFinish ? { base: '#E1E4E8', _dark: '#2D2D2D' } : '#EF4444'}
        color={disableFinish ? { base: '#94A3B8', _dark: '#8A8A8A' } : '#ffffff'}
        onClick={onFinish}
        disabled={disableFinish}
        borderRadius="md"
        fontSize="13px"
        fontWeight="bold"
        px={4}
        height="36px"
        _hover={disableFinish ? {} : { bg: '#D32F2F' }}
        _active={disableFinish ? {} : { bg: '#C62828' }}
        cursor={disableFinish ? 'not-allowed' : 'pointer'}
        opacity={disableFinish ? 0.6 : 1}
        transition="all 0.15s ease"
      >
        <LogOut size={14} style={{ marginRight: 6 }} /> Selesai Ujian
      </Button>
    </Flex>
  );
}
