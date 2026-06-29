'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  Portal,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Activity, FileText, RefreshCw, Search, Settings, Trash2, Eraser } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirmation-dialog';

export default function AdminLogsPage() {
  const confirmDialog = useConfirm();
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [retentionDays, setRetentionDays] = useState<number>(0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const { data: files, isLoading: isLoadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['log-files'],
    queryFn: async () => {
      const response = await api.get('/logs/files');
      return response.data || [];
    },
  });

  // Fetch settings
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['log-settings'],
    queryFn: async () => {
      const res = await api.get('/logs/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (files && files.length > 0 && !selectedFile) setSelectedFile(files[0]);
  }, [files, selectedFile]);

  useEffect(() => {
    if (settingsData) {
      setRetentionDays(settingsData.logRetentionDays || 0);
    }
  }, [settingsData]);

  const { data: logData, isLoading: isLoadingContent, refetch: refetchContent } = useQuery({
    queryKey: ['log-content', selectedFile],
    queryFn: async () => {
      if (!selectedFile) return null;
      const response = await api.get(`/logs/content?file=${selectedFile}`);
      return response.data;
    },
    enabled: !!selectedFile,
  });

  const filteredFiles = useMemo(
    () => (files || []).filter((file: string) => file.toLowerCase().includes(searchTerm.toLowerCase())),
    [files, searchTerm]
  );

  const handleRefresh = () => {
    refetchFiles();
    refetchContent();
  };

  const handleClearLog = async () => {
    if (!selectedFile) return;
    const confirmed = await confirmDialog({ title: 'Kosongkan Log', description: `Kosongkan berkas log ${selectedFile}? Isi log hilang, file tetap ada.`, confirmText: 'Kosongkan' });
    if (!confirmed) return;
    setIsClearing(true);
    try {
      await api.post(`/logs/${selectedFile}/clear`);
      refetchContent();
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteLog = async () => {
    if (!selectedFile) return;
    const confirmed = await confirmDialog({ title: 'Hapus Log', description: `Hapus berkas log ${selectedFile} permanen? Aksi ini tidak bisa dibatalkan.`, confirmText: 'Hapus' });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await api.delete(`/logs/${selectedFile}`);
      setSelectedFile('');
      refetchFiles();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await api.post('/logs/settings', { logRetentionDays: retentionDays });
      refetchSettings();
      setIsSettingsOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <Stack gap={6} minH="calc(100vh - 180px)" overflow="hidden">
      <Flex justify="space-between" align="start" direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box maxW="2xl">
          <HStack gap={2} mb={2}>
            <Badge bg="brand.subtle" color="brand.text" border="1px solid" borderColor="border.default" borderRadius="full" px={3} py={1} textTransform="uppercase" letterSpacing="0.12em" fontSize="10px">
              System Logs
            </Badge>
          </HStack>
          <Heading size="lg" fontWeight="black" letterSpacing="tight" color="text.primary" display="flex" alignItems="center" gap={2}>
            <Activity size={24} />
            Log Sistem
          </Heading>
          <Text fontSize="sm" color="text.secondary" mt={2}>
            Cari, pilih, lalu baca log dalam panel fokus. Konfigurasi retensi penyimpanan otomatis untuk membersihkan log lama.
          </Text>
        </Box>
        <HStack gap={2} alignSelf={{ base: 'stretch', md: 'center' }}>
          <Button size="sm" variant="outline" onClick={() => setIsSettingsOpen(true)} borderRadius="full" cursor="pointer" gap={2}>
            <Settings size={15} />
            Pengaturan Retensi
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefresh} borderRadius="full" cursor="pointer" gap={2}>
            <RefreshCw size={15} />
            Segarkan
          </Button>
        </HStack>
      </Flex>

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }} flex={1} minH={0}>
        <Box w={{ base: 'full', lg: '340px' }} flexShrink={0} minW={0} bg="bg.surface" p={4} borderRadius="card" border="1px solid" borderColor="border.default" shadow="card-dark" overflow="hidden">
          <Flex justify="space-between" align="center" mb={3} gap={3}>
            <Heading size="xs" fontWeight="bold" color="text.muted" textTransform="uppercase" letterSpacing="wider">
              Daftar Berkas Log
            </Heading>
            <Badge bg="bg.subtle" color="text.secondary" borderRadius="full" px={2.5} fontSize="10px">{files?.length ?? 0}</Badge>
          </Flex>

          <Flex align="center" gap={2} mb={4} bg="bg.elevated" border="1px solid" borderColor="border.default" borderRadius="full" px={3} minW={0}>
            <Search size={14} color="var(--chakra-colors-text-muted)" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari file log..." size="sm" border="none" bg="transparent" px={0} minW={0} _focusVisible={{ boxShadow: 'none' }} />
          </Flex>

          {isLoadingFiles ? (
            <Flex py={8} justify="center">
              <Spinner size="sm" color="brand.text" />
            </Flex>
          ) : (
            <Box maxH={{ base: '36vh', lg: 'calc(100vh - 340px)' }} overflowY="auto" pr={1}>
              <Stack gap={2} minW={0}>
                {filteredFiles.map((file: string) => {
                  const isSelected = selectedFile === file;
                  return (
                    <Button
                      key={file}
                      variant={isSelected ? 'solid' : 'ghost'}
                      bg={isSelected ? 'brand.solid' : 'transparent'}
                      color={isSelected ? 'text.inverted' : 'text.primary'}
                      _hover={{ bg: isSelected ? 'brand.text' : 'bg.subtle' }}
                      size="sm"
                      width="full"
                      justifyContent="flex-start"
                      borderRadius="xl"
                      px={3}
                      py={5}
                      cursor="pointer"
                      onClick={() => setSelectedFile(file)}
                      minW={0}
                    >
                      <FileText size={15} />
                      <Text truncate fontSize="xs" fontWeight="bold" color={isSelected ? 'text.inverted' : 'text.primary'}>{file}</Text>
                    </Button>
                  );
                })}
                {files?.length === 0 && (
                  <Text fontSize="xs" color="text.muted" p={2}>Tidak ada berkas log.</Text>
                )}
              </Stack>
            </Box>
          )}
        </Box>

        <Box flex={1} minW={0} bg="bg.surface" p={5} borderRadius="card" border="1px solid" borderColor="border.default" shadow="card-dark" overflow="hidden" display="flex" flexDir="column">
          <Flex justify="space-between" align="center" borderBottom="1px solid" borderColor="border.default" pb={3} mb={4} gap={3} minW={0}>
            <Box minW={0}>
              <Text fontSize="xs" fontWeight="bold" color="text.muted" textTransform="uppercase" letterSpacing="0.12em" display="flex" alignItems="center" gap={2}>
                <FileText size={14} />
                File aktif
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="text.primary" truncate maxW="full">
                {selectedFile || 'Pilih berkas...'}
              </Text>
            </Box>
            <HStack gap={2} flexShrink={0}>
              <Badge bg="bg.subtle" color="text.secondary" borderRadius="full" px={2.5} fontSize="10px">
                {isLoadingContent ? 'Memuat' : 'Siap'}
              </Badge>
              {isLoadingContent && <Spinner size="xs" color="brand.text" />}
              {selectedFile && (
                <>
                  <Button size="2xs" variant="outline" colorPalette="orange" onClick={handleClearLog} loading={isClearing} borderRadius="md" cursor="pointer" gap={1}>
                    <Eraser size={11} />
                    Kosongkan
                  </Button>
                  <Button size="2xs" variant="outline" colorPalette="red" onClick={handleDeleteLog} loading={isDeleting} borderRadius="md" cursor="pointer" gap={1}>
                    <Trash2 size={11} />
                    Hapus
                  </Button>
                </>
              )}
            </HStack>
          </Flex>

          <Box
            flex={1}
            minH={0}
            overflow="auto"
            fontFamily="mono"
            fontSize="11px"
            lineHeight="1.6"
            color="text.primary"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
            bg="bg.elevated"
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="border.default"
            css={{
              '&::-webkit-scrollbar': { width: '6px', height: '6px' },
              '&::-webkit-scrollbar-thumb': { background: 'var(--chakra-colors-border-default)', borderRadius: '10px' },
            }}
          >
            {logData?.content ? (
              logData.content
            ) : (
              <Flex h="full" align="center" justify="center" direction="column" color="text.secondary" py={12} textAlign="center">
                <Activity size={28} />
                <Text mt={3} fontWeight="semibold">Belum ada data log yang dimuat.</Text>
                <Text mt={1} fontSize="xs" color="text.muted">Pilih file dari panel kiri.</Text>
              </Flex>
            )}
          </Box>
        </Box>
      </Flex>

      {/* Settings Dialog */}
      <Dialog.Root open={isSettingsOpen} onOpenChange={(details: any) => setIsSettingsOpen(details.open)} size="md">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="card" overflow="hidden" bg="bg.surface">
              <Dialog.Header bg="bg.subtle" py={4} borderBottom="1px solid" borderColor="border.default">
                <Dialog.Title fontSize="md" fontWeight="bold" color="text.primary" display="flex" alignItems="center" gap={2}>
                  <Settings size={18} /> Pengaturan Retensi Log
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={6}>
                <Stack gap={4}>
                  <Text fontSize="sm" color="text.secondary" lineHeight="relaxed">
                    Atur batas waktu penyimpanan berkas log sistem. Log yang lebih lama dari batas hari yang ditentukan akan dihapus otomatis setiap hari oleh background cronjob.
                  </Text>
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color="text.secondary" mb={2} textTransform="uppercase" letterSpacing="wider">
                      Masa Retensi Log (Hari):
                    </Text>
                    <Input
                      type="number"
                      value={retentionDays}
                      onChange={(e) => setRetentionDays(parseInt(e.target.value, 10) || 0)}
                      placeholder="Contoh: 30 (0 = Simpan selamanya)"
                      borderRadius="lg"
                      borderColor="border.default"
                      bg="bg.elevated"
                      _focus={{ borderColor: 'brand.solid' }}
                    />
                    <Text fontSize="2xs" color="text.muted" mt={1.5}>
                      Masukkan 0 untuk menonaktifkan penghapusan otomatis.
                    </Text>
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer p={6} borderTop="1px solid" borderColor="border.default">
                <Flex gap={3} width="full">
                  <Dialog.ActionTrigger asChild>
                    <Button type="button" variant="outline" borderRadius="lg" flex={1}>Batal</Button>
                  </Dialog.ActionTrigger>
                  <Button onClick={handleSaveSettings} flex={1} bg="brand.solid" color="text.inverted" borderRadius="lg" loading={isSavingSettings}>
                    Simpan Pengaturan
                  </Button>
                </Flex>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
