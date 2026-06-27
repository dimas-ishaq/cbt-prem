export interface TeacherSummary {
  id: string;
  nip?: string | null;
  user?: { fullName?: string; username?: string } | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  teachers?: TeacherSummary[];
  _count?: { teachers: number; questionBanks: number; exams: number };
}

export interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  teacherIds: string[];
}

export const emptySubjectForm: SubjectFormData = {
  name: '',
  code: '',
  description: '',
  teacherIds: [],
};

