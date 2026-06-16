'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Stack,
  Button,
} from '@chakra-ui/react';
import { Activity, RefreshCw, FileText } from 'lucide-react';

export default function AdminLogsPage() {
  const [selectedFile, setSelectedFile] = useState<string>('');

  // Fetch list of files
  const { data: files, isLoading: isLoadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['log-files'],
    queryFn: async () => {
      const response = await api.get('/logs/files');
      const data = response.data || [];
      return data;
    },
  });

  // Automatically select the first file when the list is loaded
  useEffect(() => {
    if (files && files.length > 0 && !selectedFile) {
      setSelectedFile(files[0]);
    }
  }, [files, selectedFile]);

  // Fetch content of selected file
  const { data: logData, isLoading: isLoadingContent, refetch: refetchContent } = useQuery({
    queryKey: ['log-content', selectedFile],
    queryFn: async () => {
      if (!selectedFile) return null;
      const response = await api.get(`/logs/content?file=${selectedFile}`);
      return response.data;
    },
    enabled: !!selectedFile,
  });

  const handleRefresh = () => {
    refetchFiles();
    refetchContent();
  };

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center" direction={{ base: 'column', sm: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.800" display="flex" alignItems="center" gap={2}>
            <Activity size={24} className="text-indigo-600" />
            Log Sistem
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Pantau log aktivitas server, transaksi database, dan error secara real-time.
          </Text>
        </Box>
        <Flex gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            borderRadius="xl"
            cursor="pointer"
            gap={2}
          >
            <RefreshCw size={15} />
            Segarkan
          </Button>
        </Flex>
      </Flex>

      <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
        {/* Left: Files List */}
        <Box w={{ base: 'full', md: 72 }} bg="white" p={4} borderRadius="2xl" border="1px solid" borderColor="gray.200" alignSelf="start">
          <Heading size="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={3} letterSpacing="wider">
            Daftar Berkas Log
          </Heading>
          {isLoadingFiles ? (
            <Spinner size="sm" color="indigo.500" />
          ) : (
            <Stack gap={1.5}>
              {files?.map((file: string) => {
                const isActive = selectedFile === file;
                return (
                  <Button
                    key={file}
                    size="sm"
                    variant={isActive ? 'solid' : 'ghost'}
                    colorPalette={isActive ? 'indigo' : 'gray'}
                    justifyContent="start"
                    onClick={() => setSelectedFile(file)}
                    borderRadius="xl"
                    w="full"
                    gap={2.5}
                    cursor="pointer"
                  >
                    <FileText size={15} />
                    <Text truncate fontSize="xs" fontWeight="bold">{file}</Text>
                  </Button>
                );
              })}
              {files?.length === 0 && (
                <Text fontSize="xs" color="gray.400" p={2}>Tidak ada berkas log.</Text>
              )}
            </Stack>
          )}
        </Box>

        {/* Right: Content Viewer */}
        <Box flex={1} bg="gray.900" p={5} borderRadius="2xl" border="1px solid" borderColor="gray.800" display="flex" flexDirection="column" h="65vh">
          <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.800" pb={3} mb={4}>
            <Text fontSize="xs" fontWeight="bold" color="gray.400" display="flex" alignItems="center" gap={2}>
              <FileText size={14} />
              {selectedFile || 'Pilih berkas...'}
            </Text>
            {isLoadingContent && <Spinner size="xs" color="indigo.500" />}
          </Flex>

          <Box flex={1} overflowY="auto" fontFamily="mono" fontSize="11px" color="gray.200" whiteSpace="pre-wrap" bg="gray.950" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.50" css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: '10px' }
          }}>
            {logData?.content ? (
              logData.content
            ) : (
              <Flex h="full" align="center" justify="center" direction="column" color="gray.500" py={12}>
                <Text>Belum ada data log yang dimuat.</Text>
              </Flex>
            )}
          </Box>
        </Box>
      </Flex>
    </Stack>
  );
}
