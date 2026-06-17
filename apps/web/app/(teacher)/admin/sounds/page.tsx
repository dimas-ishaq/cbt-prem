'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Spinner,
  Stack,
  Button,
  Textarea,
  Input,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import {
  Upload,
  Volume2,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  HardDriveUpload,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

type SoundUsage = 'START' | 'FINISH' | 'WARNING' | 'REMAINING_5_MIN';

const USAGE_OPTIONS: { value: SoundUsage; label: string }[] = [
  { value: 'START', label: 'Mulai Ujian' },
  { value: 'FINISH', label: 'Selesai Ujian' },
  { value: 'WARNING', label: 'Peringatan' },
  { value: 'REMAINING_5_MIN', label: 'Sisa 5 Menit' },
];

export default function AdminSoundsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    examId: '',
    usage: '' as SoundUsage | '',
    customName: '',
    file: null as File | null,
  });

  // Only SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    router.push('/admin');
    return null;
  }

  const { data: sounds, isLoading } = useQuery({
    queryKey: ['sounds'],
    queryFn: async () => {
      const res = await api.get('/admin/sounds/list');
      return res.data || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!form.examId || !form.usage || !form.file) {
        throw new Error('Semua field wajib diisi');
      }

      const fd = new FormData();
      fd.append('examId', form.examId);
      fd.append('usage', form.usage);
      if (form.customName) fd.append('customName', form.customName);
      fd.append('file', form.file);

      const res = await api.post('/admin/sounds/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Sound berhasil diupload');
      setForm({ examId: '', usage: '', customName: '', file: null });
      queryClient.invalidateQueries({ queryKey: ['sounds'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal upload sound');
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sounds'] });
  };

  return (
    <Stack gap={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" direction={{ base: 'column', sm: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" fontWeight="bold" letterSpacing="tight" color="gray.800" display="flex" alignItems="center" gap={2}>
            <Volume2 size={24} className="text-indigo-600" />
            Manajemen Sound Ujian
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Upload, kelola, dan tetapkan suara untuk tahapan ujian.
          </Text>
        </Box>
        <Button size="sm" variant="outline" onClick={refresh} borderRadius="xl" cursor="pointer" gap={2}>
          <RefreshCw size={15} /> Segarkan
        </Button>
      </Flex>

      {/* Upload Form */}
      <Box bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.default" p={6}>
        <Flex gap={4} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'flex-end' }}>
          <Input
            placeholder="ID Ujian (Exam ID)"
            value={form.examId}
            onChange={(e) => setForm({ ...form, examId: e.target.value })}
            bg="bg.canvas"
            borderRadius="xl"
            h={12}
            px={4}
            borderColor="border.default"
          />
          <select
            value={form.usage}
            onChange={(e) => setForm({ ...form, usage: e.target.value as SoundUsage })}
            style={{
              padding: '0 16px',
              height: '48px',
              borderRadius: '12px',
              border: '1px solid var(--chakra-colors-border-default)',
              backgroundColor: 'var(--chakra-colors-bg-canvas)',
              outline: 'none',
              fontSize: '14px',
              minWidth: '200px',
              color: 'var(--chakra-colors-text-muted)',
            }}
          >
            <option value="" style={{ background: 'var(--chakra-colors-bg-surface)' }}>Pilih kegunaan sound</option>
            {USAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: 'var(--chakra-colors-bg-surface)' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Nama custom (opsional)"
            value={form.customName}
            onChange={(e) => setForm({ ...form, customName: e.target.value })}
            bg="bg.canvas"
            borderRadius="xl"
            h={12}
            px={4}
            borderColor="border.default"
          />
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 transition h-12 text-sm font-semibold">
            <Upload size={16} />
            {form.file ? form.file.name : 'Pilih File Audio'}
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setForm({ ...form, file: f });
              }}
            />
          </label>
          <Button
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="xl"
            h={12}
            px={6}
            fontWeight="bold"
            onClick={() => uploadMutation.mutate()}
            loading={uploadMutation.isPending}
            cursor="pointer"
            gap={2}
          >
            <HardDriveUpload size={18} />
            Upload
          </Button>
        </Flex>
      </Box>

      {/* List */}
      <Box bg="bg.surface" borderRadius="2xl" border="1px solid" borderColor="border.default" p={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md" fontWeight="bold">Daftar Sound</Heading>
          <Text fontSize="sm" color="gray.500">
            Total: {sounds?.length ?? 0}
          </Text>
        </Flex>

        {isLoading ? (
          <Flex justify="center" py={8}>
            <Spinner size="lg" color="indigo.600" />
          </Flex>
        ) : !sounds || sounds.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={8}>
            Belum ada sound yang diupload.
          </Text>
        ) : (
          <Stack gap={3}>
            {sounds.map((item: any) => (
              <Flex
                key={item.id}
                justify="space-between"
                align="center"
                gap={4}
                p={3}
                bg="bg.canvas"
                borderRadius="xl"
                border="1px solid"
                borderColor="border.default"
              >
                <Box>
                  <Text fontWeight="semibold" fontSize="sm">{item.customName || item.fileUrl}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {USAGE_OPTIONS.find((o) => o.value === item.usage)?.label || item.usage}
                    {' '}•{' '}
                    {item.examId ? `Exam: ${item.examId}` : 'Global'}
                  </Text>
                </Box>
                <Flex gap={2} align="center">
                  <Button
                    size="sm"
                    variant="outline"
                    borderRadius="lg"
                    cursor="pointer"
                    onClick={() => window.open(item.fileUrl, '_blank')}
                  >
                    <Play size={14} />
                  </Button>
                </Flex>
              </Flex>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}