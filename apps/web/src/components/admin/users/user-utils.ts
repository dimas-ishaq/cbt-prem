import type { LucideIcon } from 'lucide-react';
import { BookOpen, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import type { ActiveTab, UserData, UserRole } from './user-types';

export const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Guru', value: 'GURU' },
  { label: 'Siswa', value: 'SISWA' },
];

export const ROLE_BADGE: Record<UserRole, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'brand.text', bg: 'brand.subtle' },
  GURU: { label: 'Guru', color: 'info.600', bg: 'info.50' },
  SISWA: { label: 'Siswa', color: 'status.success.text', bg: 'status.success.bg' },
  ADMIN_SEKOLAH: { label: 'Admin Sekolah', color: 'status.warning.text', bg: 'status.warning.bg' },
  PENGAWAS: { label: 'Pengawas', color: 'accent.gold', bg: 'accent.gold.bg' },
};

export const AVATAR_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: '#774AA4',
  GURU: '#2D9BF0',
  SISWA: '#1ABE71',
  ADMIN_SEKOLAH: '#F5A623',
  PENGAWAS: '#9C55E8',
};

export const TABS: { key: ActiveTab; label: string; icon: LucideIcon }[] = [
  { key: 'ALL', label: 'Semua Pengguna', icon: Users },
  { key: 'SUPER_ADMIN', label: 'Super Admin', icon: ShieldCheck },
  { key: 'GURU', label: 'Guru', icon: BookOpen },
  { key: 'SISWA', label: 'Siswa', icon: GraduationCap },
];

export function filterUsers(users: UserData[], activeTab: ActiveTab, searchTerm: string) {
  const q = searchTerm.toLowerCase();
  return users.filter((u) => {
    if (activeTab !== 'ALL' && u.role !== activeTab) return false;
    if (!searchTerm) return true;
    return u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });
}

export function paginateUsers(users: UserData[], currentPage: number, pageSize: number) {
  const start = (currentPage - 1) * pageSize;
  return users.slice(start, start + pageSize);
}

export function countUsersByTab(users: UserData[]): Record<ActiveTab, number> {
  return {
    ALL: users.length,
    SUPER_ADMIN: users.filter((u) => u.role === 'SUPER_ADMIN').length,
    GURU: users.filter((u) => u.role === 'GURU').length,
    SISWA: users.filter((u) => u.role === 'SISWA').length,
  };
}

