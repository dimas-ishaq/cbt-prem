export interface Student {
  id: string;
  nis: string;
  rombelId?: string | null;
  majorId?: string | null;
  user: {
    fullName: string;
    email: string;
    username: string;
  };
}

export interface Rombel {
  id: string;
  name: string;
  majorId: string;
  major?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    students: number;
  };
  students?: Student[];
}

export interface Major {
  id: string;
  name: string;
}

export interface RombelFormData {
  name: string;
  majorId: string;
}
