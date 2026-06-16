'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@chakra-ui/react/badge';
import { Box } from '@chakra-ui/react/box';
import { Button } from '@chakra-ui/react/button';
import { Flex } from '@chakra-ui/react/flex';
import { Grid } from '@chakra-ui/react/grid';
import { Heading } from '@chakra-ui/react/heading';
import { HStack } from '@chakra-ui/react/hstack';
import { IconButton } from '@chakra-ui/react/icon-button';
import { Input } from '@chakra-ui/react/input';
import { Spinner } from '@chakra-ui/react/spinner';
import { Stack } from '@chakra-ui/react/stack';
import { Table } from '@chakra-ui/react/table';
import { Text } from '@chakra-ui/react/text';
import { Textarea } from '@chakra-ui/react/textarea';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/ui/confirmation-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Search,
  ShieldAlert,
  History,
  ChevronRight,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface Permission {
  id: string;
  subMenuId: string;
  name: string;
  description: string | null;
  action: string;
  securityRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface SubMenu {
  id: string;
  menuId: string;
  name: string;
  url: string;
  permissions: Permission[];
}

interface Menu {
  id: string;
  name: string;
  icon: string | null;
  subMenus: SubMenu[];
}

interface RoleDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  permissionIds: string[];
}

interface AuditLog {
  id: string;
  actionType: string;
  actorId: string;
  createdAt: string;
  payloadBefore: any;
  payloadAfter: any;
}

export default function RolesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirm();

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone'>('create');
  
  // Audit log modal states
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditRoleId, setAuditRoleId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // 1. Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery<RoleDetail[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
  });

  // 2. Fetch permissions matrix
  const { data: matrix, isLoading: matrixLoading } = useQuery<Menu[]>({
    queryKey: ['permissions-matrix'],
    queryFn: async () => {
      const res = await api.get('/roles/permissions');
      return res.data;
    },
  });

  // 3. Fetch audit logs for a role
  const { data: auditLogs, isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', auditRoleId],
    queryFn: async () => {
      if (!auditRoleId) return [];
      const res = await api.get(`/roles/${auditRoleId}/audit-logs`);
      return res.data;
    },
    enabled: !!auditRoleId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Role berhasil dibuat!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat role');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Role berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui role');
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.post(`/roles/${id}/clone`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsModalOpen(false);
      resetForm();
      toast.success('Role berhasil diduplikasi!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menduplikasi role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role berhasil dihapus!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus role');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', isActive: true });
    setSelectedPermissionIds([]);
    setSelectedRole(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = async (role: RoleDetail) => {
    try {
      const res = await api.get(`/roles/${role.id}`);
      const detail: RoleDetail = res.data;
      setSelectedRole(detail);
      setFormData({
        name: detail.name,
        description: detail.description || '',
        isActive: detail.isActive,
      });
      setSelectedPermissionIds(res.data.permissionIds);
      setModalMode('edit');
      setIsModalOpen(true);
    } catch (err) {
      toast.error('Gagal mengambil detail role');
    }
  };

  const openCloneModal = (role: RoleDetail) => {
    setSelectedRole(role);
    setFormData({
      name: `${role.name} Copy`,
      description: `Copy of ${role.name}`,
      isActive: true,
    });
    setModalMode('clone');
    setIsModalOpen(true);
  };

  const openAuditModal = (roleId: string) => {
    setAuditRoleId(roleId);
    setIsAuditOpen(true);
  };

  const handlePermissionToggle = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const handleSelectSubMenuAll = (subMenu: SubMenu, isSelected: boolean) => {
    const permIds = subMenu.permissions.map((p) => p.id);
    if (isSelected) {
      setSelectedPermissionIds((prev) => [...new Set([...prev, ...permIds])]);
    } else {
      setSelectedPermissionIds((prev) => prev.filter((id) => !permIds.includes(id)));
    }
  };

  const handleSelectMenuAll = (menu: Menu, isSelected: boolean) => {
    const permIds: string[] = [];
    menu.subMenus.forEach((sm) => {
      sm.permissions.forEach((p) => permIds.push(p.id));
    });

    if (isSelected) {
      setSelectedPermissionIds((prev) => [...new Set([...prev, ...permIds])]);
    } else {
      setSelectedPermissionIds((prev) => prev.filter((id) => !permIds.includes(id)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'create') {
      createMutation.mutate({
        ...formData,
        permissionIds: selectedPermissionIds,
      });
    } else if (modalMode === 'edit' && selectedRole) {
      updateMutation.mutate({
        id: selectedRole.id,
        data: {
          ...formData,
          permissionIds: selectedPermissionIds,
        },
      });
    } else if (modalMode === 'clone' && selectedRole) {
      cloneMutation.mutate({
        id: selectedRole.id,
        name: formData.name,
      });
    }
  };

  const filteredRoles = roles?.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'red';
      case 'HIGH':
        return 'orange';
      case 'MEDIUM':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  if (rolesLoading || matrixLoading) {
    return (
      <Flex justify="center" align="center" py={16}>
        <Spinner size="lg" color="indigo.600" />
        <Text ml={3} color="gray.500">Memuat modul Manajemen Akses...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            Manajemen Akses & Role
          </Heading>
          <Text color="gray.500" mt={1}>
            Rancang kustomisasi role pengguna dan pemetaan matriks permission secara dinamis.
          </Text>
        </Box>
        <Button
          bg="indigo.600"
          color="white"
          _hover={{ bg: 'indigo.700' }}
          borderRadius="lg"
          px={4}
          py={2}
          fontWeight="medium"
          onClick={openCreateModal}
          cursor="pointer"
        >
          <Plus size={20} style={{ marginRight: '6px' }} />
          Tambah Role Kustom
        </Button>
      </Flex>

      {/* Main Grid: List and Matrix details preview */}
      <Grid templateColumns={{ base: '1fr', lg: '3fr 1fr' }} gap={6}>
        <Stack gap={4}>
          {/* Search box */}
          <Box bg="white" p={4} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100">
            <Flex align="center" position="relative" maxW="md">
              <Box position="absolute" left={3} color="gray.400">
                <Search size={18} />
              </Box>
              <Input
                pl={10}
                placeholder="Cari role berdasarkan nama atau deskripsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="lg"
                borderColor="gray.200"
                _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
              />
            </Flex>
          </Box>

          {/* Roles list */}
          <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
            <Table.Root size="md">
              <Table.Header>
                <Table.Row bg="gray.50">
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                    Nama Role
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                    Deskripsi
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                    Status
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign="end">
                    Aksi
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredRoles?.map((role) => (
                  <Table.Row key={role.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                    <Table.Cell px={6} py={4} fontWeight="medium" color="gray.900">
                      <HStack gap={2}>
                        <Text>{role.name}</Text>
                        {role.isSystem && (
                          <Badge colorPalette="blue" variant="solid" borderRadius="full" px={2} py={0.5} fontSize="2xs">
                            Sistem
                          </Badge>
                        )}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell px={6} py={4} fontSize="sm" color="gray.500" maxW="sm" truncate>
                      {role.description || '-'}
                    </Table.Cell>
                    <Table.Cell px={6} py={4}>
                      <Badge colorPalette={role.isActive ? 'green' : 'red'} variant="subtle" borderRadius="md" px={2}>
                        {role.isActive ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell px={6} py={4} textAlign="end">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          variant="ghost"
                          color="indigo.600"
                          _hover={{ bg: 'indigo.50' }}
                          size="sm"
                          borderRadius="lg"
                          aria-label="Edit Hak Akses"
                          onClick={() => openEditModal(role)}
                          cursor="pointer"
                        >
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          color="teal.600"
                          _hover={{ bg: 'teal.50' }}
                          size="sm"
                          borderRadius="lg"
                          aria-label="Duplikasi Role"
                          onClick={() => openCloneModal(role)}
                          cursor="pointer"
                        >
                          <Copy size={16} />
                        </IconButton>
                        <IconButton
                          variant="ghost"
                          color="purple.600"
                          _hover={{ bg: 'purple.50' }}
                          size="sm"
                          borderRadius="lg"
                          aria-label="Log Audit"
                          onClick={() => openAuditModal(role.id)}
                          cursor="pointer"
                        >
                          <History size={16} />
                        </IconButton>
                        {!role.isSystem && (
                          <IconButton
                            variant="ghost"
                            color="red.500"
                            _hover={{ bg: 'red.50' }}
                            size="sm"
                            borderRadius="lg"
                            aria-label="Delete Role"
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Hapus Role',
                                description: `Apakah Anda yakin ingin menghapus role "${role.name}" secara permanen?`,
                                confirmText: 'Hapus'
                              });
                              if (confirmed) {
                                deleteMutation.mutate(role.id);
                              }
                            }}
                            cursor="pointer"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {filteredRoles?.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={4} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
                      Tidak ada role kustom yang ditemukan.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </Stack>

        {/* Sidebar Info Card */}
        <Box bg="white" p={6} borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" h="fit-content">
          <Heading size="md" mb={4} fontWeight="bold" color="gray.800">
            Panduan Keamanan
          </Heading>
          <Stack gap={4}>
            <Box>
              <HStack gap={2} mb={1}>
                <ShieldAlert size={16} color="red" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">Level Risiko Kritis</Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Hindari memberikan permission `delete` atau `export` kepada user selain pimpinan sekolah / IT Administrator utama.
              </Text>
            </Box>
            <Box>
              <HStack gap={2} mb={1}>
                <Info size={16} color="teal" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">Cloning Role</Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Gunakan fitur duplikasi (Copy) untuk membuat variasi role dengan cepat tanpa menyusun ulang permission dari awal.
              </Text>
            </Box>
          </Stack>
        </Box>
      </Grid>

      {/* CREATE / EDIT / CLONE OVERLAY MODAL */}
      {isModalOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          py={6}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p={6}
            w="full"
            maxW="4xl"
            maxH="90vh"
            overflowY="auto"
            shadow="2xl"
            position="relative"
          >
            <Heading size="lg" fontWeight="bold" mb={4}>
              {modalMode === 'create' && 'Buat Role Baru'}
              {modalMode === 'edit' && `Ubah Role: ${selectedRole?.name}`}
              {modalMode === 'clone' && `Duplikasi Role: ${selectedRole?.name}`}
            </Heading>

            <form onSubmit={handleSubmit}>
              <Stack gap={6}>
                {/* Form fields */}
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                      Nama Role <span style={{ color: 'red' }}>*</span>
                    </Text>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Pengawas Ujian Piket"
                      borderRadius="lg"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                      Status Peran
                    </Text>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      style={{
                        width: '100%',
                        height: '40px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        padding: '0 12px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="true">Aktif (Dapat Ditugaskan)</option>
                      <option value="false">Non-Aktif (Ditangguhkan)</option>
                    </select>
                  </Box>
                </Grid>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Deskripsi Ringkas
                  </Text>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tulis tujuan hak akses role ini dibuat..."
                    borderRadius="lg"
                    rows={2}
                  />
                </Box>

                {/* Matrix Checklist (only show for create/edit, clone just duplicates behind the scenes) */}
                {modalMode !== 'clone' && (
                  <Box border="1px solid" borderColor="gray.200" borderRadius="xl" overflow="hidden">
                    <Flex bg="gray.50" px={4} py={3} justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200">
                      <Heading size="sm" color="gray.700">Matriks Hak Akses (Permission Matrix)</Heading>
                      <Input
                        maxW="xs"
                        size="xs"
                        bg="white"
                        placeholder="Cari permission..."
                        value={matrixSearch}
                        onChange={(e) => setMatrixSearch(e.target.value)}
                        borderRadius="md"
                      />
                    </Flex>

                    <Stack p={4} gap={6} maxH="40vh" overflowY="auto">
                      {matrix?.map((menu) => {
                        const filteredSubmenus = menu.subMenus.filter((sm) =>
                          sm.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
                          sm.permissions.some((p) => p.name.toLowerCase().includes(matrixSearch.toLowerCase()) || (p.description && p.description.toLowerCase().includes(matrixSearch.toLowerCase())))
                        );

                        if (filteredSubmenus.length === 0) return null;

                        const allMenuPermIds = menu.subMenus.flatMap((sm) => sm.permissions.map((p) => p.id));
                        const isMenuAllChecked = allMenuPermIds.every((id) => selectedPermissionIds.includes(id));

                        return (
                          <Box key={menu.id} borderWidth="1px" borderColor="gray.100" borderRadius="lg" p={4} bg="gray.50/30">
                            <Flex justify="space-between" align="center" mb={3} borderBottom="1px dashed" borderColor="gray.200" pb={2}>
                              <HStack gap={2}>
                                <ChevronRight size={18} color="indigo" />
                                <Text fontWeight="bold" color="indigo.700" fontSize="sm">{menu.name}</Text>
                              </HStack>
                              <Button
                                size="xs"
                                variant="outline"
                                colorPalette="indigo"
                                onClick={() => handleSelectMenuAll(menu, !isMenuAllChecked)}
                                cursor="pointer"
                              >
                                {isMenuAllChecked ? 'Batalkan Semua' : 'Pilih Semua Modul'}
                              </Button>
                            </Flex>

                            <Stack gap={4}>
                              {filteredSubmenus.map((subMenu) => {
                                const allSubPermIds = subMenu.permissions.map((p) => p.id);
                                const isSubAllChecked = allSubPermIds.every((id) => selectedPermissionIds.includes(id));

                                return (
                                  <Box key={subMenu.id} bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.100">
                                    <Flex justify="space-between" align="center" mb={2}>
                                      <Text fontSize="xs" fontWeight="semibold" color="gray.600">{subMenu.name}</Text>
                                      <Button
                                        size="2xs"
                                        variant="ghost"
                                        colorPalette="gray"
                                        onClick={() => handleSelectSubMenuAll(subMenu, !isSubAllChecked)}
                                        cursor="pointer"
                                      >
                                        {isSubAllChecked ? 'Clear' : 'Check All'}
                                      </Button>
                                    </Flex>

                                    <Flex wrap="wrap" gap={3}>
                                      {subMenu.permissions.map((p) => {
                                        const isChecked = selectedPermissionIds.includes(p.id);
                                        const isCritical = p.securityRiskLevel === 'CRITICAL' || p.securityRiskLevel === 'HIGH';

                                        return (
                                          <Box
                                            key={p.id}
                                            onClick={() => handlePermissionToggle(p.id)}
                                            px={3}
                                            py={2}
                                            bg={isChecked ? (isCritical ? 'red.50' : 'indigo.50') : 'gray.50'}
                                            border="1px solid"
                                            borderColor={isChecked ? (isCritical ? 'red.300' : 'indigo.300') : 'gray.200'}
                                            borderRadius="md"
                                            cursor="pointer"
                                            _hover={{ borderColor: isCritical ? 'red.400' : 'indigo.400' }}
                                            transition="all 0.15s"
                                            display="flex"
                                            alignItems="center"
                                            gap={2}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {}} // handled by outer Box onClick
                                              style={{ cursor: 'pointer' }}
                                            />
                                            <Box>
                                              <HStack gap={1}>
                                                <Text fontSize="xs" fontWeight="medium" color={isChecked ? (isCritical ? 'red.900' : 'indigo.900') : 'gray.700'}>
                                                  {p.action.toUpperCase()}
                                                </Text>
                                                {isCritical && (
                                                  <Badge colorPalette="red" variant="solid" scale="xs" borderRadius="full" fontSize="3xs">
                                                    RISK
                                                  </Badge>
                                                )}
                                              </HStack>
                                              <Text fontSize="2xs" color="gray.400" maxW="200px" truncate>
                                                {p.description || p.name}
                                              </Text>
                                            </Box>
                                          </Box>
                                        );
                                      })}
                                    </Flex>
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                )}

                {/* Submit Actions */}
                <Flex justify="flex-end" gap={3} borderTop="1px solid" borderColor="gray.100" pt={4}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    borderRadius="lg"
                    cursor="pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    loading={createMutation.isPending || updateMutation.isPending || cloneMutation.isPending}
                    cursor="pointer"
                  >
                    Simpan Perubahan
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}

      {/* AUDIT LOG MODAL */}
      {isAuditOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Box
            bg="white"
            borderRadius="xl"
            p={6}
            w="full"
            maxW="2xl"
            maxH="80vh"
            overflowY="auto"
            shadow="2xl"
          >
            <Heading size="lg" fontWeight="bold" mb={4}>
              Log Audit Perubahan Hak Akses
            </Heading>

            {auditLoading ? (
              <Flex justify="center" py={8}>
                <Spinner color="indigo.600" />
              </Flex>
            ) : (
              <Stack gap={4}>
                {auditLogs?.map((log, index) => (
                  <Box key={log.id} fontSize="sm" borderTop={index > 0 ? "1px solid" : "none"} borderColor="gray.100" pt={index > 0 ? 4 : 0}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Badge
                        colorPalette={
                          log.actionType === 'ROLE_CREATE'
                            ? 'green'
                            : log.actionType === 'ROLE_DELETE'
                            ? 'red'
                            : 'orange'
                        }
                        borderRadius="md"
                      >
                        {log.actionType}
                      </Badge>
                      <Text fontSize="xs" color="gray.400">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </Text>
                    </Flex>
                    <Text color="gray.600" mb={2} fontSize="xs">
                      Aktor ID: {log.actorId}
                    </Text>
                    {log.payloadBefore && (
                      <Box bg="gray.50" p={2} borderRadius="md" mb={2}>
                        <Text fontWeight="semibold" fontSize="xs" color="gray.500">Sebelum:</Text>
                        <pre style={{ fontSize: '10px', overflowX: 'auto' }}>
                          {JSON.stringify(log.payloadBefore, null, 2)}
                        </pre>
                      </Box>
                    )}
                    {log.payloadAfter && (
                      <Box bg="indigo.50/30" p={2} borderRadius="md">
                        <Text fontWeight="semibold" fontSize="xs" color="indigo.500">Sesudah:</Text>
                        <pre style={{ fontSize: '10px', overflowX: 'auto' }}>
                          {JSON.stringify(log.payloadAfter, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </Box>
                ))}
                {auditLogs?.length === 0 && (
                  <Text py={8} textAlign="center" color="gray.500" fontStyle="italic">
                    Belum ada log audit untuk role ini.
                  </Text>
                )}
              </Stack>
            )}

            <Flex justify="flex-end" mt={6}>
              <Button
                bg="indigo.600"
                color="white"
                _hover={{ bg: 'indigo.700' }}
                onClick={() => setIsAuditOpen(false)}
                borderRadius="lg"
                cursor="pointer"
              >
                Tutup
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
