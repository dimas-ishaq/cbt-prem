'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Table,
  Checkbox,
  Stack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { Settings, Save, ShieldAlert, ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';

interface NotificationPolicy {
  type: string;
  isEnabled: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  slug: string;
  notificationPolicies: NotificationPolicy[];
}

const NOTIFICATION_TYPES = [
  { value: 'EXAM_SUBMITTED', label: 'Ujian Diserahkan (Manual)', desc: 'Dikirim saat siswa selesai dan mensubmit ujian secara manual.' },
  { value: 'EXAM_AUTO_SUBMIT', label: 'Ujian Diserahkan (Otomatis)', desc: 'Dikirim saat waktu ujian habis dan dikumpulkan oleh sistem.' },
  { value: 'VIOLATION_DETECTED', label: 'Pelanggaran Terdeteksi', desc: 'Dikirim saat sistem pengawas mendeteksi aktivitas mencurigakan siswa.' },
  { value: 'IMPORT_COMPLETED', label: 'Impor Soal Berhasil', desc: 'Dikirim saat proses impor bank soal selesai dengan sukses.' },
  { value: 'IMPORT_FAILED', label: 'Impor Soal Gagal', desc: 'Dikirim saat proses impor bank soal mengalami kegagalan.' },
  { value: 'EXAM_REMINDER', label: 'Pengingat Jadwal Ujian', desc: 'Pengingat otomatis H-1 sebelum jadwal pengerjaan ujian dimulai.' },
  { value: 'SESSION_EXPIRED', label: 'Sesi Siswa Kedaluwarsa', desc: 'Dikirim saat sesi aktif pengerjaan ujian siswa habis.' },
  { value: 'SYSTEM_ANNOUNCEMENT', label: 'Pengumuman Sistem', desc: 'Notifikasi pengumuman pemeliharaan/informasi dari Superadmin.' },
];

export default function NotificationSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Matriks lokal: [roleId][type] = isEnabled
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});

  // Strict role check
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const { data: roles, isLoading } = useQuery<CustomRole[]>({
    queryKey: ['notification-policies'],
    queryFn: async () => {
      const response = await api.get('/notifications/policies');
      return response.data;
    },
  });

  useEffect(() => {
    if (roles) {
      const newMatrix: Record<string, Record<string, boolean>> = {};
      roles.forEach((role) => {
        newMatrix[role.id] = {};
        
        // Buat default: true untuk setiap tipe
        NOTIFICATION_TYPES.forEach((t) => {
          newMatrix[role.id]![t.value] = true;
        });

        // Terapkan data dari database
        role.notificationPolicies?.forEach((policy) => {
          newMatrix[role.id]![policy.type] = policy.isEnabled ?? false;
        });
      });
      setMatrix(newMatrix);
    }
  }, [roles]);

  const updateMutation = useMutation({
    mutationFn: async ({ roleId, policies }: { roleId: string; policies: NotificationPolicy[] }) => {
      return api.post('/notifications/policies', { roleId, policies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-policies'] });
      toast.success('Kebijakan notifikasi berhasil diperbarui!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui kebijakan.');
    },
  });

  const handleToggle = (roleId: string, type: string) => {
    setMatrix((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [type]: !prev[roleId]?.[type],
      },
    }));
  };

  const handleSaveRolePolicies = (roleId: string) => {
    const rolePolicies = matrix[roleId];
    if (!rolePolicies) return;

    const policiesPayload: NotificationPolicy[] = Object.keys(rolePolicies).map((type) => ({
      type,
      isEnabled: rolePolicies[type] ?? false,
    }));

    updateMutation.mutate({ roleId, policies: policiesPayload });
  };

  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" minH="50vh">
        <Spinner size="xl" color="indigo.600" />
        <Text color="gray.500" mt={4} fontWeight="medium">Memuat data kebijakan notifikasi...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6} maxW="7xl" mx="auto" p={{ base: 2, md: 4 }}>
      {/* Header */}
      <Flex justify="space-between" align="center">
        <HStack gap={4}>
          <IconButton
            asChild
            variant="ghost"
            _hover={{ bg: 'gray.100' }}
            borderRadius="full"
            aria-label="Kembali ke Pengaturan"
            size="sm"
          >
            <Link href="/admin/settings">
              <ArrowLeft size={24} />
            </Link>
          </IconButton>
          <Box>
            <Heading size="xl" fontWeight="black" color="gray.900" letterSpacing="tight">
              Manajemen Kebijakan Notifikasi
            </Heading>
            <Text color="gray.500" mt={1}>
              Atur hak akses penerimaan jenis notifikasi secara mutlak berdasarkan Peran (Role).
            </Text>
          </Box>
        </HStack>
      </Flex>

      <Box bg="white" borderRadius="2xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        <Box p={5} bg="amber.50/50" borderBottom="1px solid" borderColor="amber.100">
          <HStack gap={2.5} align="flex-start">
            <ShieldAlert className="text-amber-600" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <Box>
              <Text fontWeight="bold" color="amber.800" fontSize="sm">Catatan Kebijakan Mutlak</Text>
              <Text color="amber.700" fontSize="xs" mt={0.5}>
                Kebijakan yang diatur di sini bersifat mutlak. Jika Anda mematikan suatu jenis notifikasi untuk suatu role, 
                seluruh user dengan role tersebut tidak akan pernah dikirimkan notifikasi tersebut, mengabaikan pengaturan preferensi profil pribadi mereka.
              </Text>
            </Box>
          </HStack>
        </Box>

        <Box overflowX="auto">
          <Table.Root variant="outline" size="md">
            <Table.Header bg="gray.50/50">
              <Table.Row>
                <Table.ColumnHeader color="gray.700" fontWeight="bold">Jenis Notifikasi</Table.ColumnHeader>
                {roles?.map((role) => (
                  <Table.ColumnHeader key={role.id} color="gray.700" fontWeight="bold" textAlign="center" minW="140px">
                    {role.name}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {NOTIFICATION_TYPES.map((type) => (
                <Table.Row key={type.value} _hover={{ bg: 'gray.50/30' }}>
                  <Table.Cell py={4}>
                    <Box>
                      <Text fontWeight="semibold" color="gray.800" fontSize="sm">{type.label}</Text>
                      <Text fontSize="2xs" color="gray.400" mt={0.5}>{type.desc}</Text>
                    </Box>
                  </Table.Cell>
                  {roles?.map((role) => {
                    const isChecked = matrix[role.id]?.[type.value] ?? true;
                    return (
                      <Table.Cell key={role.id} textAlign="center" py={4}>
                        <Checkbox.Root
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(role.id, type.value)}
                          justifyContent="center"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control cursor="pointer" />
                        </Checkbox.Root>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        <Box p={6} borderTop="1px solid" borderColor="gray.100" bg="gray.50/30">
          <Flex justify="flex-end" gap={3}>
            <Link href="/admin/settings" passHref>
              <Button variant="outline" colorPalette="gray" borderRadius="xl" fontWeight="semibold" fontSize="sm" px={5}>
                Batal
              </Button>
            </Link>
            <Button
              onClick={() => {
                // Simpan untuk semua role
                roles?.forEach((role) => {
                  handleSaveRolePolicies(role.id);
                });
              }}
              bg="indigo.600"
              color="white"
              _hover={{ bg: 'indigo.700' }}
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              px={6}
              gap={2}
            >
              <Save size={18} />
              Simpan Kebijakan
            </Button>
          </Flex>
        </Box>
      </Box>
    </Stack>
  );
}
