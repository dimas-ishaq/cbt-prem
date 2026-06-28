'use client';

import { useMemo, useState, useEffect } from 'react';
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
  Input,
  Select,
  createListCollection,
} from '@chakra-ui/react';
import { Bell, CheckCheck, ShieldAlert, Sparkles, Timer, TriangleAlert, Upload, UserCheck, Search, Filter, BadgeCheck } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { TablePagination } from '@/components/ui/pagination';

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

  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedStatus, selectedType]);

  const stats = useMemo(() => {
    const total = notifications.length;
    const read = notifications.filter((n) => n.read).length;
    return { total, read, unread: unreadCount };
  }, [notifications, unreadCount]);

  const filteredNotifications = useMemo(() => {
    return (notifications || []).filter((n) => {
      const matchesSearch =
        !searchText.trim() ||
        n.title.toLowerCase().includes(searchText.toLowerCase()) ||
        n.message.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'READ' && n.read) ||
        (selectedStatus === 'UNREAD' && !n.read);

      const matchesType =
        selectedType === 'ALL' || n.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [notifications, searchText, selectedStatus, selectedType]);

  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice(
      (currentPage - 1) * pageSize,
      (currentPage - 1) * pageSize + pageSize
    );
  }, [filteredNotifications, currentPage, pageSize]);

  const statusOptions = useMemo(() => createListCollection({
    items: [
      { label: 'Semua Status', value: 'ALL' },
      { label: 'Belum Dibaca', value: 'UNREAD' },
      { label: 'Sudah Dibaca', value: 'READ' },
    ]
  }), []);

  const typeOptions = useMemo(() => createListCollection({
    items: [
      { label: 'Semua Tipe', value: 'ALL' },
      ...notificationTypes.map((item) => ({ label: item.label, value: item.type })),
    ]
  }), []);

  return (
    <Stack gap={6}>
      <Box
        bg="bg.surface"
        border="1px solid"
        borderColor="border.default"
        borderRadius="card"
        shadow="card-dark"
        p={6}
      >
        <HStack gap={3} mb={2}>
          <Box boxSize={10} borderRadius="lg" bg="brand.subtle" color="brand.text" display="flex" alignItems="center" justifyContent="center">
            <Bell size={18} />
          </Box>
          <Heading size="lg" color="text.primary">Notifikasi</Heading>
        </HStack>
        <Text color="text.secondary">Kelola, cari, dan filter semua notifikasi sistem yang masuk ke perangkat Anda.</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" shadow="card-dark">
          <Card.Body>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="text.muted">Total notifikasi</Text>
              <Icon as={Bell} color="brand.text" />
            </HStack>
            <Heading size="2xl" color="text.primary">{stats.total}</Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" shadow="card-dark">
          <Card.Body>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="text.muted">Sudah dibaca</Text>
              <Icon as={CheckCheck} color="status.success.text" />
            </HStack>
            <Heading size="2xl" color="text.primary">{stats.read}</Heading>
          </Card.Body>
        </Card.Root>
        <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" shadow="card-dark">
          <Card.Body>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color="text.muted">Belum dibaca</Text>
              <Icon as={TriangleAlert} color="status.warning.text" />
            </HStack>
            <Heading size="2xl" color="text.primary">{stats.unread}</Heading>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" shadow="card-dark">
        <Card.Header>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <Heading size="md" color="text.primary">Jenis notifikasi</Heading>
              <Text fontSize="sm" color="text.secondary">Definisi singkat tiap tipe notifikasi yang sudah didukung backend.</Text>
            </Box>
            <Button bg="brand.subtle" color="brand.text" _hover={{ bg: 'brand.solid', color: 'text.inverted' }} onClick={() => markAllRead()}>
              <CheckCheck size={16} /> Tandai semua dibaca
            </Button>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {notificationTypes.map((item) => (
              <Flex key={item.type} p={4} borderWidth="1px" borderColor="border.default" borderRadius="xl" gap={3} bg="bg.elevated">
                <Box boxSize={10} borderRadius="lg" bg="brand.subtle" color="brand.text" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Icon as={item.icon} />
                </Box>
                <Box minW={0}>
                  <HStack gap={2} mb={1} wrap="wrap">
                    <Text fontWeight="bold" color="text.primary">{item.label}</Text>
                    <Badge bg="bg.subtle" color="text.secondary" border="1px solid" borderColor="border.default">{item.type}</Badge>
                  </HStack>
                  <Text fontSize="sm" color="text.secondary">{item.description}</Text>
                </Box>
              </Flex>
            ))}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      {/* Filter & Search Section */}
      <Box bg="bg.surface" borderRadius="card" borderWidth="1px" borderColor="border.default" shadow="card-dark" p={4}>
        <Flex gap={3} align="center" flexWrap="wrap">
          <Flex align="center" gap={2} bg="input.bg" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="input.border" flex={1} minW="260px">
            <Search size={16} color="var(--chakra-colors-text-muted)" />
            <Input placeholder="Cari judul atau isi notifikasi..." value={searchText} onChange={(e) => setSearchText(e.target.value)} size="sm" variant="unstyled" flex={1} _placeholder={{ color: 'text.muted' }} />
          </Flex>
          
          <Flex align="center" gap={2} bg="input.bg" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="input.border">
            <BadgeCheck size={16} color="var(--chakra-colors-text-muted)" />
            <Select.Root collection={statusOptions} value={[selectedStatus]} onValueChange={(d) => setSelectedStatus(d.value[0] || 'ALL')} positioning={{ sameWidth: true }}>
              <Select.HiddenSelect />
              <Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Status" /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
              <Select.Positioner><Select.Content>{statusOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
            </Select.Root>
          </Flex>

          <Flex align="center" gap={2} bg="input.bg" px={3} py={2} borderRadius="lg" borderWidth="1px" borderColor="input.border">
            <Filter size={16} color="var(--chakra-colors-text-muted)" />
            <Select.Root collection={typeOptions} value={[selectedType]} onValueChange={(d) => setSelectedType(d.value[0] || 'ALL')} positioning={{ sameWidth: true }}>
              <Select.HiddenSelect />
              <Select.Control><Select.Trigger><Select.ValueText placeholder="Semua Tipe" /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /><Select.ClearTrigger /></Select.IndicatorGroup></Select.Control>
              <Select.Positioner><Select.Content>{typeOptions.items.map((item) => <Select.Item key={item.value} item={item}>{item.label}</Select.Item>)}</Select.Content></Select.Positioner>
            </Select.Root>
          </Flex>
        </Flex>
      </Box>

      <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" shadow="card-dark">
        <Card.Header>
          <Heading size="md" color="text.primary">Notifikasi yang sudah terbuat</Heading>
          <Text fontSize="sm" color="text.secondary">Menampilkan {filteredNotifications.length} notifikasi yang cocok.</Text>
        </Card.Header>
        <Card.Body>
          <Stack gap={4}>
            {paginatedNotifications.length === 0 ? (
              <Flex align="center" justify="center" py={12} direction="column" gap={2}>
                <Box boxSize={12} borderRadius="full" bg="bg.subtle" border="1px solid" borderColor="border.default" display="flex" alignItems="center" justifyContent="center">
                  <Bell size={20} color="var(--chakra-colors-text-muted)" />
                </Box>
                <Text color="text.primary" fontWeight="semibold">Tidak ada notifikasi yang ditemukan.</Text>
                <Text color="text.muted" fontSize="sm">Coba ubah kata kunci pencarian atau filter status/tipe Anda.</Text>
              </Flex>
            ) : (
              paginatedNotifications.map((n) => (
                <Flex key={n.id} justify="space-between" gap={4} p={4} borderWidth="1px" borderColor="border.default" borderRadius="xl" bg="bg.elevated" align="center">
                  <Box minW={0}>
                    <HStack gap={2} mb={1} wrap="wrap">
                      <Text fontWeight="bold" color="text.primary">{n.title}</Text>
                      <Badge bg={n.read ? 'bg.subtle' : 'brand.subtle'} color={n.read ? 'text.muted' : 'brand.text'} border="1px solid" borderColor="border.default">
                        {n.type}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="text.secondary">{n.message}</Text>
                  </Box>
                  <Badge bg={n.read ? 'bg.subtle' : 'status.success.bg'} color={n.read ? 'text.muted' : 'status.success.text'} alignSelf="center" border="1px solid" borderColor="border.default" flexShrink={0}>
                    {n.read ? 'Dibaca' : 'Baru'}
                  </Badge>
                </Flex>
              ))
            )}

            {filteredNotifications.length > pageSize && (
              <Flex justify="center" mt={4}>
                <TablePagination
                  currentPage={currentPage}
                  totalCount={filteredNotifications.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </Flex>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
