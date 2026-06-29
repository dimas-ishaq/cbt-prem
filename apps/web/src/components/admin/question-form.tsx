'use client';

import { useCallback, useRef, useState } from 'react';
import { Check, ImageIcon, RotateCcw, Upload, X } from 'lucide-react';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  createListCollection,
  HStack,
  Separator,
  Spinner,
} from '@chakra-ui/react';
import { compressImage, createThumbnail, validateImageFile } from '@/utils/imageUtils';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toaster';

type Option = {
  content: string;
  isCorrect: boolean;
};

type QuestionFormProps = {
  onSubmit: (data: {
    content: string;
    type: string;
    difficulty: string;
    points: number;
    mediaUrl?: string;
    mediaType?: string;
    options: Option[];
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: {
    content: string;
    type: string;
    difficulty: string;
    points: number;
    mediaUrl?: string;
    mediaType?: string;
    options?: Option[];
  };
};

type ApiError = { response?: { data?: { message?: string } } };

export function QuestionForm({ onSubmit, onCancel, isSubmitting, initialData }: QuestionFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialData?.content || '');
  const [type, setType] = useState(initialData?.type || 'PILIHAN_GANDA');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'SEDANG');
  const [points, setPoints] = useState(initialData?.points || 1);
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [mediaType, setMediaType] = useState(initialData?.mediaType || 'image');
  const [options, setOptions] = useState<Option[]>(initialData?.options?.map((o) => ({ content: o.content, isCorrect: o.isCorrect })) || [{ content: '', isCorrect: true }, { content: '', isCorrect: false }]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [srcImage, setSrcImage] = useState<HTMLImageElement | null>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  const typeOptions = createListCollection({ items: [{ label: 'Pilihan Ganda', value: 'PILIHAN_GANDA' }, { label: 'Multiple Response', value: 'MULTIPLE_RESPONSE' }, { label: 'Essay', value: 'ESSAY' }, { label: 'Benar / Salah', value: 'BENAR_SALAH' }] });
  const difficultyOptions = createListCollection({ items: [{ label: 'Mudah', value: 'MUDAH' }, { label: 'Sedang', value: 'SEDANG' }, { label: 'Sulit', value: 'SULIT' }] });

  const addOption = () => setOptions([...options, { content: '', isCorrect: false }]);
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index: number, field: keyof Option, value: string | boolean) => {
    setOptions((prev) => prev.map((opt, i) => {
      if (i !== index) return field === 'isCorrect' && value === true && (type === 'PILIHAN_GANDA' || type === 'BENAR_SALAH') ? { ...opt, isCorrect: false } : opt;
      return { ...opt, [field]: value } as Option;
    }));
  };

  const processAndUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 720, quality: 0.8, maxSizeMB: 2 });
      await createThumbnail(compressed, 200);
      const formData = new FormData();
      formData.append('file', compressed);
      const api = (await import('@/lib/api')).default;
      const { data } = await api.post('/questions/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMediaUrl(data.url);
      setMediaType('image');
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error ? ((error as ApiError).response?.data?.message || 'Upload gagal') : 'Upload gagal';
      toast.error(message);
    } finally {
      setUploading(false);
      setEditorOpen(false);
      setSrcImage(null);
      setEditorFile(null);
    }
  };

  const openCropEditor = (file: File) => {
    const error = validateImageFile(file);
    if (error) return toast.error(error);
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setSrcImage(img);
      setEditorFile(file);
      setEditorOpen(true);
    };
    img.onerror = () => toast.error('Gagal memuat gambar');
    img.src = url;
  };

  const closeEditor = useCallback(() => {
    if (srcImage?.src) URL.revokeObjectURL(srcImage.src);
    setEditorOpen(false);
    setSrcImage(null);
    setEditorFile(null);
  }, [srcImage]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'BENAR_SALAH') setOptions([{ content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false }]);
    else if (newType === 'ESSAY') setOptions([]);
    else if (options.length === 0 || (options.length === 2 && options[0]?.content === 'Benar')) setOptions([{ content: '', isCorrect: true }, { content: '', isCorrect: false }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ content, type, difficulty, points, mediaUrl: mediaUrl || undefined, mediaType: mediaUrl ? mediaType : undefined, options: type === 'ESSAY' ? [] : options });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) openCropEditor(file); e.target.value = ''; }} />
      <Stack gap={6}>
        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={1}>{t('questionContentLabel')}</Text>
            <RichTextEditor value={content} onChange={setContent} placeholder={t('questionPlaceholder')} />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={2}>{t('questionMediaLabel')}</Text>
            <Box
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) openCropEditor(file); }}
              onClick={() => fileInputRef.current?.click()}
              borderWidth="2px"
              borderStyle="dashed"
              borderRadius="lg"
              p={6}
              textAlign="center"
              cursor="pointer"
              transition="colors 0.15s"
              borderColor={isDragOver ? 'brand.text' : 'border.default'}
              bg={isDragOver ? 'brand.subtle' : 'bg.subtle'}
              _hover={{ borderColor: 'brand.muted', bg: 'bg.surface' }}
            >
              {mediaUrl ? (
                <Flex direction="column" align="center" gap={3}>
                  <img src={mediaUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px' }} />
                  <HStack gap={2}>
                    <Button size="xs" variant="ghost" color="brand.text" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>{t('changeImageLabel')}</Button>
                    <Button size="xs" variant="ghost" color="status.danger.text" onClick={(e) => { e.stopPropagation(); if (confirm(t('deleteImageConfirmConfirm') || 'Hapus gambar?')) { setMediaUrl(''); setMediaType(''); } }}>{t('deleteImageLabel')}</Button>
                  </HStack>
                  <Text fontSize="xs" color="text.muted">{t('dragDropImageLabel')}</Text>
                </Flex>
              ) : (
                <Flex direction="column" align="center" gap={2}>
                  <Flex p={3} borderRadius="full" bg="bg.subtle" color="text.muted">
                    <ImageIcon size={24} />
                  </Flex>
                  <Text fontWeight="medium" fontSize="sm">{t('dragDropImageLabel')}</Text>
                  <Text fontSize="xs" color="text.muted">{t('imageUploadDesc')}</Text>
                </Flex>
              )}
            </Box>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={1}>{t('typeLabel')}</Text>
              <Select.Root collection={typeOptions} value={[type]} onValueChange={(details) => handleTypeChange(details.value[0] || 'PILIHAN_GANDA')} positioning={{ sameWidth: true }}>
                <Select.HiddenSelect />
                <Select.Control><Select.Trigger borderRadius="md" borderColor="input.border" bg="input.bg"><Select.ValueText placeholder={t('questionTypePILIHAN_GANDA')} /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
                <Select.Positioner><Select.Content>{typeOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
              </Select.Root>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={1}>{t('difficultyLabel')}</Text>
              <Select.Root collection={difficultyOptions} value={[difficulty]} onValueChange={(details) => setDifficulty(details.value[0] || 'SEDANG')} positioning={{ sameWidth: true }}>
                <Select.HiddenSelect />
                <Select.Control><Select.Trigger borderRadius="md" borderColor="input.border" bg="input.bg"><Select.ValueText placeholder={t('difficultyMUDAH')} /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
                <Select.Positioner><Select.Content>{difficultyOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
              </Select.Root>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={1}>{t('pointsLabel')}</Text>
              <Input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 0)} min={1} borderRadius="md" borderColor="input.border" bg="input.bg" _focus={{ borderColor: 'input.focus.border' }} />
            </Box>
          </SimpleGrid>
        </Stack>

        {type !== 'ESSAY' && (
          <Stack gap={4}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="bold" color="text.primary">{t('answerOptionsLabel')}</Text>
              {type !== 'BENAR_SALAH' && <Button type="button" onClick={addOption} variant="ghost" size="xs" colorPalette="brand">{t('addOptionBtn')}</Button>}
            </Flex>
            <Stack gap={3}>
              {options.map((option, idx) => (
                <Flex key={idx} align="flex-start" gap={3}>
                  <IconButton
                    type="button"
                    onClick={() => updateOption(idx, 'isCorrect', !option.isCorrect)}
                    size="sm"
                    colorPalette={option.isCorrect ? 'success' : undefined}
                    variant={option.isCorrect ? 'solid' : 'outline'}
                    aria-label="Mark correct"
                    borderColor={option.isCorrect ? undefined : 'border.default'}
                  >
                    <Check size={16} />
                  </IconButton>
                  <Box flex={1}><RichTextEditor value={option.content} onChange={(val) => updateOption(idx, 'content', val)} placeholder={t('optionPlaceholder', { letter: String.fromCharCode(65 + idx) })} compact /></Box>
                  {options.length > 2 && type !== 'BENAR_SALAH' && <IconButton type="button" onClick={() => removeOption(idx)} colorPalette="red" variant="ghost" size="sm" aria-label="Remove"><X size={16} /></IconButton>}
                </Flex>
              ))}
            </Stack>
          </Stack>
        )}

        <Separator borderColor="border.default" />
        <Flex gap={3}>
          <Button type="button" onClick={onCancel} flex={1} variant="outline" borderColor="border.default" color="text.secondary" _hover={{ bg: 'bg.subtle' }} borderRadius="md">{t('cancel')}</Button>
          <Button type="submit" disabled={isSubmitting || uploading} flex={1} colorPalette="brand" borderRadius="md" loading={isSubmitting || uploading} bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }}>
            {isSubmitting || uploading ? t('savingQuestion') : t('saveQuestion')}
          </Button>
        </Flex>
      </Stack>

      {editorOpen && (
        <Box position="fixed" inset={0} bg="rgba(6,9,15,0.7)" backdropFilter="blur(6px)" zIndex={999} display="flex" alignItems="center" justifyContent="center">
          <Stack gap={4} bg="bg.surface" p={6} borderRadius="card" maxW="90vw" maxH="90vh" borderWidth="1px" borderColor="border.default" shadow="elevated">
            <Text fontWeight="bold" color="text.primary">{t('editImageTitle')}</Text>
            {srcImage && <Box overflow="auto" maxH="60vh" maxW="70vw"><img src={srcImage.src} alt="to edit" style={{ maxWidth: '100%', maxHeight: '60vh' }} /></Box>}
            <Text fontSize="sm" color="text.muted">{t('cropFeatureComingSoon')}</Text>
            <HStack gap={3}>
              <Button variant="outline" borderColor="border.default" color="text.secondary" _hover={{ bg: 'bg.subtle' }} borderRadius="md" onClick={closeEditor} gap={2}><RotateCcw size={16} />{t('cancel')}</Button>
              <Button colorPalette="brand" borderRadius="md" onClick={() => editorFile && processAndUpload(editorFile)} disabled={uploading} bg="brand.solid" color="text.inverted" _hover={{ bg: 'brand.text' }} gap={2}>
                {uploading ? <Spinner size="sm" /> : <Upload size={16} />}
                {t('uploadImageBtn')}
              </Button>
            </HStack>
          </Stack>
        </Box>
      )}
    </form>
  );
}
