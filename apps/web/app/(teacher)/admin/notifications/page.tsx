'use client';

import { useMemo } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Bell, CheckCheck, ShieldAlert, Sparkles, Timer, TriangleAlert, Upload, UserCheck } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';

const notificationTypes = [
  {
    type: 'EXAM_SUBMITTED',
    label: 'Ujian Disubmit',
    description: 'Muncul saat siswa mengirim jawaban ujian.',
    icon: CheckCheck,
  },
  {
    type: 'EXAM_AUTO_SUBMIT',
    label: 'Auto Submit Ujian',
    description: 'Dikirim ketika sistem men-submit ujian otomatis karena waktu habis atau kondisi tertentu.',
    icon: Timer,
  },
  {
    type: 'VIOLATION_DETECTED',
    label: 'Pelanggaran Terdeteksi',
    description: 'Digunakan saat monitoring menemukan tab switch, devtools, atau pelanggaran lain.',
    icon: TriangleAlert,
  },
  {
    type: 'IMPORT_COMPLETED',
    label: 'Import Selesai',
    description: 'Diberikan setelah proses impor data berhasil.',
    icon: Upload,
  },
  {
    type: 'IMPORT_FAILED',
    label: 'Import Gagal',
    description: 'Diberikan ketika impor data gagal dan perlu dicek ulang.',
    icon: ShieldAlert,
  },
  {
    type: 'EXAM_REMINDER',
    label: 'Pengingat Ujian',
    description: 'Dipakai untuk mengingatkan jadwal ujian kepada target tertentu.',
    icon: Bell,
  },
  {
    type: 'SESSION_EXPIRED',
    label: 'Sesi Kedaluwarsa',
    description: 'Muncul ketika sesi login atau sesi ujian sudah habis.',
    icon: Timer,
  },
  {
    type: 'SYSTEM_ANNOUNCEMENT',
    label: 'Pengumuman Sistem',
    description: 'Notifikasi umum dari admin untuk seluruh pengguna atau kelompok tertentu.',
    icon: Sparkles,
  },
];

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllRead } = useNotificationStore();

  const stats = useMemo(() => {
    const total = notifications.length;
    const read = notifications.filter((n) => n.read).length;
    return { total, read, unread: unreadCount };
  }, [notifications, unreadCount]);

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="lg" mb={2}>Notifikasi</Heading>
        <Text color="fg.muted">Halaman ini merangkum jenis notifikasi yang tersedia dan daftar notifikasi yang sudah dibuat.</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Total notifikasi</Text>
            <Heading size="2xl">{stats.total}</Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Sudah dibaca</Text>
            <Heading size="2xl">{stats.read}</Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Text fontSize="sm" color="fg.muted">Belum dibaca</Text>
            <Heading size="2xl">{stats.unread}</Heading>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Card.Root>
        <Card.Header>
          <Flex justify="space-between" align="center" gap={4}>
            <Box>
              <Heading size="md">Jenis notifikasi</Heading>
              <Text fontSize="sm" color="fg.muted">Definisi singkat tiap tipe notifikasi yang sudah didukung backend.</Text>
            </Box>
            <Button variant="outline" onClick={() => markAllRead()}>Tandai semua dibaca</Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {notificationTypes.map((item) => (
              <Flex key={item.type} p={4} borderWidth="1px" borderRadius="xl" gap={3}>
                <Box boxSize={10} borderRadius="lg" bg="blue.50" display="flex" alignItems="center" justifyContent="center">
                  <Icon as={item.icon} />
                </Box>
                <Box>
                  <HStack gap={2} mb={1}>
                    <Text fontWeight="bold">{item.label}</Text>
                    <Badge>{item.type}</Badge>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">{item.description}</Text>
                </Box>
              </Flex>
            ))}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Heading size="md">Notifikasi yang sudah terbuat</Heading>
          <Text fontSize="sm" color="fg.muted">Berdasarkan data yang masuk ke store saat ini.</Text>
        </Card.Header>
        <Card.Body>
          <Stack gap={3}>
            {notifications.length === 0 ? (
              <Text color="fg.muted">Belum ada notifikasi yang dimuat.</Text>
            ) : (
              notifications.map((n) => (
                <Flex key={n.id} justify="space-between" gap={4} p={4} borderWidth="1px" borderRadius="xl">
                  <Box>
                    <HStack gap={2} mb={1}>
                      <Text fontWeight="bold">{n.title}</Text>
                      <Badge variant={n.read ? 'subtle' : 'solid'} colorPalette={n.read ? 'gray' : 'blue'}>
                        {n.type}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="fg.muted">{n.message}</Text>
                  </Box>
                  <Badge colorPalette={n.read ? 'gray' : 'green'} alignSelf="start">
                    {n.read ? 'Dibaca' : 'Baru'}
                  </Badge>
                </Flex>
              ))
            )}
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
