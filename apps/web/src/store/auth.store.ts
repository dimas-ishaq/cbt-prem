import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      hasHydrated: false,
      setHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      setAuth: (user, access_token, refresh_token) => set({ user, access_token, refresh_token, hasHydrated: true }),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
      logout: () => set({ user: null, access_token: null, refresh_token: null, hasHydrated: true }),
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
