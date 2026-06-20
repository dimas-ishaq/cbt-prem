'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Stack,
  Spinner,
  Image,
  Card,
  HStack,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { Settings, Save, ShieldAlert, Upload, Trash2, Globe, Heart, Languages, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const timezones = [
  { label: 'Asia/Jakarta (WIB)', value: 'Asia/Jakarta' },
  { label: 'Asia/Makassar (WITA)', value: 'Asia/Makassar' },
  { label: 'Asia/Jayapura (WIT)', value: 'Asia/Jayapura' },
];

const languages = [
  { label: 'Bahasa Indonesia', value: 'id' },
  { label: 'English', value: 'en' },
];

const academicYearOptions = [
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
];

const timezoneOptions = createListCollection({
  items: timezones.map((tz) => ({ label: tz.label, value: tz.value })),
});

const languageOptions = createListCollection({
  items: languages.map((lang) => ({ label: lang.label, value: lang.value })),
});

const academicYearSelectOptions = createListCollection({
  items: academicYearOptions.map((year) => ({ label: `Tahun Pelajaran ${year}`, value: year })),
});

export default function SettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [appName, setAppName] = useState('Novatech CBT');
  const [logoUrl, setLogoUrl] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [language, setLanguage] = useState('id');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [dragActive, setDragActive] = useState(false);

  // Strict role check
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName || 'Novatech CBT');
      setLogoUrl(settings.logoUrl || '');
      setTimezone(settings.timezone || 'Asia/Jakarta');
      setLanguage(settings.language || 'id');
      setAcademicYear(settings.academicYear || '2024/2025');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return api.post('/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Pengaturan berhasil disimpan!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan.');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ appName, logoUrl, timezone, language, academicYear });
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error('Ukuran file maksimal 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 256;
        canvas.width = size;
        canvas.height = size;

        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
        if (img.width > img.height) {
          sWidth = img.height;
          sx = (img.width - img.height) / 2;
        } else if (img.height > img.width) {
          sHeight = img.width;
          sy = (img.height - img.width) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
        const base64Data = canvas.toDataURL('image/png');
        setLogoUrl(base64Data);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <Flex direction="column" align="center" justify="center" py={20} gap={4}>
        <ShieldAlert size={48} color="#f43f5e" />
        <Heading size="md" color="text.primary">Akses Ditolak</Heading>
        <Text color="text.secondary">Hanya Super Admin yang dapat mengakses menu pengaturan ini.</Text>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
      </Flex>
    );
  }

  return (
    <Stack gap={8} maxW="4xl" position="relative">
      {/* Decorative Blur Backgrounds */}
      <Box
        position="absolute"
        top="-20px"
        right="-50px"
        w="250px"
        h="250px"
        borderRadius="full"
        bg="indigo.500"
        style={{ filter: 'blur(100px)', opacity: 0.08, zIndex: 0 }}
      />

      {/* Header Section */}
      <Box position="relative" zIndex={1}>
        <Heading
          size="2xl"
          fontWeight="900"
          letterSpacing="tight"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 50%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          display="flex"
          alignItems="center"
          gap={3}
        >
          <Settings size={32} className="text-indigo-600 animate-spin" style={{ animationDuration: '8s' }} />
          {t('settingsTitle')}
        </Heading>
        <Text color="text.secondary" mt={2} fontSize="md">
          {t('settingsDesc')}
        </Text>
      </Box>

      {/* Main Form Layout */}
      <Stack gap={6} position="relative" zIndex={1}>
        
        {/* Brand & Logo Card */}
        <Box
          bg="bg.surface"
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.default"
          boxShadow="0 10px 30px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.01)"
          p={8}
          transition="all 0.25s"
          _hover={{ borderColor: 'indigo.200', boxShadow: '0 12px 36px -8px rgba(99,102,241,0.06)' }}
        >
          <Stack gap={6}>
            <Box pb={4} borderBottom="1px solid" borderColor="border.default">
              <Heading size="md" fontWeight="bold" color="text.primary">
                Identitas Ujian & Logo
              </Heading>
              <Text fontSize="xs" color="text.secondary" mt={0.5}>
                Sesuaikan nama dan logo instansi yang akan dilihat oleh seluruh peserta ujian dan guru.
              </Text>
            </Box>

            {/* Application Name */}
            <Stack gap={2}>
              <Text fontWeight="bold" color="text.primary" fontSize="sm">
                {t('appNameLabel')}
              </Text>
              <Input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Novatech CBT"
                bg="bg.canvas"
                borderRadius="xl"
                h={12}
                px={4}
                borderColor="border.default"
                _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px #4f46e5', bg: 'bg.surface' }}
                transition="all 0.15s"
              />
            </Stack>

            {/* Logo Upload Zone */}
            <Stack gap={3}>
              <Text fontWeight="bold" color="text.primary" fontSize="sm">
                {t('logoLabel')}
              </Text>
              
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={6}
                align={{ base: 'stretch', md: 'center' }}
              >
                {/* Drag Drop Area */}
                <Flex
                  flex={1}
                  direction="column"
                  align="center"
                  justify="center"
                  border="2px dashed"
                  borderColor={dragActive ? 'indigo.500' : 'border.default'}
                  bg={dragActive ? 'rgba(99,102,241,0.03)' : 'bg.canvas'}
                  borderRadius="2xl"
                  p={6}
                  minH="120px"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  transition="all 0.25s"
                  _hover={{ borderColor: 'indigo.400', bg: 'rgba(99,102,241,0.01)', transform: 'translateY(-1px)' }}
                >
                  <Upload size={24} className={dragActive ? 'text-indigo-600 animate-bounce' : 'text-gray-400'} />
                  <Text fontSize="sm" fontWeight="semibold" color="text.primary" mt={2}>
                    Klik untuk unggah atau seret file gambar ke sini
                  </Text>
                  <Text fontSize="2xs" color="text.secondary" mt={0.5}>
                    PNG, JPG, JPEG, SVG, WebP (Maksimal 1 MB)
                  </Text>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </Flex>

                {/* Logo Preview & Reset */}
                <Flex
                  w={{ base: 'full', md: '180px' }}
                  direction="column"
                  align="center"
                  justify="center"
                  bg="bg.canvas"
                  border="1px solid"
                  borderColor="border.default"
                  borderRadius="2xl"
                  p={4}
                  h="120px"
                  position="relative"
                >
                  {logoUrl ? (
                    <Stack align="center" gap={3} w="full">
                      <Flex
                        w={14}
                        h={14}
                        overflow="hidden"
                        borderRadius="xl"
                        bg="white"
                        boxShadow="0 4px 12px rgba(0,0,0,0.05)"
                        display="flex"
                        alignItems="center"
                        justify="center"
                        p={1}
                      >
                        <Image src={logoUrl} alt="Logo Preview" maxW="100%" maxH="100%" objectFit="contain" />
                      </Flex>
                      <Button
                        size="2xs"
                        variant="ghost"
                        color="status.danger.text"
                        _hover={{ bg: 'status.danger.bg' }}
                        borderRadius="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLogo();
                        }}
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <Trash2 size={12} />
                        Hapus
                      </Button>
                    </Stack>
                  ) : (
                    <Flex direction="column" align="center" justify="center" gap={1}>
                      <Box p={2.5} borderRadius="xl" bg="bg.surface" border="1px solid" borderColor="border.default">
                        <Heart size={18} className="text-gray-400" />
                      </Box>
                      <Text fontSize="2xs" color="text.secondary" fontWeight="bold" mt={1}>LOGO DEFAULT</Text>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Stack>
          </Stack>
        </Box>

        {/* Timezone Card */}
        <Box
          bg="bg.surface"
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.default"
          boxShadow="0 10px 30px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.01)"
          p={8}
          transition="all 0.25s"
          _hover={{ borderColor: 'indigo.200', boxShadow: '0 12px 36px -8px rgba(99,102,241,0.06)' }}
        >
          <Stack gap={6}>
            <Box pb={4} borderBottom="1px solid" borderColor="border.default">
              <Heading size="md" fontWeight="bold" color="text.primary">
                Lokalisasi & Zona Waktu
              </Heading>
              <Text fontSize="xs" color="text.secondary" mt={0.5}>
                Atur standar zona waktu sistem untuk menyamakan waktu mulai dan batas pengumpulan lembar ujian peserta.
              </Text>
            </Box>

            <Stack gap={2}>
              <Text fontWeight="bold" color="text.primary" fontSize="sm" display="flex" alignItems="center" gap={1.5}>
                <Globe size={15} className="text-indigo-500" />
                {t('timezoneLabel')}
              </Text>
              <Select.Root
                collection={timezoneOptions}
                value={[timezone]}
                onValueChange={(details) => setTimezone(details.value[0] || 'Asia/Jakarta')}
                positioning={{ sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Pilih timezone" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {timezoneOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Stack>
          </Stack>
        </Box>

        {/* Language Card */}
        <Box
          bg="bg.surface"
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.default"
          boxShadow="0 10px 30px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.01)"
          p={8}
          transition="all 0.25s"
          _hover={{ borderColor: 'indigo.200', boxShadow: '0 12px 36px -8px rgba(99,102,241,0.06)' }}
        >
          <Stack gap={6}>
            <Box pb={4} borderBottom="1px solid" borderColor="border.default">
              <Heading size="md" fontWeight="bold" color="text.primary">
                {t('languageLabel')}
              </Heading>
              <Text fontSize="xs" color="text.secondary" mt={0.5}>
                Pilih bahasa sistem utama untuk antarmuka panel Guru dan Admin.
              </Text>
            </Box>

            <Stack gap={2}>
              <Text fontWeight="bold" color="text.primary" fontSize="sm" display="flex" alignItems="center" gap={1.5}>
                <Languages size={15} className="text-indigo-500" />
                Bahasa / Language
              </Text>
              <Select.Root
                collection={languageOptions}
                value={[language]}
                onValueChange={(details) => setLanguage(details.value[0] || 'id')}
                positioning={{ sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Pilih bahasa" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {languageOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Stack>
          </Stack>
        </Box>

        {/* Academic Year Card */}
        <Box
          bg="bg.surface"
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.default"
          boxShadow="0 10px 30px -10px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.01)"
          p={8}
          transition="all 0.25s"
          _hover={{ borderColor: 'indigo.200', boxShadow: '0 12px 36px -8px rgba(99,102,241,0.06)' }}
        >
          <Stack gap={6}>
            <Box pb={4} borderBottom="1px solid" borderColor="border.default">
              <Heading size="md" fontWeight="bold" color="text.primary">
                Periode & Tahun Ajaran
              </Heading>
              <Text fontSize="xs" color="text.secondary" mt={0.5}>
                Tentukan tahun ajaran aktif yang akan menjadi acuan data dan laporan ujian di sistem.
              </Text>
            </Box>

            <Stack gap={2}>
              <Text fontWeight="bold" color="text.primary" fontSize="sm" display="flex" alignItems="center" gap={1.5}>
                <Bookmark size={15} className="text-indigo-500" />
                Tahun Ajaran Aktif
              </Text>
              <Select.Root
                collection={academicYearSelectOptions}
                value={[academicYear]}
                onValueChange={(details) => setAcademicYear(details.value[0] || academicYearOptions[0] || '2024/2025')}
                positioning={{ sameWidth: true }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Pilih tahun ajaran" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                    <Select.ClearTrigger />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content>
                    {academicYearSelectOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Stack>
          </Stack>
        </Box>

        {/* Save Bar */}
        <Flex
          bg="rgba(var(--bg-surface-rgb), 0.7)"
          style={{ backdropFilter: 'blur(10px)' }}
          borderRadius="2xl"
          border="1px solid"
          borderColor="border.default"
          p={5}
          justify="space-between"
          align="center"
          boxShadow="0 10px 30px -10px rgba(0,0,0,0.05)"
        >
          <Box display={{ base: 'none', sm: 'block' }}>
            <Text fontSize="xs" color="text.secondary" fontWeight="semibold">
              Perubahan belum disimpan.
            </Text>
            <Text fontSize="2xs" color="text.muted">
              Pastikan pengaturan yang Anda masukkan telah sesuai sebelum menyimpan.
            </Text>
          </Box>
          <Button
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
            borderRadius="xl"
            h={12}
            px={8}
            fontWeight="bold"
            display="flex"
            alignItems="center"
            gap={2.5}
            onClick={handleSave}
            loading={saveMutation.isPending}
            cursor="pointer"
            transition="all 0.2s"
          >
            <Save size={18} />
            {t('saveBtn')}
          </Button>
        </Flex>
      </Stack>
    </Stack>
  );
}
