'use client';

import api from '@/lib/api';
import { toast } from '@/lib/toaster';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Box, Flex, Heading, Text, Button, Stack, HStack, createListCollection, Dialog, Portal, Input } from '@chakra-ui/react';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import {
  Plus,
  Download,
  Upload,
  AlertTriangle,
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

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
    <Stack gap={6} bg="bg.canvas" color="text.primary" minH="100vh">
      {/* Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <Box>
          <Text color="brand.text" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="0.12em" mb={2}>
            User dashboard
          </Text>
          <Heading size="xl" fontWeight="bold" color="text.primary">
            Manajemen Akun Pengguna
          </Heading>
          <Text color="text.secondary" mt={1} fontSize="sm">
            Kelola semua akun pengguna sistem — Super Admin, Guru, dan Siswa
          </Text>
        </Box>
        <HStack gap={3} flexWrap="wrap">
          <Button
            variant="outline"
            borderColor="border.default"
            color="text.secondary"
            _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }}
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
            borderColor="border.default"
            color="text.secondary"
            _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }}
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
            borderColor="border.default"
            color="text.secondary"
            _hover={{ bg: 'bg.elevated', borderColor: 'brand.text', color: 'text.primary' }}
            borderRadius="lg"
            size="sm"
            onClick={handleExport}
            cursor="pointer"
          >
            <Download size={16} style={{ marginRight: 6 }} />
            Export CSV
          </Button>
          <Button
            bg="brand.solid"
            color="text.inverted"
            _hover={{ bg: 'brand.text' }}
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
              void handleImportFile(file);
              e.currentTarget.value = '';
            }}
          />
        </HStack>
      </Flex>

      {/* Stats Cards */}
      <Flex gap={4} wrap="wrap">
        {(() => {
          const tabMetaMap: Record<string, { color: string; bg: string }> = {
            SUPER_ADMIN: { color: '#9C55E8', bg: 'rgba(156, 85, 232, 0.1)' },
            GURU: { color: '#2D9BF0', bg: 'rgba(45, 155, 240, 0.1)' },
            SISWA: { color: '#1ABE71', bg: 'rgba(26, 190, 113, 0.1)' },
          };
          return TABS.slice(1).map(({ key, label, icon: Icon }) => {
            const meta = tabMetaMap[key] || { color: '#8A8A8A', bg: 'rgba(138, 138, 138, 0.1)' };
            const isActive = activeTab === key;
            return (
              <Box
                key={key}
                flex="1"
                minW="140px"
                bg="bg.surface"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.default"
                p={4}
                shadow="card-dark"
                cursor="pointer"
                onClick={() => setActiveTab(key)}
                transition="all 0.2s"
                _hover={{ shadow: '0 4px 16px rgba(0,0,0,0.5)', borderColor: meta.color }}
                borderBottomWidth={isActive ? '3px' : '1px'}
                borderBottomColor={isActive ? meta.color : 'border.default'}
              >
                <Flex align="center" gap={3}>
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg={meta.bg}
                    color={meta.color}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon size={20} />
                  </Box>
                  <Box>
                    <Text fontSize="2xl" fontWeight="bold" color="text.primary" lineHeight="1">
                      {counts[key]}
                    </Text>
                    <Text fontSize="xs" color="text.secondary" mt={0.5}>
                      {label}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            );
          });
        })()}
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
          setUserToDelete(u);
          setDeleteConfirmationInput('');
          setIsDeleteModalOpen(true);
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

      <Dialog.Root open={isDeleteModalOpen} onOpenChange={(d: any) => setIsDeleteModalOpen(d.open)} size="md">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content 
              borderRadius="md" 
              overflow="hidden" 
              bg={{ base: '#FFFFFF', _dark: '#1B1B1B' }} 
              border="1px solid" 
              borderColor={{ base: '#E2E8F0', _dark: '#3D3D3D' }}
            >
              <Dialog.Header 
                bg={{ base: '#F7FAFC', _dark: '#242424' }} 
                py={4} 
                borderBottom="1px solid" 
                borderColor={{ base: '#E2E8F0', _dark: '#3D3D3D' }}
              >
                <Dialog.Title 
                  fontSize="md" 
                  fontWeight="bold" 
                  color={{ base: '#E53E3E', _dark: '#EF4444' }} 
                  display="flex" 
                  alignItems="center" 
                  gap={2}
                >
                  <AlertTriangle size={18} /> Hapus Akun Pengguna
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body p={6} bg={{ base: '#FFFFFF', _dark: '#1B1B1B' }}>
                <Stack gap={4}>
                  <Text fontSize="sm" color={{ base: '#2D3748', _dark: '#E0E0E0' }} lineHeight="relaxed">
                    Apakah Anda yakin ingin menghapus akun <strong>{userToDelete?.fullName}</strong> ({userToDelete?.username})? 
                    Tindakan ini tidak dapat dibatalkan dan semua data yang berkaitan dengan pengguna ini akan dihapus secara permanen.
                  </Text>
                  <Box 
                    bg={{ base: '#FFF5F5', _dark: '#242424' }} 
                    p={3} 
                    borderRadius="sm" 
                    borderLeft="4px solid" 
                    borderColor={{ base: '#E53E3E', _dark: '#EF4444' }}
                  >
                    <Text fontSize="xs" color={{ base: '#E53E3E', _dark: '#EF4444' }} fontWeight="bold">
                      PERINGATAN: Menghapus akun ini akan menghapus riwayat pengerjaan ujian dan data terkait lainnya.
                    </Text>
                  </Box>
                  <Box mt={2}>
                    <Text 
                      fontSize="xs" 
                      fontWeight="bold" 
                      color={{ base: '#718096', _dark: '#8A8A8A' }} 
                      mb={2} 
                      textTransform="uppercase" 
                      letterSpacing="wider"
                    >
                      Ketik &quot;hapus&quot; untuk mengonfirmasi:
                    </Text>
                    <Input
                      value={deleteConfirmationInput}
                      onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                      placeholder="Ketik hapus"
                      borderRadius="sm"
                      borderColor={{ base: '#CBD5E0', _dark: '#3D3D3D' }}
                      bg={{ base: '#EDF2F7', _dark: '#2D2D2D' }}
                      color={{ base: '#1A202C', _dark: '#E0E0E0' }}
                      _focus={{ borderColor: { base: '#3182CE', _dark: '#9C55E8' }, outline: 'none' }}
                    />
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer 
                p={6} 
                bg={{ base: '#F7FAFC', _dark: '#242424' }} 
                borderTop="1px solid" 
                borderColor={{ base: '#E2E8F0', _dark: '#3D3D3D' }}
              >
                <Flex gap={3} width="full">
                  <Dialog.ActionTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      borderColor={{ base: '#CBD5E0', _dark: '#3D3D3D' }} 
                      color={{ base: '#4A5568', _dark: '#E0E0E0' }}
                      _hover={{ bg: { base: '#EDF2F7', _dark: '#2D2D2D' } }}
                      borderRadius="sm" 
                      flex={1}
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Batal
                    </Button>
                  </Dialog.ActionTrigger>
                  <Button
                    onClick={() => {
                      if (deleteConfirmationInput.trim().toLowerCase() === 'hapus' && userToDelete) {
                        deleteMutation.mutate(userToDelete.id, {
                          onSuccess: () => {
                            setIsDeleteModalOpen(false);
                            setUserToDelete(null);
                            setDeleteConfirmationInput('');
                          }
                        });
                      }
                    }}
                    disabled={deleteConfirmationInput.trim().toLowerCase() !== 'hapus' || deleteMutation.isPending}
                    flex={1}
                    bg={{ base: '#E53E3E', _dark: '#EF4444' }}
                    color="#ffffff"
                    _hover={{ bg: { base: '#C53030', _dark: '#D32F2F' } }}
                    _disabled={{ 
                      bg: { base: '#FED7D7', _dark: '#5D2A2A' }, 
                      color: { base: '#E53E3E', _dark: '#8A8A8A' }, 
                      cursor: 'not-allowed' 
                    }}
                    borderRadius="sm"
                    loading={deleteMutation.isPending}
                  >
                    Hapus Permanen
                  </Button>
                </Flex>
              </Dialog.Footer>
              <Dialog.CloseTrigger color={{ base: '#4A5568', _dark: '#E0E0E0' }} />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}



