import { create } from 'zustand';

export interface ExamCardStudentSnapshot {
  id: string;
  nis: string;
  rombelId?: string | null;
  majorId?: string | null;
  user: {
    fullName: string;
    email: string;
    username: string;
  };
  rombel?: {
    name: string;
  };
  major?: {
    name: string;
  };
}

export type ExamCardLayout = 'grid-6' | 'grid-4';

export interface ExamCardPayload {
  selectedRombelId: string;
  selectedExamGroupId: string;
  selectedStudentIds: string[];
  headmasterName: string;
  cardLayout: ExamCardLayout;
  students: ExamCardStudentSnapshot[];
}

interface ExamCardState {
  payload: ExamCardPayload | null;
  setPayload: (payload: ExamCardPayload) => void;
  clearPayload: () => void;
  updateStudents: (students: ExamCardStudentSnapshot[]) => void;
}

export const useExamCardStore = create<ExamCardState>((set) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
  clearPayload: () => set({ payload: null }),
  updateStudents: (students) =>
    set((state) => ({
      payload: state.payload ? { ...state.payload, students } : state.payload,
    })),
}));
