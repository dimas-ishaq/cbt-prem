export interface Major {
  id: string;
  name: string;
  code: string;
  description: string | null;
  _count?: {
    students: number;
  };
}

export interface MajorFormData {
  name: string;
  code: string;
  description: string;
}
