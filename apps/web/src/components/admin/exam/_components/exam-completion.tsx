'use client';

import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { keyframes } from '@emotion/react';

const scaleIn = keyframes`
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeUp = keyframes`
  0% { transform: translateY(24px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

interface ExamCompletionProps {
  subjectName?: string;
  examTitle?: string;
}

export function ExamCompletion({ subjectName, examTitle }: ExamCompletionProps) {
  const router = useRouter();

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={99999}
      bg="dd.canvas"
      align="center"
      justify="center"
      p={4}
      overflow="hidden"
      fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    >
      {/* Decorative background circles */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="dd.status.success.solid"
        opacity={{ base: 0.02, _dark: 0.04 }}
        filter="blur(80px)"
      />
      <Box
        position="absolute"
        bottom="-15%"
        left="-5%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="dd.brand"
        opacity={{ base: 0.02, _dark: 0.04 }}
        filter="blur(80px)"
      />

      <Box
        w="full"
        maxW="lg"
        textAlign="center"
        css={{ animation: `${fadeUp} 0.6s ease-out` }}
      >
        {/* Animated check icon */}
        <Flex
          w={20}
          h={20}
          bg="dd.status.success.bg"
          borderRadius="full"
          align="center"
          justify="center"
          mx="auto"
          mb={6}
          border="2px solid"
          borderColor="rgba(26, 190, 113, 0.3)"
          boxShadow="0 0 40px rgba(26, 190, 113, 0.1)"
          css={{ animation: `${scaleIn} 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), ${float} 3s ease-in-out 1s infinite` }}
        >
          <CheckCircle size={40} color="var(--chakra-colors-dd-status-success-solid)" strokeWidth={2.5} />
        </Flex>

        {/* Sparkle accent */}
        <Flex
          justify="center"
          gap={1}
          mb={3}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.2s both` }}
        >
          <Sparkles size={14} color="var(--chakra-colors-dd-status-warning-text)" />
          <Text
            fontSize="11px"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="var(--chakra-colors-dd-status-warning-text)"
          >
            Ujian Selesai
          </Text>
          <Sparkles size={14} color="var(--chakra-colors-dd-status-warning-text)" />
        </Flex>

        {/* Main heading */}
        <Heading
          size="xl"
          fontWeight="700"
          mb={3}
          color="dd.text"
          css={{
            animation: `${fadeUp} 0.6s ease-out 0.3s both`,
          }}
        >
          Terima Kasih! 🎉
        </Heading>

        {/* Subject info */}
        <Text
          fontSize="15px"
          color="dd.text.muted"
          lineHeight="tall"
          mb={3}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.4s both` }}
        >
          Kamu telah menyelesaikan ujian
        </Text>

        {subjectName && (
          <Box
            display="inline-block"
            px={4}
            py={1.5}
            mb={6}
            borderRadius="md"
            bg="dd.surface"
            border="1px solid"
            borderColor="dd.border"
            backdropFilter="blur(8px)"
            css={{ animation: `${fadeUp} 0.6s ease-out 0.5s both` }}
          >
            <Text
              fontSize="13px"
              fontWeight="bold"
              color="var(--chakra-colors-dd-status-success-text)"
            >
              📚 {subjectName}{examTitle ? ` — ${examTitle}` : ''}
            </Text>
          </Box>
        )}

        {/* Motivational card */}
        <Box
          p={5}
          mb={6}
          borderRadius="md"
          bg="dd.surface"
          border="1px solid"
          borderColor="dd.border"
          boxShadow="0 1px 4px rgba(0,0,0,0.05)"
          css={{ animation: `${fadeUp} 0.6s ease-out 0.6s both` }}
        >
          <Text fontSize="13px" color="dd.text" lineHeight="1.4">
            Jawabanmu sudah berhasil tersimpan dengan aman. Tetap semangat dan percaya pada hasil usahamu! 💪
          </Text>
          <Text fontSize="12px" color="dd.text.muted" mt={3}>
            Hasil ujian akan diumumkan oleh guru mata pelajaran.
          </Text>
        </Box>

        {/* CTA Button */}
        <Button
          size="lg"
          px={6}
          height="40px"
          borderRadius="md"
          fontWeight="bold"
          fontSize="13px"
          bg="dd.status.success.solid"
          color="white"
          _hover={{
            bg: 'dd.status.success.solid',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(26, 190, 113, 0.2)',
          }}
          transition="all 0.15s ease"
          onClick={() => router.push('/dashboard')}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.7s both` }}
        >
          Kembali ke Dashboard <ArrowRight size={14} style={{ marginLeft: 6 }} />
        </Button>
      </Box>
    </Flex>
  );
}
