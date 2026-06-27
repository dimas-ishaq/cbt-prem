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
      bg="linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)"
      align="center"
      justify="center"
      p={4}
      overflow="hidden"
    >
      {/* Decorative background circles */}
      <Box
        position="absolute"
        top="-20%"
        right="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="emerald.500"
        opacity={0.03}
        filter="blur(80px)"
      />
      <Box
        position="absolute"
        bottom="-15%"
        left="-5%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="indigo.500"
        opacity={0.04}
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
          w={24}
          h={24}
          bg="emerald.500/15"
          borderRadius="full"
          align="center"
          justify="center"
          mx="auto"
          mb={8}
          border="3px solid"
          borderColor="emerald.400/40"
          boxShadow="0 0 60px rgba(16, 185, 129, 0.15)"
          css={{ animation: `${scaleIn} 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), ${float} 3s ease-in-out 1s infinite` }}
        >
          <CheckCircle size={48} color="#34d399" strokeWidth={2.5} />
        </Flex>

        {/* Sparkle accent */}
        <Flex
          justify="center"
          gap={1}
          mb={4}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.2s both` }}
        >
          <Sparkles size={16} color="#fbbf24" />
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="amber.400"
          >
            Ujian Selesai
          </Text>
          <Sparkles size={16} color="#fbbf24" />
        </Flex>

        {/* Main heading */}
        <Heading
          size="2xl"
          fontWeight="black"
          mb={3}
          css={{
            animation: `${fadeUp} 0.6s ease-out 0.3s both`,
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Terima Kasih! 🎉
        </Heading>

        {/* Subject info */}
        <Text
          fontSize="lg"
          color="gray.300"
          lineHeight="tall"
          mb={3}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.4s both` }}
        >
          Kamu telah menyelesaikan ujian
        </Text>

        {subjectName && (
          <Box
            display="inline-block"
            px={5}
            py={2}
            mb={6}
            borderRadius="2xl"
            bg="whiteAlpha.100"
            border="1px solid"
            borderColor="whiteAlpha.200"
            backdropFilter="blur(8px)"
            css={{ animation: `${fadeUp} 0.6s ease-out 0.5s both` }}
          >
            <Text
              fontSize="md"
              fontWeight="bold"
              css={{
                background: 'linear-gradient(90deg, #6ee7b7, #34d399, #6ee7b7)',
                backgroundSize: '200% auto',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: `${shimmer} 3s linear infinite`,
              }}
            >
              📚 {subjectName}{examTitle ? ` — ${examTitle}` : ''}
            </Text>
          </Box>
        )}

        {/* Motivational card */}
        <Box
          p={6}
          mb={8}
          borderRadius="3xl"
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.100"
          css={{ animation: `${fadeUp} 0.6s ease-out 0.6s both` }}
        >
          <Text fontSize="md" color="gray.300" lineHeight="tall">
            Jawabanmu sudah berhasil tersimpan dengan aman. Tetap semangat dan percaya pada hasil usahamu! 💪
          </Text>
          <Text fontSize="sm" color="gray.500" mt={3}>
            Hasil ujian akan diumumkan oleh guru mata pelajaran.
          </Text>
        </Box>

        {/* CTA Button */}
        <Button
          size="lg"
          px={8}
          borderRadius="2xl"
          fontWeight="bold"
          bg="linear-gradient(135deg, #10b981, #059669)"
          color="white"
          _hover={{
            bg: 'linear-gradient(135deg, #059669, #047857)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)',
          }}
          transition="all 0.2s ease"
          onClick={() => router.push('/dashboard')}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.7s both` }}
        >
          Kembali ke Dashboard <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </Button>
      </Box>
    </Flex>
  );
}
