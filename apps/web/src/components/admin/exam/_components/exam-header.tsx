import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { LogOut } from 'lucide-react';
import { ExamTimer } from './exam-timer';

interface ExamHeaderProps {
  title: string;
  subjectName?: string;
  startTime: string;
  duration: number;
  overrideEndTime?: string;
  serverTime?: string;
  onTimeUp: () => void;
  onFinish: () => void;
  disableFinish?: boolean;
}

export function ExamHeader({ title, subjectName, startTime, duration, overrideEndTime, serverTime, onTimeUp, onFinish, disableFinish }: ExamHeaderProps) {
  return (
    <Flex
      as="header"
      bg="dd.surface"
      borderBottom="1px solid"
      borderColor="dd.border"
      px={{ base: 3, md: 6 }}
      py={{ base: 3, md: 4 }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      gap={2}
      flexWrap="wrap"
      fontFamily="body"
    >
      <Box flex="1" minW="0">
        <Heading size="md" color="dd.text" fontWeight="700" fontSize={{ base: '16px', md: 'md' }} noOfLines={1}>
          {title}
        </Heading>
        <Text fontSize={{ base: '11px', md: '12px' }} color="dd.text.muted" mt={0.5} noOfLines={1}>
          {subjectName}
        </Text>
      </Box>
      <ExamTimer startTime={startTime} duration={duration} overrideEndTime={overrideEndTime} onTimeUp={onTimeUp} serverTime={serverTime} />
      <Button
        bg={disableFinish ? 'dd.surface.alt' : 'dd.status.danger.solid'}
        color={disableFinish ? 'dd.text.muted' : 'white'}
        onClick={onFinish}
        disabled={disableFinish}
        borderRadius="card"
        fontSize={{ base: '12px', md: '13px' }}
        fontWeight="bold"
        px={{ base: 3, md: 4 }}
        height="36px"
        whiteSpace="nowrap"
        flexShrink={0}
        _hover={disableFinish ? {} : { bg: 'dd.status.danger.solid' }}
        _active={disableFinish ? {} : { bg: 'dd.status.danger.solid' }}
        cursor={disableFinish ? 'not-allowed' : 'pointer'}
        opacity={disableFinish ? 0.6 : 1}
        transition="all 0.15s ease"
      >
        <LogOut size={14} style={{ marginRight: 4 }} />
        <Box display={{ base: 'none', md: 'inline' }}>Selesai Ujian</Box>
        <Box display={{ base: 'inline', md: 'none' }}>Selesai</Box>
      </Button>
    </Flex>
  );
}
