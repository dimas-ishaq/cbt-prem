'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Flex, Text, Separator } from '@chakra-ui/react';

import { GraduationCap } from 'lucide-react';

export interface StudentCardData {
  id: string;
  nis: string;
  user: {
    fullName: string;
    username: string;
    plainPassword?: string | null;
  };
  rombel?: {
    name: string;
  } | null;
  major?: {
    name: string;
  } | null;
}

interface ExamCardTemplateProps {
  student: StudentCardData;
  examGroupName: string;
  headmasterName: string;
  headmasterNip: string;
  cardDate: string;
}

export const ExamCardTemplate: React.FC<ExamCardTemplateProps> = ({
  student,
  examGroupName,
  headmasterName,
  headmasterNip,
  cardDate,
}) => {
  // Verification URL or generic info for QR Code
  const qrValue = `${window.location.origin}/login?username=${student.user.username}`;

  return (
    <Box
      w="100%"
      border="1.5px dashed"
      borderColor="gray.500"
      borderRadius="md"
      pt={4}
      px={4}
      pb={5}
      bg="white"
      color="black"
      fontSize="xs"
      position="relative"
      boxSizing="border-box"
      pageBreakInside="avoid"
      style={{ breakInside: 'avoid' }}
    >
      {/* Header */}
      <Flex align="center" gap={3} mb={2} justifyContent="center" alignItems="center">
        {/* Placeholder Logo Sekolah */}
        <Flex
          w={10}
          h={10}
          bg="indigo.50"
          border="1px solid"
          borderColor="indigo.200"
          align="center"
          justify="center"
          borderRadius="md"
          color="indigo.600"
        >
          <GraduationCap size={20} />
        </Flex>
        <Box flex={1} textAlign="center" justifyContent="center">
          <Text fontWeight="extrabold" fontSize="18px" textTransform="uppercase" letterSpacing="wide" color="gray.850">
            KARTU PESERTA UJIAN
          </Text>
          <Text fontWeight="bold" fontSize="14px" color="indigo.700" lineHeight="1.25" pb="8px">
            {examGroupName || 'UJIAN BERBASIS KOMPUTER'}
          </Text>
        </Box>
      </Flex>

      <Separator borderColor="gray.800" mb={3} />

      {/* Main Content Info */}
      <Flex gap={2} mb={3}>
        {/* Profile Info */}
        <Box flex={1}>
          <Flex direction="column" gap={1.5}>
            <Flex>
              <Text w="75px" fontWeight="bold" color="gray.600" fontSize="9px">NAMA</Text>
              <Text w="8px" color="gray.500">:</Text>
              <Text flex={1} fontWeight="bold" fontSize="10px" textTransform="uppercase" lineClamp={1}>
                {student.user.fullName}
              </Text>
            </Flex>
            <Flex>
              <Text w="75px" fontWeight="bold" color="gray.600" fontSize="9px">NIS/NISN</Text>
              <Text w="8px" color="gray.500">:</Text>
              <Text flex={1} fontFamily="mono" fontSize="9.5px">
                {student.nis || '-'}
              </Text>
            </Flex>
            <Flex>
              <Text w="75px" fontWeight="bold" color="gray.600" fontSize="9px">ROMBEL</Text>
              <Text w="8px" color="gray.500">:</Text>
              <Text flex={1} fontSize="9.5px">
                {student.rombel?.name || '-'}
              </Text>
            </Flex>
            <Flex>
              <Text w="75px" fontWeight="bold" color="gray.600" fontSize="9px">JURUSAN</Text>
              <Text w="8px" color="gray.500">:</Text>
              <Text flex={1} fontSize="9.5px" lineClamp={1}>
                {student.major?.name || '-'}
              </Text>
            </Flex>
          </Flex>

          {/* Credentials Block */}
          <Box
            mt={3}
            p={2}
            bg="gray.50"
            border="1px dashed"
            borderColor="gray.800"
            borderRadius="md"
          >
            <Flex justify="space-between" mb={1}>
              <Text fontSize="9px" fontWeight="bold" color="gray.650">USERNAME:</Text>
              <Text fontSize="9.5px" fontWeight="bold" fontFamily="mono">{student.user.username}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="9px" fontWeight="bold" color="gray.650">PASSWORD:</Text>
              <Text fontSize="9.5px" fontWeight="bold" fontFamily="mono">{student.user.plainPassword || '******'}</Text>
            </Flex>
          </Box>
        </Box>

        {/* QR Code Block */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={1.5}
          border="1px solid"
          borderColor="gray.850"
          borderRadius="md"
          bg="white"
          w="75px"
          h="75px"
          flexShrink={0}
        >
          <QRCodeSVG value={qrValue} size={64} level="L" />
        </Flex>
      </Flex>

      {/* Signature Section */}
      <Flex justify="space-between" align="flex-end" mt={2} pt={1}>
        <Box fontSize="7.5px" color="gray.500">
          * Simpan kartu ini untuk login ujian.
        </Box>
        <Box textAlign="center" w="110px" minH="50px">
          <Text fontSize="8px" mb={1}>{cardDate || 'Mengetahui,'}</Text>
          <Text fontSize="8px" fontWeight="bold">Kepala Sekolah</Text>
          <Box h="16px" /> {/* Signature space */}
          <Text fontSize="8px" fontWeight="bold" textDecoration="underline" lineHeight="1.25" pb="8px">
            {headmasterName || '--------------------'}
          </Text>
          {headmasterNip && (
            <Text fontSize="7px" color="gray.600">
              NIP. {headmasterNip}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
};
