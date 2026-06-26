import type { Major } from './major-types';

export function filterMajors(majors: Major[] | undefined, searchTerm: string) {
  const query = searchTerm.toLowerCase();
  return (majors || []).filter((major) =>
    major.name.toLowerCase().includes(query) ||
    major.code.toLowerCase().includes(query),
  );
}

export function paginateMajors(majors: Major[], currentPage: number, pageSize: number) {
  const start = (currentPage - 1) * pageSize;
  return majors.slice(start, start + pageSize);
}
