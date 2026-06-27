'use client';

import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Box, Flex, Heading, Text, Button, Stack, HStack, createListCollection } from '@chakra-ui/react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import {
  Plus,
  Download,
  Upload,
} from 'lucide-react';
import type { ActiveTab, UserData, UserFormData } from './user-types';
import { TABS, countUsersByTab, filterUsers, paginateUsers } from './user-utils';
import { ResetPasswordModal } from './_components/reset-password-modal';
import { UserFormModal } from './_components/user-form-modal';
import { UsersTable } from './_components/users-table';
import { useUsers } from './hooks/use-users';

export function UserContainer() {
  const { user } = useAuthStore();
  const router = useRouter();
  const confirmDialog = useConfirm();

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.push('/admin');
  }, [user, router]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'reset-password' | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [form, setForm] = useState<UserFormData>({
    username: '', email: '', password: '', fullName: '', role: 'SISWA', rombelId: '', nis: '',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
  };

  const {
    users,
    rombels,
    isLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    toggleActiveMutation,
    resetPasswordMutation,
    queryClient,
  } = useUsers(closeModal);

  const rombelOptions = createListCollection({
    items: rombels.map((r: any) => ({ label: r.name, value: r.id })),
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
      const usersData = lines.slice(1).map((line) => {
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

      const response = await api.post('/users/import', { users: usersData });
      const result = response.data;
      toast.success(`Import selesai. Dibuat: ${result.created ?? 0}, Diperbarui: ${result.updated ?? 0}`);
      if (result.errors?.length) {
        toast.error(result.errors.slice(0, 3).join(' | '));
      }
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Gagal import CSV');
    } finally {
      setIsImporting(false);
    }
  };

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error('Gagal mengekspor: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  const filtered = useMemo(() => filterUsers(users, activeTab, searchTerm), [users, activeTab, searchTerm]);
  const paginated = useMemo(() => paginateUsers(filtered, currentPage, pageSize), [filtered, currentPage, pageSize]);
  const counts = useMemo(() => countUsersByTab(users), [users]);

  // Render
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

      <UsersTable
        activeTab={activeTab}
        searchTerm={searchTerm}
        counts={counts}
        users={paginated}
        filteredCount={filtered.length}
        isLoading={isLoading}
        currentPage={currentPage}
        pageSize={pageSize}
        onTabChange={setActiveTab}
        onSearchChange={setSearchTerm}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onEdit={openEditModal}
        onResetPassword={openResetPassword}
        onDelete={(u) => {
          if (confirm(`Hapus akun "${u.fullName}"? Tindakan ini tidak dapat dibatalkan.`)) {
            deleteMutation.mutate(u.id);
          }
        }}
        onToggleActive={async (u) => {
          const confirmed = await confirmDialog({
            title: 'Konfirmasi',
            description: `${u.isActive ? 'Nonaktifkan' : 'Aktifkan'} akun ${u.fullName}?`,
            confirmText: u.isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
          });
          if (confirmed) toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive });
        }}
      />
      {(modalMode === 'create' || modalMode === 'edit') && (
        <UserFormModal
          mode={modalMode}
          selectedUser={selectedUser}
          form={form}
          rombelOptions={rombelOptions}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onChangeForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
      {modalMode === 'reset-password' && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          newPassword={newPassword}
          isLoading={resetPasswordMutation.isPending}
          onChangePassword={setNewPassword}
          onClose={closeModal}
          onSubmit={handleResetPassword}
        />
      )}
    </Stack>
  );
}



