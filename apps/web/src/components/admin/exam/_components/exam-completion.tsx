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
      bg={{ base: '#F4F5F7', _dark: '#1B1B1B' }}
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
        bg="#1ABE71"
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
        bg="#9C55E8"
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
          bg="rgba(26, 190, 113, 0.15)"
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
          <CheckCircle size={40} color="#1ABE71" strokeWidth={2.5} />
        </Flex>

        {/* Sparkle accent */}
        <Flex
          justify="center"
          gap={1}
          mb={3}
          css={{ animation: `${fadeUp} 0.6s ease-out 0.2s both` }}
        >
          <Sparkles size={14} color="#F5A623" />
          <Text
            fontSize="11px"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="#F5A623"
          >
            Ujian Selesai
          </Text>
          <Sparkles size={14} color="#F5A623" />
        </Flex>

        {/* Main heading */}
        <Heading
          size="xl"
          fontWeight="700"
          mb={3}
          color={{ base: '#1F2328', _dark: '#E0E0E0' }}
          css={{
            animation: `${fadeUp} 0.6s ease-out 0.3s both`,
          }}
        >
          Terima Kasih! 🎉
        </Heading>

        {/* Subject info */}
        <Text
          fontSize="15px"
          color={{ base: '#57606A', _dark: '#8A8A8A' }}
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
            bg={{ base: '#FFFFFF', _dark: 'rgba(255, 255, 255, 0.06)' }}
            border="1px solid"
            borderColor={{ base: '#E1E4E8', _dark: 'rgba(255, 255, 255, 0.12)' }}
            backdropFilter="blur(8px)"
            css={{ animation: `${fadeUp} 0.6s ease-out 0.5s both` }}
          >
            <Text
              fontSize="13px"
              fontWeight="bold"
              color="#1ABE71"
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
          bg={{ base: '#FFFFFF', _dark: '#242424' }}
          border="1px solid"
          borderColor={{ base: '#E1E4E8', _dark: '#3D3D3D' }}
          boxShadow="0 1px 4px rgba(0,0,0,0.05)"
          css={{ animation: `${fadeUp} 0.6s ease-out 0.6s both` }}
        >
          <Text fontSize="13px" color={{ base: '#1F2328', _dark: '#E0E0E0' }} lineHeight="1.4">
            Jawabanmu sudah berhasil tersimpan dengan aman. Tetap semangat dan percaya pada hasil usahamu! 💪
          </Text>
          <Text fontSize="12px" color={{ base: '#57606A', _dark: '#8A8A8A' }} mt={3}>
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
          bg="linear-gradient(135deg, #10b981, #059669)"
          color="white"
          _hover={{
            bg: 'linear-gradient(135deg, #059669, #047857)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
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
