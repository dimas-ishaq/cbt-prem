'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  subject: {
    name: string;
  };
}

export function ExamList() {
  const { data: exams, isLoading, error } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return response.data;
    },
  });

  if (isLoading) return <div className="text-center">Loading exams...</div>;
  if (error) return <div className="text-red-500 text-center">Failed to load exams</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {exams?.map((exam) => (
        <div key={exam.id} className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
              {exam.subject.name}
            </span>
            <span className="text-sm text-gray-500">{exam.duration} mins</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exam.description}</p>
          <div className="text-sm text-gray-500 mb-6">
            <p>Start: {new Date(exam.startTime).toLocaleString()}</p>
            <p>End: {new Date(exam.endTime).toLocaleString()}</p>
          </div>
          <Link
            href={`/exams/${exam.id}`}
            className="block w-full text-center py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Ikuti Ujian
          </Link>
        </div>
      ))}
      {exams?.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          Belum ada ujian yang tersedia.
        </div>
      )}
    </div>
  );
}
