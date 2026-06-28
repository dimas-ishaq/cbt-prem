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
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="text.primary" display="flex" alignItems="center" gap={2}>
            <Activity size={24} />
            Log Sistem
          </Heading>
          <Text fontSize="sm" color="text.secondary" mt={1}>
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
        <Box w={{ base: 'full', md: 72 }} bg="bg.surface" p={4} borderRadius="card" border="1px solid" borderColor="border.default" shadow="card-dark" alignSelf="start">
          <Heading size="xs" fontWeight="bold" color="text.muted" textTransform="uppercase" mb={3} letterSpacing="wider">
            Daftar Berkas Log
          </Heading>
          {isLoadingFiles ? (
            <Spinner size="sm" color="brand.text" />
          ) : (
            <Stack gap={1.5}>
              {files?.map((file: string) => {
                const isActive = selectedFile === file;
                return (
                  <Button
                    key={file}
                    size="sm"
                    variant={isActive ? 'solid' : 'ghost'}
                    colorPalette={isActive ? 'brand' : 'gray'}
                    justifyContent="start"
                    onClick={() => setSelectedFile(file)}
                    borderRadius="xl"
                    w="full"
                    gap={2.5}
                    cursor="pointer"
                  >
                    <FileText size={15} />
                    <Text truncate fontSize="xs" fontWeight="bold" color="text.primary">{file}</Text>
                  </Button>
                );
              })}
              {files?.length === 0 && (
                <Text fontSize="xs" color="text.muted" p={2}>Tidak ada berkas log.</Text>
              )}
            </Stack>
          )}
        </Box>

        {/* Right: Content Viewer */}
        <Box flex={1} bg="bg.surface" p={5} borderRadius="card" border="1px solid" borderColor="border.default" display="flex" flexDirection="column" h="65vh" shadow="card-dark">
          <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="border.default" pb={3} mb={4">
            <Text fontSize="xs" fontWeight="bold" color="text.muted" display="flex" alignItems="center" gap={2}>
              <FileText size={14} />
              {selectedFile || 'Pilih berkas...'}
            </Text>
            {isLoadingContent && <Spinner size="xs" color="brand.text" />}
          </Flex>

          <Box flex={1} overflowY="auto" fontFamily="mono" fontSize="11px" color="text.primary" whiteSpace="pre-wrap" bg="bg.elevated" p={4} borderRadius="xl" border="1px solid" borderColor="border.default" css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-border-default)', borderRadius: '10px' }
          }}>
            {logData?.content ? (
              logData.content
            ) : (
              <Flex h="full" align="center" justify="center" direction="column" color="text.secondary" py={12}>
                <Text>Belum ada data log yang dimuat.</Text>
              </Flex>
            )}
          </Box>
        </Box>
      </Flex>
    </Stack>
  );
}
