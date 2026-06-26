import type { Rombel, Student } from './rombel-types';

export function filterRombels(
  rombels: Rombel[] | undefined,
  searchTerm: string,
  filterMajorId: string,
  filterGrade: string,
) {
  return rombels?.filter((r) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      r.major?.name.toLowerCase().includes(query);
    const matchesMajor = !filterMajorId || r.majorId === filterMajorId;
    const matchesGrade = !filterGrade || r.name.toLowerCase().startsWith(`${filterGrade.toLowerCase()} `);
    return matchesSearch && matchesMajor && matchesGrade;
  });
}

export function filterRombelStudents(students: Student[] | undefined, searchTerm: string) {
  return students?.filter((student) =>
    student.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm),
  );
}

export function filterManageableStudents(
  students: Student[] | undefined,
  searchTerm: string,
  majorId: string,
  rombelId: string,
) {
  return students?.filter((student) => {
    const matchesSearch =
      student.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis.includes(searchTerm);
    const matchesMajor = !majorId || student.majorId === majorId;
    const matchesRombel = rombelId === 'no-class' ? !student.rombelId : !rombelId || student.rombelId === rombelId;
    return matchesSearch && matchesMajor && matchesRombel;
  });
}
