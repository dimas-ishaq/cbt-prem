'use client';
import { useState, useEffect } from 'react';
import { Box, Flex, Text, Button, SimpleGrid, Image, Spinner, IconButton } from '@chakra-ui/react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (url: string) => void;
}

export function MediaLibraryModal({ isOpen, onClose, onImageSelect }: MediaLibraryModalProps) {
  const [media, setMedia] = useState<Array<{url: string; name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/questions/media');
      setMedia(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat perpustakaan media');
      toast.error('Gagal memuat perpustakaan media');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Box position="fixed" inset={0} bg="blackAlpha.600" zIndex={1000} display="flex" alignItems="center" justifyContent="center">
      <Box bg="white" borderRadius="md" maxWidth="720px" width="95%" maxHeight="85vh" display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor="gray.200">
          <Text fontWeight="bold" fontSize="lg">Perpustakaan Media</Text>
          <IconButton aria-label="Tutup" size="sm" variant="ghost" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </Flex>
        <Box overflowY="auto" p={4} flex={1}>
          {loading ? (
            <Flex justify="center" align="center" py={8} gap={2}>
              <Spinner size="sm" />
              <Text>Memuat...</Text>
            </Flex>
          ) : error ? (
            <Flex direction="column" align="center" py={8} gap={3}>
              <Text color="red.500">{error}</Text>
              <Button size="sm" variant="outline" onClick={fetchMedia}>Coba Lagi</Button>
            </Flex>
          ) : media.length === 0 ? (
            <Flex direction="column" align="center" py={8} gap={3}>
              <Text color="gray.500">Belum ada gambar yang diunggah.</Text>
              <Button size="sm" variant="outline" colorScheme="teal" onClick={fetchMedia}>Muat Ulang</Button>
            </Flex>
          ) : (
            <SimpleGrid columns={{ base: 3, sm: 4, md: 5 }} gap={3}>
              {media.map((item, index) => (
                <Box
                  key={index}
                  position="relative"
                  borderWidth="1px"
                  borderRadius="md"
                  overflow="hidden"
                  borderColor="gray.200"
                  _hover={{ borderColor: 'teal.500', transform: 'scale(1.02)', transition: 'transform 0.2s' }}
                  cursor="pointer"
                  onClick={() => {
                    onImageSelect(item.url);
                    onClose();
                  }}
                >
                  <Image src={item.url} alt={item.name} objectFit="cover" width="100%" height={100} />
                  <Box position="absolute" bottom={0} left={0} right={0} p={1} bg="rgba(0,0,0,0.6)" textAlign="center" color="white" fontSize="xs">
                    {item.name.length > 14 ? item.name.slice(0, 14) + '...' : item.name}
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
        <Flex justify="flex-end" p={3} borderTop="1px solid" borderColor="gray.200">
          <Button variant="outline" size="sm" onClick={onClose}>Tutup</Button>
        </Flex>
      </Box>
    </Box>
  );
}
