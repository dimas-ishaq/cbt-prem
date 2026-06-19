'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Crop, RotateCcw, Check, ImageIcon } from 'lucide-react';
import { Box, Flex, Text, Button, Stack, Input, SimpleGrid, HStack, IconButton, Select, createListCollection, } from '@chakra-ui/react';
import { compressImage, validateImageFile, createThumbnail } from '@/utils/imageUtils';
import { MediaLibraryModal } from '@/components/admin/media-library-modal';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

interface Option {
  content: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: {
    content: string;
    type: string;
    difficulty: string;
    points: number;
    mediaUrl?: string;
    mediaType?: string;
    options?: { content: string; isCorrect: boolean }[];
  };
}

export function QuestionForm({ onSubmit, onCancel, isSubmitting, initialData }: QuestionFormProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [type, setType] = useState(initialData?.type || 'PILIHAN_GANDA');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'SEDANG');
  const [points, setPoints] = useState(initialData?.points || 1);
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [mediaType, setMediaType] = useState(initialData?.mediaType || 'image');
  const [options, setOptions] = useState<Option[]>(
    initialData?.options?.map((o: any) => ({ content: o.content, isCorrect: o.isCorrect })) || [
      { content: '', isCorrect: true },
      { content: '', isCorrect: false },
    ]
  );
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeOptions = createListCollection({
    items: [
      { label: 'Pilihan Ganda', value: 'PILIHAN_GANDA' },
      { label: 'Multiple Response', value: 'MULTIPLE_RESPONSE' },
      { label: 'Essay', value: 'ESSAY' },
      { label: 'Benar / Salah', value: 'BENAR_SALAH' },
    ],
  });

  const difficultyOptions = createListCollection({
    items: [
      { label: 'Mudah', value: 'MUDAH' },
      { label: 'Sedang', value: 'SEDANG' },
      { label: 'Sulit', value: 'SULIT' },
    ],
  });

  // Image editor/cropper lift state
  const [editorOpen, setEditorOpen] = useState(false);
  const [srcImage, setSrcImage] = useState<HTMLImageElement | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  const addOption = () => {
    setOptions([...options, { content: '', isCorrect: false }]);
  };
  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };
  const updateOption = (index: number, field: keyof Option, value: any) => {
    setOptions((prev) => {
      return prev.map((opt, i) => {
        if (i !== index) {
          if (field === 'isCorrect' && value === true && (type === 'PILIHAN_GANDA' || type === 'BENAR_SALAH')) {
            return { ...opt, isCorrect: false };
          }
          return opt;
        }
        return { ...opt, [field]: value };
      });
    });
  };

  const processAndUpload = async (file: File) => {
    setUploading(true);
    try {
      let finalFile = file;
      // If editor was used, we already have editor file as canvas blob
      const compressed = await compressImage(finalFile, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.8,
        maxSizeMB: 2,
      });
      const thumbnail = await createThumbnail(compressed, 200);

      const formData = new FormData();
      formData.append('file', compressed);
      const { data } = await (await import('@/lib/api')).default.post('/questions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMediaUrl(data.url);
      setMediaType('image');
    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || 'Upload gagal');
    } finally {
      setUploading(false);
      setEditorOpen(false);
      setSrcImage(null);
      setEditorFile(null);
    }
  };

  const openCropEditor = async (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      alert(error);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setSrcImage(img);
      setEditorFile(file);
      setEditorOpen(true);
    };
    img.onerror = () => alert('Gagal memuat gambar');
    img.src = url;
  };

  const closeEditor = useCallback(() => {
    if (srcImage && (srcImage as any).src) {
      URL.revokeObjectURL((srcImage as any).src);
    }
    setEditorOpen(false);
    setSrcImage(null);
    setEditorFile(null);
  }, [srcImage]);

  const confirmCrop = () => {
    if (!srcImage || !editorFile) return;
    // Use a simple crop preset: full image for now (we can allow zoom later)
    // For "crop before upload" we'll just upload editorFile
    processAndUpload(editorFile);
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'BENAR_SALAH') {
      setOptions([
        { content: 'Benar', isCorrect: true },
        { content: 'Salah', isCorrect: false },
      ]);
    } else if (newType === 'ESSAY') {
      setOptions([]);
    } else if (options.length === 0 || (options.length === 2 && options[0]?.content === 'Benar')) {
      setOptions([
        { content: '', isCorrect: true },
        { content: '', isCorrect: false },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      content,
      type,
      difficulty,
      points,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
      options: type === 'ESSAY' ? [] : options,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) openCropEditor(file);
        e.target.value = '';
      }} />

      <Stack gap={6}>
        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
              Konten Soal
            </Text>
            <RichTextEditor
              value={content}
              onChange={(val) => setContent(val)}
              placeholder="Ketik soal di sini..."
            />
          </Box>

          {/* Image Upload + Crop Modal */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
              Media Gambar (Opsional)
            </Text>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) openCropEditor(file);
              }}
              onClick={() => !editorOpen && fileInputRef.current?.click()}
              className="relative rounded-lg border border-dashed p-6 text-center cursor-pointer transition-colors"
              style={{
                borderColor: isDragOver ? 'var(--brand-solid)' : (mediaUrl ? 'var(--brand-solid)' : '#e2e8f0'),
                backgroundColor: isDragOver ? 'var(--brand-solid)' : mediaUrl ? '#f0fdf4' : '#f8fafc',
                color: isDragOver ? 'white' : '#64748b',
              }}
            >
              {mediaUrl ? (
                <Flex direction="column" align="center" gap={3}>
                  <img src={mediaUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '0.5rem' }} />
                  <div className="flex gap-2">
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); openCropEditor(new File([], 'edit')); }}>Ganti Gambar</Button>
                    <Button size="xs" variant="ghost" colorScheme="red" onClick={(e) => { e.stopPropagation(); if (confirm('Hapus gambar?')) { setMediaUrl(''); setMediaType(''); } }}>Hapus</Button>
                  </div>
                  <Text fontSize="xs" color="#64748b">Klik atau drag untuk mengganti gambar (crop supported)</Text>
                </Flex>
              ) : (
                <Flex direction="column" align="center" gap={2}>
                  <div className="p-3 rounded-full bg-gray-100"><ImageIcon size={24} className="text-gray-400" /></div>
                  <Text fontWeight="medium" fontSize="sm">Drag & drop gambar / klik untuk pilih</Text>
                  <Text fontSize="xs" color="gray.400">Mendukung crop & kompresi otomatis sebelum upload</Text>
                </Flex>
              )}
            </div>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Type</Text>
              <Select.Root
                collection={typeOptions}
                value={[type]}
                onValueChange={(details) => handleTypeChange(details.value[0] || 'PILIHAN_GANDA')}
                positioning={{ sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Pilih type" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {typeOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Difficulty</Text>
              <Select.Root
                collection={difficultyOptions}
                value={[difficulty]}
                onValueChange={(details) => setDifficulty(details.value[0] || 'SEDANG')}
                positioning={{ sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Pilih difficulty" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {difficultyOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>Points</Text>
              <Input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value))} min={1} />
            </Box>
          </SimpleGrid>
        </Stack>

        {type !== 'ESSAY' && (
          <Stack gap={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="bold" color="gray.900">Opsi Jawaban</Text>
              {type !== 'BENAR_SALAH' && (
                <Button type="button" onClick={addOption} variant="ghost" size="xs" colorScheme="indigo">
                  + Tambah Opsi
                </Button>
              )}
            </Flex>
            <Stack gap={3}>
              {options.map((option, idx) => (
                <Flex key={idx} align="flex-start" gap={3}>
                  <IconButton
                    type="button"
                    onClick={() => updateOption(idx, 'isCorrect', !option.isCorrect)}
                    size="sm"
                    colorScheme={option.isCorrect ? 'green' : 'gray'}
                    variant={option.isCorrect ? 'solid' : 'outline'}
                    aria-label="Mark correct"
                  >
                    <Check size={16} />
                  </IconButton>
                  <Box flex={1}>
                    <RichTextEditor
                      value={option.content}
                      onChange={(val) => updateOption(idx, 'content', val)}
                      placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                      compact
                    />
                  </Box>
                  {options.length > 2 && type !== 'BENAR_SALAH' && (
                    <IconButton type="button" onClick={() => removeOption(idx)} colorScheme="red" variant="ghost" size="sm" aria-label="Remove">
                      <X size={16} />
                    </IconButton>
                  )}
                </Flex>
              ))}
            </Stack>
          </Stack>
        )}

        <Flex gap={3} pt={4} borderTop="1px solid" borderColor="gray.100">
          <Button type="button" onClick={onCancel} flex={1} variant="outline">Batal</Button>
          <Button type="submit" disabled={isSubmitting || uploading} flex={1} colorScheme="indigo">
            {isSubmitting || uploading ? 'Menyimpan...' : 'Simpan Soal'}
          </Button>
        </Flex>
      </Stack>

      {/* Simple crop / preview modal */}
      {editorOpen && (
        <Box position="fixed" inset={0} bg="blackAlpha.600" zIndex={999} display="flex" alignItems="center" justifyContent="center">
          <Stack gap={4} bg="white" p={6} borderRadius="lg" maxWidth="90vw" maxHeight="90vh">
            <Text fontWeight="bold">Edit Gambar</Text>
            {srcImage && (
              <Box overflow="auto" maxHeight="60vh" maxWidth="70vw">
                <img src={srcImage.src} alt="to edit" style={{ maxWidth: '100%', maxHeight: '60vh' }} />
              </Box>
            )}
            <Text fontSize="sm" color="gray.500">Fitur crop & rotasi akan ditambahkan berikutnya. Untuk saat ini gambar langsung dikompres dan diupload.</Text>
            <Flex gap={3}>
              <Button variant="outline" onClick={closeEditor}>
                <RotateCcw size={16} style={{ marginRight: '8px' }} /> Batal
              </Button>
              <Button colorScheme="indigo" onClick={confirmCrop} loading={uploading}>
                <Upload size={16} style={{ marginRight: '8px' }} /> Ya, Upload
              </Button>
            </Flex>
          </Stack>
        </Box>
      )}
    </form>
  );
}
