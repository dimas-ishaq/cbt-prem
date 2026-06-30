import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { LogOut } from 'lucide-react';
import { ExamTimer } from './exam-timer';
import { ColorModeToggle } from '@/components/ui/color-mode-toggle';

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
      align={{ base: 'center', md: 'center' }}
      gap={3}
      flexDir={{ base: 'column', md: 'row' }}
      fontFamily="body"
    >
      <Box flex={{ md: 1 }} minW={0} textAlign={{ base: 'center', md: 'left' }}>
        <Heading size="md" color="dd.text" fontWeight="700" fontSize={{ base: '16px', md: 'md' }} noOfLines={1}>
          {title}
        </Heading>
        <Text fontSize={{ base: '11px', md: '12px' }} color="dd.text.muted" mt={0.5} noOfLines={1}>
          {subjectName}
        </Text>
      </Box>

      <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
        <ExamTimer startTime={startTime} duration={duration} overrideEndTime={overrideEndTime} onTimeUp={onTimeUp} serverTime={serverTime} />
        <ColorModeToggle size="sm" />
      </Box>

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
        w={{ base: 'auto', md: 'auto' }}
        alignSelf="center"
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
