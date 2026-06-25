'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Box, Flex, Heading, Text, Button, Stack, Spinner, Badge, Table, Input, HStack, IconButton, Select, createListCollection } from '@chakra-ui/react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Users,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  Download,
  Upload,
} from 'lucide-react';
import { TablePagination } from '@/components/ui/pagination';

// ── Types ─────────────────────────────────────────────────────────────────────

type UserRole = 'SUPER_ADMIN' | 'GURU' | 'SISWA' | 'ADMIN_SEKOLAH' | 'PENGAWAS';

interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  student?: {
    id: string;
    nis: string;
    rombel?: { id: string; name: string } | null;
    major?: { name: string; code: string } | null;
  } | null;
  teacher?: {
    id: string;
    nip: string | null;
    subjects: { id: string; name: string }[];
  } | null;
}

type ActiveTab = 'ALL' | 'SUPER_ADMIN' | 'GURU' | 'SISWA';

// ── Role helpers ──────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Guru', value: 'GURU' },
  { label: 'Siswa', value: 'SISWA' },
];

const ROLE_BADGE: Record<UserRole, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-violet-700', bg: 'bg-violet-100' },
  GURU:        { label: 'Guru',        color: 'text-blue-700',   bg: 'bg-blue-100' },
  SISWA:       { label: 'Siswa',       color: 'text-green-700',  bg: 'bg-green-100' },
  ADMIN_SEKOLAH: { label: 'Admin Sekolah', color: 'text-orange-700', bg: 'bg-orange-100' },
  PENGAWAS:    { label: 'Pengawas',    color: 'text-teal-700',   bg: 'bg-teal-100' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_BADGE[role] ?? { label: role, color: 'text-gray-700', bg: 'bg-gray-100' };
  return (
    <span
      style={{
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: cfg.bg.replace('bg-', '#').replace('-100', ''),
        color: cfg.color.replace('text-', '#').replace('-700', ''),
      }}
      className={`${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: '#7c3aed',
  GURU:        '#2563eb',
  SISWA:       '#059669',
  ADMIN_SEKOLAH: '#d97706',
  PENGAWAS:    '#0d9488',
};

function Avatar({ name, role }: { name: string; role: UserRole }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
  return (
    <Flex
      w={9}
      h={9}
      borderRadius="full"
      align="center"
      justify="center"
      fontWeight="bold"
      fontSize="xs"
      color="white"
      flexShrink={0}
      style={{ background: AVATAR_COLORS[role] ?? '#6b7280' }}
    >
      {initials}
    </Flex>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS: { key: ActiveTab; label: string; icon: any }[] = [
  { key: 'ALL',        label: 'Semua Pengguna', icon: Users },
  { key: 'SUPER_ADMIN', label: 'Super Admin',   icon: ShieldCheck },
  { key: 'GURU',       label: 'Guru',           icon: BookOpen },
  { key: 'SISWA',      label: 'Siswa',          icon: GraduationCap },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();

  // Redirect non-SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/admin');
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when search or tab filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  // Modal state
  type ModalMode = 'create' | 'edit' | 'reset-password' | null;
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Create / Edit form
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '', role: 'SISWA' as UserRole, rombelId: '', nis: '',
  });
  // Reset password form
  const [newPassword, setNewPassword] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading } = useQuery<UserData[]>({
    queryKey: ['users-all'],
    queryFn: async () => {
      const res = await api.get('/users');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const { data: rombels = [] } = useQuery<any[]>({
    queryKey: ['rombels-list'],
    queryFn: async () => {
      const res = await api.get('/rombels');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
  });

  const userList = Array.isArray(users) ? users : Array.isArray((users as any)?.data) ? (users as any).data : [];
  const rombelList = Array.isArray(rombels) ? rombels : Array.isArray((rombels as any)?.data) ? (rombels as any).data : [];

  const rombelOptions = createListCollection({
    items: rombelList.map((r: any) => ({ label: r.name, value: r.id })),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      closeModal();
      toast.success('Pengguna berhasil dibuat!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal membuat pengguna'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fullName: string; email: string } }) =>
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      closeModal();
      toast.success('Data pengguna berhasil diperbarui!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui pengguna'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      toast.success('Pengguna berhasil dihapus');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus pengguna'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      toast.success('Status pengguna berhasil diubah');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mengubah status'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      api.patch(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      closeModal();
      toast.success('Password berhasil direset!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal mereset password'),
  });

  const parseCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  };

  const downloadTemplate = () => {
    const csv = [
      'nama,email,username,password,no_hp,role,nis,nip,kode_mapel,kode_jurusan,kode_rombel',
      'Budi Santoso,budi@mail.com,budi123,Password123!,08123456789,GURU,,1987654321,MTK,,'
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_pengguna.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Template CSV berhasil diunduh');
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.replace(/\r/g, '').split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error('File CSV kosong atau tidak valid');
        return;
      }

      const headers = parseCsvLine(lines[0] || '').map((h) => h.trim().toLowerCase());
      const users = lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ?? '';
        });
        return {
          nama: row.nama || row.fullname || '',
          email: row.email || '',
          username: row.username || '',
          password: row.password || '',
          no_hp: row.no_hp || row.nohp || '',
          role: (row.role || '').toUpperCase(),
          nis: row.nis || row.nisn || '',
          nip: row.nip || '',
          kode_mapel: row.kode_mapel || '',
          kode_jurusan: row.kode_jurusan || '',
          kode_rombel: row.kode_rombel || '',
          fullName: row.nama || row.fullname || '',
          rombel: row.kode_rombel || row.rombel || '',
        };
      }).filter((u) => u.username || u.nama || u.email);

      const response = await api.post('/users/import', { users });
      const result = response.data;
      toast.success(`Import selesai. Dibuat: ${result.created ?? 0}, Diperbarui: ${result.updated ?? 0}`);
      if (result.errors?.length) {
        toast.error(result.errors.slice(0, 3).join(' | '));
      }
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Gagal import CSV');
    } finally {
      setIsImporting(false);
      setImportFileName('');
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setModalMode('create');
    setForm({ username: '', email: '', password: '', fullName: '', role: 'SISWA', rombelId: '', nis: '' });
    setSelectedUser(null);
  };

  const openEditModal = (u: UserData) => {
    setModalMode('edit');
    setSelectedUser(u);
    setForm({
      username: u.username,
      email: u.email || '',
      password: '',
      fullName: u.fullName,
      role: u.role,
      rombelId: u.student?.rombel?.id || '',
      nis: u.student?.nis || '',
    });
  };

  const openResetPassword = (u: UserData) => {
    setSelectedUser(u);
    setNewPassword('');
    setModalMode('reset-password');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      createMutation.mutate(form);
    } else if (modalMode === 'edit' && selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: { fullName: form.fullName, email: form.email } });
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    resetPasswordMutation.mutate({ id: selectedUser.id, newPassword });
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const response = await api.get('/users/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cbt_users_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Data pengguna berhasil diekspor');
    } catch (error: any) {
      toast.error('Gagal mengekspor: ' + (error.response?.data?.message || error.message));
    }
  };
  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (activeTab !== 'ALL' && u.role !== activeTab) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, activeTab, searchTerm]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);  // ── Tab counts ─────────────────────────────────────────────────────────────
  const counts: Record<ActiveTab, number> = {
    ALL: users.length,
    SUPER_ADMIN: users.filter((u) => u.role === 'SUPER_ADMIN').length,
    GURU:        users.filter((u) => u.role === 'GURU').length,
    SISWA:       users.filter((u) => u.role === 'SISWA').length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Stack gap={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Manajemen Akun Pengguna
          </Heading>
          <Text color="gray.500" mt={1} fontSize="sm">
            Kelola semua akun pengguna sistem — Super Admin, Guru, dan Siswa
          </Text>
        </Box>
        <HStack gap={3} flexWrap="wrap">
          <Button
            variant="outline"
            borderColor="gray.200"
            color="gray.600"
            _hover={{ bg: 'gray.50' }}
            borderRadius="lg"
            size="sm"
            onClick={downloadTemplate}
            cursor="pointer"
          >
            <Download size={16} style={{ marginRight: 6 }} />
            Template CSV
          </Button>
          <Button
            variant="outline"
            borderColor="gray.200"
            color="gray.600"
            _hover={{ bg: 'gray.50' }}
            borderRadius="lg"
            size="sm"
            onClick={() => document.getElementById('import-users-input')?.click()}
            cursor="pointer"
            loading={isImporting}
          >
            <Upload size={16} style={{ marginRight: 6 }} />
            Import CSV
          </Button>
          <Button
            variant="outline"
            borderColor="gray.200"
            color="gray.600"
            _hover={{ bg: 'gray.50' }}
            borderRadius="lg"
            size="sm"
            onClick={handleExport}
            cursor="pointer"
          >
            <Download size={16} style={{ marginRight: 6 }} />
            Export CSV
          </Button>
          <Button
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="lg"
            size="sm"
            onClick={openCreateModal}
            cursor="pointer"
          >
            <Plus size={16} style={{ marginRight: 6 }} />
            Tambah Pengguna
          </Button>
          <input
            id="import-users-input"
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImportFileName(file?.name || '');
              void handleImportFile(file);
              e.currentTarget.value = '';
            }}
          />
        </HStack>
      </Flex>

      {/* Stats Cards */}
      <Flex gap={4} wrap="wrap">
        {TABS.slice(1).map(({ key, label, icon: Icon }) => (
          <Box
            key={key}
            flex="1"
            minW="140px"
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.100"
            p={4}
            shadow="sm"
            cursor="pointer"
            onClick={() => setActiveTab(key)}
            transition="all 0.2s"
            _hover={{ shadow: 'md', borderColor: 'indigo.200' }}
            borderBottomWidth={activeTab === key ? '3px' : '1px'}
            borderBottomColor={activeTab === key ? 'indigo.500' : 'gray.100'}
          >
            <Flex align="center" gap={3}>
              <Box
                p={2}
                borderRadius="lg"
                bg={key === 'SUPER_ADMIN' ? 'violet.50' : key === 'GURU' ? 'blue.50' : 'green.50'}
                color={key === 'SUPER_ADMIN' ? 'violet.600' : key === 'GURU' ? 'blue.600' : 'green.600'}
              >
                <Icon size={18} />
              </Box>
              <Box>
                <Text fontSize="2xl" fontWeight="bold" color="gray.900" lineHeight="1">
                  {counts[key]}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                  {label}
                </Text>
              </Box>
            </Flex>
          </Box>
        ))}
      </Flex>

      {/* Table Card */}
      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        {/* Toolbar */}
        <Flex p={4} borderBottom="1px solid" borderColor="gray.100" align="center" gap={3} bg="gray.50" wrap="wrap">
          {/* Tab pills */}
          <Flex gap={1} bg="gray.200" p={1} borderRadius="lg">
            {TABS.map(({ key, label }) => (
              <Button
                key={key}
                onClick={() => setActiveTab(key)}
                size="xs"
                px={3}
                py={1.5}
                borderRadius="md"
                fontSize="xs"
                fontWeight="medium"
                bg={activeTab === key ? 'white' : 'transparent'}
                shadow={activeTab === key ? 'sm' : 'none'}
                color={activeTab === key ? 'indigo.700' : 'gray.500'}
                _hover={{ color: 'gray.700' }}
                cursor="pointer"
                variant="ghost"
              >
                {label}
                <Box
                  as="span"
                  ml={1}
                  px={1.5}
                  py={0.5}
                  borderRadius="full"
                  fontSize="10px"
                  bg={activeTab === key ? 'indigo.100' : 'gray.300'}
                  color={activeTab === key ? 'indigo.700' : 'gray.500'}
                >
                  {counts[key]}
                </Box>
              </Button>
            ))}
          </Flex>

          {/* Search */}
          <Box position="relative" flex={1} minW="200px" maxW="360px">
            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
              <Search size={15} />
            </Box>
            <Input
              pl={9}
              placeholder="Cari nama, username, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              borderRadius="lg"
              borderColor="gray.200"
              _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
            />
          </Box>
        </Flex>

        {/* Table */}
        {isLoading ? (
          <Flex justify="center" align="center" py={16}>
            <Spinner size="lg" color="indigo.600" />
          </Flex>
        ) : (
          <>
            <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase">
                  Pengguna
                </Table.ColumnHeader>
                <Table.ColumnHeader px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase">
                  Username
                </Table.ColumnHeader>
                <Table.ColumnHeader px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase">
                  Role
                </Table.ColumnHeader>
                <Table.ColumnHeader px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase">
                  Info Profil
                </Table.ColumnHeader>
                <Table.ColumnHeader px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase">
                  Status
                </Table.ColumnHeader>
                <Table.ColumnHeader px={5} py={3} fontWeight="semibold" color="gray.500" fontSize="xs" textTransform="uppercase" textAlign="end">
                  Aksi
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {paginated.map((u) => (
                <Table.Row key={u.id} _hover={{ bg: 'gray.50/60' }} transition="background 0.1s">
                  {/* Pengguna */}
                  <Table.Cell px={5} py={3}>
                    <HStack gap={3}>
                      <Avatar name={u.fullName} role={u.role} />
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm" color="gray.900">
                          {u.fullName}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {u.email}
                        </Text>
                      </Box>
                    </HStack>
                  </Table.Cell>

                  {/* Username */}
                  <Table.Cell px={5} py={3}>
                    <Text fontSize="sm" fontFamily="mono" color="gray.600">
                      {u.username}
                    </Text>
                  </Table.Cell>

                  {/* Role */}
                  <Table.Cell px={5} py={3}>
                    <RoleBadge role={u.role} />
                  </Table.Cell>

                  {/* Profile Info */}
                  <Table.Cell px={5} py={3}>
                    {u.role === 'SISWA' && u.student ? (
                      <Box>
                        <Text fontSize="xs" color="gray.700" fontWeight="medium">
                          NIS: {u.student.nis || '-'}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {u.student.rombel?.name || 'Belum ada rombel'} · {u.student.major?.code || 'Belum ada jurusan'}
                        </Text>
                      </Box>
                    ) : u.role === 'GURU' && u.teacher ? (
                      <Box>
                        <Text fontSize="xs" color="gray.700" fontWeight="medium">
                          NIP: {u.teacher.nip || '-'}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {u.teacher.subjects.length > 0
                            ? u.teacher.subjects.map((s) => s.name).join(', ')
                            : 'Belum ada mapel'}
                        </Text>
                      </Box>
                    ) : (
                      <Text fontSize="xs" color="gray.400">—</Text>
                    )}
                  </Table.Cell>

                  {/* Status */}
                  <Table.Cell px={5} py={3}>
                    <IconButton
                      variant="ghost"
                      size="xs"
                      color={u.isActive ? 'green.600' : 'gray.400'}
                      _hover={{ bg: u.isActive ? 'green.50' : 'gray.100' }}
                      borderRadius="lg"
                      aria-label={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      onClick={async () => {
                        const confirmed = await confirmDialog({
                          title: 'Konfirmasi',
                          description: `${u.isActive ? 'Nonaktifkan' : 'Aktifkan'} akun ${u.fullName}?`,
                          confirmText: u.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'
                        });
                        if (confirmed) {
                          toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive });
                        }
                      }}
                      cursor="pointer"
                      title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </IconButton>
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell px={5} py={3} textAlign="end">
                    <HStack gap={1} justify="flex-end">
                      {/* Edit */}
                      <IconButton
                        variant="ghost"
                        size="xs"
                        color="indigo.600"
                        _hover={{ bg: 'indigo.50' }}
                        borderRadius="lg"
                        aria-label="Edit"
                        onClick={() => openEditModal(u)}
                        cursor="pointer"
                        title="Edit profil"
                      >
                        <Pencil size={14} />
                      </IconButton>

                      {/* Reset Password */}
                      <IconButton
                        variant="ghost"
                        size="xs"
                        color="amber.600"
                        _hover={{ bg: 'yellow.50' }}
                        borderRadius="lg"
                        aria-label="Reset Password"
                        onClick={() => openResetPassword(u)}
                        cursor="pointer"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </IconButton>

                      {/* Delete */}
                      <IconButton
                        variant="ghost"
                        size="xs"
                        color="red.600"
                        _hover={{ bg: 'red.50' }}
                        borderRadius="lg"
                        aria-label="Hapus"
                        onClick={() => {
                          if (confirm(`Hapus akun "${u.fullName}"? Tindakan ini tidak dapat dibatalkan.`)) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        cursor="pointer"
                        title="Hapus pengguna"
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}

              {filtered.length === 0 && !isLoading && (
                <Table.Row>
                  <Table.Cell colSpan={6} px={6} py={16} textAlign="center">
                    <Stack align="center" gap={2}>
                      <Users size={32} color="#d1d5db" />
                      <Text color="gray.400" fontStyle="italic" fontSize="sm">
                        {searchTerm ? 'Tidak ada pengguna yang cocok dengan pencarian' : 'Belum ada data pengguna'}
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
          <TablePagination
            currentPage={currentPage}
            totalCount={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
          </>
        )}
      </Box>

      {/* ── Modal: Create / Edit ─────────────────────────────────────────── */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <Box
          position="fixed"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          p={4}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <Box
            bg="white"
            borderRadius="2xl"
            shadow="2xl"
            w="full"
            maxW="lg"
            overflow="hidden"
          >
            {/* Modal Header */}
            <Flex
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              justify="space-between"
              align="center"
            >
              <Heading size="md" fontWeight="bold" color="gray.900">
                {modalMode === 'create' ? '+ Tambah Pengguna Baru' : `Edit: ${selectedUser?.fullName}`}
              </Heading>
              <IconButton variant="ghost" aria-label="Close" onClick={closeModal} cursor="pointer" size="sm">
                <Text fontSize="xl" color="gray.400">×</Text>
              </IconButton>
            </Flex>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <Stack gap={4} p={6}>
                {/* Role selector (create only) */}
                {modalMode === 'create' && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                      Role <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <Flex gap={2}>
                      {ROLE_OPTIONS.map(({ label, value }) => (
                        <Button
                          key={value}
                          type="button"
                          onClick={() => setForm({ ...form, role: value })}
                          flex={1}
                          py={2.5}
                          px={2}
                          borderRadius="lg"
                          borderWidth="2px"
                          fontWeight="semibold"
                          fontSize="sm"
                          cursor="pointer"
                          transition="all 0.15s"
                          variant="outline"
                          borderColor={form.role === value ? 'indigo.500' : 'gray.200'}
                          bg={form.role === value ? 'indigo.50' : 'white'}
                          color={form.role === value ? 'indigo.700' : 'gray.500'}
                          _hover={{ borderColor: 'indigo.400', bg: 'indigo.50', color: 'indigo.700' }}
                        >
                          {label}
                        </Button>
                      ))}
                    </Flex>
                  </Box>
                )}

                {/* Full Name */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Nama Lengkap <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="cth. Budi Santoso, S.Pd"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>

                <Flex gap={3}>
                  {/* Username (create only) */}
                  {modalMode === 'create' && (
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                        Username <span style={{ color: 'red' }}>*</span>
                      </Text>
                      <Input
                        required
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        placeholder="johndoe123"
                        fontFamily="mono"
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                  )}

                  {/* Email */}
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                      Email
                    </Text>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="user@sekolah.sch.id"
                      borderRadius="lg"
                      borderColor="gray.200"
                      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                    />
                  </Box>
                </Flex>

                {/* Password (create only) */}
                {modalMode === 'create' && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                      Password <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <Input
                      required
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 6 karakter"
                      borderRadius="lg"
                      borderColor="gray.200"
                      _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                    />
                  </Box>
                )}

                {/* Siswa: Pilih Rombel */}
                {form.role === 'SISWA' && (
                  <Flex gap={3}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                        NIS (Opsional)
                      </Text>
                      <Input
                        value={form.nis}
                        onChange={(e) => setForm({ ...form, nis: e.target.value })}
                        placeholder="cth. 100234"
                        borderRadius="lg"
                        borderColor="gray.200"
                        _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                        Rombel / Kelas
                      </Text>
                      <Select.Root
                        collection={rombelOptions}
                        value={form.rombelId ? [form.rombelId] : []}
                        onValueChange={(details) => setForm({ ...form, rombelId: details.value[0] || '' })}
                        positioning={{ sameWidth: true }}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="-- Pilih Rombel --" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                            <Select.ClearTrigger />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content>
                            {rombelOptions.items.map((item: any) => (
                              <Select.Item key={item.value} item={item}>
                                {item.label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    </Box>
                  </Flex>
                )}

                {/* Actions */}
                <Flex gap={3} pt={2}>
                  <Button
                    type="button"
                    onClick={closeModal}
                    flex={1}
                    variant="outline"
                    borderRadius="lg"
                    cursor="pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    flex={1}
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    cursor="pointer"
                    loading={createMutation.isPending || updateMutation.isPending}
                  >
                    {modalMode === 'create' ? 'Buat Akun' : 'Simpan Perubahan'}
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}

      {/* ── Modal: Reset Password ────────────────────────────────────────── */}
      {modalMode === 'reset-password' && selectedUser && (
        <Box
          position="fixed"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          p={4}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <Box bg="white" borderRadius="2xl" shadow="2xl" w="full" maxW="sm" overflow="hidden">
            <Flex px={6} py={4} borderBottom="1px solid" borderColor="gray.100" justify="space-between" align="center">
              <Box>
                <Heading size="md" fontWeight="bold" color="gray.900">
                  Reset Password
                </Heading>
                <Text fontSize="sm" color="gray.500" mt={0.5}>
                  {selectedUser.fullName}
                </Text>
              </Box>
              <IconButton variant="ghost" aria-label="Close" onClick={closeModal} cursor="pointer" size="sm">
                <Text fontSize="xl" color="gray.400">×</Text>
              </IconButton>
            </Flex>
            <form onSubmit={handleResetPassword}>
              <Stack gap={4} p={6}>
                <Box
                  bg="amber.50"
                  borderRadius="lg"
                  p={3}
                  borderWidth="1px"
                  borderColor="amber.200"
                >
                  <Text fontSize="xs" color="amber.800" fontWeight="medium">
                    ⚠️ Password baru akan langsung aktif. Infokan kepada pengguna terkait.
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Password Baru <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    type="password"
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Flex gap={3} pt={2}>
                  <Button type="button" onClick={closeModal} flex={1} variant="outline" borderRadius="lg" cursor="pointer">
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    flex={1}
                    bg="amber.500"
                    color="white"
                    _hover={{ bg: 'amber.600' }}
                    borderRadius="lg"
                    cursor="pointer"
                    loading={resetPasswordMutation.isPending}
                  >
                    Reset Password
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
