import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  photo?: string | null;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  hasHydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setAuth: (user: User, access_token: string, refresh_token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

function setAuthCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (!token) {
    document.cookie = 'auth_access_token=; Path=/; Max-Age=0; SameSite=Lax';
    return;
  }
  document.cookie = `auth_access_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      hasHydrated: false,
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      setAuth: (user, access_token, refresh_token) => {
        setAuthCookie(access_token);
        set({ user, access_token, refresh_token, hasHydrated: true });
      },
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
      logout: () => {
        setAuthCookie(null);
        set({ user: null, access_token: null, refresh_token: null, hasHydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
