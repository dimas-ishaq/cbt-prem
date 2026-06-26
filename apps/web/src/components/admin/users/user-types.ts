export type UserRole = 'SUPER_ADMIN' | 'GURU' | 'SISWA' | 'ADMIN_SEKOLAH' | 'PENGAWAS';
export type ActiveTab = 'ALL' | 'SUPER_ADMIN' | 'GURU' | 'SISWA';

export interface UserData {
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

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  rombelId: string;
  nis: string;
}
