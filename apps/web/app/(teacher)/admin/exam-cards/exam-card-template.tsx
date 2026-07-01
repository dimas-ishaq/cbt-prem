'use client';

import React from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Flex, Text, Separator } from '@chakra-ui/react';
import { GraduationCap } from 'lucide-react';

export interface StudentCardData {
  id: string;
  nis: string;
  user: {
    fullName: string;
    username: string;
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
  schoolLogoUrl?: string;
}

export const ExamCardTemplate: React.FC<ExamCardTemplateProps> = ({
  student,
  examGroupName,
  headmasterName,
  headmasterNip,
  cardDate,
  schoolLogoUrl,
}) => {
  // ponytail: must match parsePayload in exam-attendance.service.ts. Add signed token later if spoof appears.
  const qrValue = JSON.stringify({
    studentId: student.id,
    nis: student.nis,
    rombelName: student.rombel?.name ?? null,
  });

  return (
    <Box
      w="100%"
      border="1.5px dashed"
      borderColor="border.strong"
      borderRadius="md"
      pt={4}
      px={4}
      pb={5}
      bg="bg.surface"
      color="text.primary"
      fontSize="xs"
      position="relative"
      boxSizing="border-box"
      pageBreakInside="avoid"
      style={{ breakInside: 'avoid' }}
    >
      <Flex align="center" gap={3} mb={2} justifyContent="center" alignItems="center">
        <Flex
          w={10}
          h={10}
          bg="white"
          border="1px solid"
          borderColor="border.brand"
          align="center"
          justify="center"
          borderRadius="md"
          color="brand.text"
          overflow="hidden"
        >
          {schoolLogoUrl ? (
            <Image src={schoolLogoUrl} alt="Logo sekolah" width={40} height={40} style={{ objectFit: 'contain' }} />
          ) : (
            <GraduationCap size={20} />
          )}
        </Flex>
        <Box flex={1} textAlign="center" justifyContent="center">
          <Text fontWeight="extrabold" fontSize="18px" textTransform="uppercase" letterSpacing="wide" color="text.primary">
            KARTU PESERTA UJIAN
          </Text>
          <Text fontWeight="bold" fontSize="14px" color="brand.text" lineHeight="1.25" pb="8px">
            {examGroupName || 'UJIAN BERBASIS KOMPUTER'}
          </Text>
        </Box>
      </Flex>

      <Separator borderColor="border.strong" mb={3} />

      <Flex gap={2} mb={3}>
        <Box flex={1}>
          <Flex direction="column" gap={1.5}>
            <Flex>
              <Text w="75px" fontWeight="bold" color="text.secondary" fontSize="9px">NAMA</Text>
              <Text w="8px" color="text.muted">:</Text>
              <Text flex={1} fontWeight="bold" fontSize="10px" textTransform="uppercase" lineClamp={1}>
                {student.user.fullName}
              </Text>
            </Flex>
            <Flex>
              <Text w="75px" fontWeight="bold" color="text.secondary" fontSize="9px">NIS/NISN</Text>
              <Text w="8px" color="text.muted">:</Text>
              <Text flex={1} fontFamily="mono" fontSize="9.5px">
                {student.nis || '-'}
              </Text>
            </Flex>
            <Flex>
              <Text w="75px" fontWeight="bold" color="text.secondary" fontSize="9px">ROMBEL</Text>
              <Text w="8px" color="text.muted">:</Text>
              <Text flex={1} fontSize="9.5px">
                {student.rombel?.name || '-'}
              </Text>
            </Flex>
            <Flex>
              <Text w="75px" fontWeight="bold" color="text.secondary" fontSize="9px">JURUSAN</Text>
              <Text w="8px" color="text.muted">:</Text>
              <Text flex={1} fontSize="9.5px" lineClamp={1}>
                {student.major?.name || '-'}
              </Text>
            </Flex>
          </Flex>

          <Box
            mt={3}
            p={2}
            bg="bg.subtle"
            border="1px dashed"
            borderColor="border.strong"
            borderRadius="md"
          >
            <Text fontSize="9px" color="text.secondary" lineHeight="1.4">
              QR dipakai untuk check-in hadir ujian oleh guru/pengawas.
            </Text>
          </Box>
        </Box>

        <Flex
          direction="column"
          align="center"
          justify="center"
          p={1.5}
          border="1px solid"
          borderColor="border.strong"
          borderRadius="md"
          bg="bg.surface"
          w="75px"
          h="75px"
          flexShrink={0}
        >
          <QRCodeSVG value={qrValue} size={64} level="L" />
        </Flex>
      </Flex>

      <Flex justify="space-between" align="flex-end" mt={2} pt={1}>
        <Box fontSize="7.5px" color="text.muted">
          * Simpan kartu ini untuk check-in hadir.
        </Box>
        <Box textAlign="center" w="110px" minH="50px">
          <Text fontSize="8px" mb={1}>{cardDate || 'Mengetahui,'}</Text>
          <Text fontSize="8px" fontWeight="bold">Kepala Sekolah</Text>
          <Box h="16px" />
          <Text fontSize="8px" fontWeight="bold" textDecoration="underline" lineHeight="1.25" pb="8px">
            {headmasterName || '--------------------'}
          </Text>
          {headmasterNip && (
            <Text fontSize="7px" color="text.secondary">
              NIP. {headmasterNip}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
};
