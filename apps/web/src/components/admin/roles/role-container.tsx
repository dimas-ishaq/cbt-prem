'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
  Grid,
  createListCollection,
} from '@chakra-ui/react';
import { toast } from '@/lib/toaster';
import { useConfirm } from '@/components/ui/confirmation-dialog';

import { Plus } from 'lucide-react';

import type { Menu, RoleDetail, SubMenu } from './role-types';
import { RoleFormModal } from './_components/role-form-modal';
import { RoleAuditModal } from './_components/role-audit-modal';
import { RoleSecurityGuide } from './_components/role-security-guide';
import { RolesTable } from './_components/roles-table';
import { useRoles } from './hooks/use-roles';

export function RoleContainer() {
  const { user } = useAuthStore();
  const router = useRouter();
  const confirmDialog = useConfirm();

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [user, router]);

  const [searchTerm, setSearchTerm] = useState('');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditRoleId, setAuditRoleId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const statusOptions = createListCollection({
    items: [
      { label: 'Aktif (Dapat Ditugaskan)', value: 'true' },
      { label: 'Non-Aktif (Ditangguhkan)', value: 'false' },
    ],
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', isActive: true });
    setSelectedPermissionIds([]);
    setSelectedRole(null);
  };

  const { roles, matrix, auditLogs, rolesLoading, matrixLoading, auditLoading, createMutation, updateMutation, cloneMutation, deleteMutation } = useRoles(auditRoleId, () => {
    setIsModalOpen(false);
    resetForm();
  });


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

  const filteredRoles = useMemo(() => {
    return (roles || []).filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, currentPage, pageSize]);

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
          <RolesTable
            searchTerm={searchTerm}
            roles={paginatedRoles}
            totalCount={filteredRoles.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onSearchChange={setSearchTerm}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onEdit={openEditModal}
            onClone={openCloneModal}
            onAudit={openAuditModal}
            onDelete={async (role) => {
              const confirmed = await confirmDialog({
                title: 'Hapus Role',
                description: `Apakah Anda yakin ingin menghapus role "${role.name}" secara permanen?`,
                confirmText: 'Hapus',
              });
              if (confirmed) deleteMutation.mutate(role.id);
            }}
          />
        </Stack>

        <RoleSecurityGuide />
      </Grid>

      <RoleFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        selectedRole={selectedRole}
        formData={formData}
        statusOptions={statusOptions}
        matrix={matrix}
        matrixSearch={matrixSearch}
        selectedPermissionIds={selectedPermissionIds}
        isSubmitting={createMutation.isPending || updateMutation.isPending || cloneMutation.isPending}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        onFormChange={setFormData}
        onMatrixSearchChange={setMatrixSearch}
        onPermissionToggle={handlePermissionToggle}
        onSelectMenuAll={handleSelectMenuAll}
        onSelectSubMenuAll={handleSelectSubMenuAll}
      />
      {isAuditOpen && (
        <RoleAuditModal
          logs={auditLogs}
          isLoading={auditLoading}
          onClose={() => setIsAuditOpen(false)}
        />
      )}
    </Stack>
  );
}






