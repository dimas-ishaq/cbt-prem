'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { use } from 'react';
import { ChevronLeft, User, Award, Clock, FileText, CheckCircle, XCircle, AlertCircle, FileDown } from 'lucide-react';
import Link from 'next/link';

interface Student {
  user: {
    fullName: string;
    username: string;
  };
}

interface ExamSession {
  id: string;
  student: {
    user: {
      fullName: string;
      username: string;
    };
    nisn: string;
  };
  startTime: string;
  endTime: string;
  score: number | null;
  status: string;
  answers: any[];
}

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: exam } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}`);
      return response.data;
    },
  });

  const { data: sessions, isLoading } = useQuery<ExamSession[]>({
    queryKey: ['exam-sessions', id],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${id}`);
      return response.data;
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(`/exam-sessions/exam/${id}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results-${exam?.title || id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });

  if (isLoading) return <div className="p-8">Loading results...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/exams" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exam Results: {exam?.title}</h1>
            <p className="text-gray-500">{exam?.subject.name} • {sessions?.length} Submissions</p>
          </div>
        </div>
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <FileDown size={20} />
          <span>{exportMutation.isPending ? 'Exporting...' : 'Export Excel'}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Time Spent</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Score</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {sessions?.map((session) => {
              const start = new Date(session.startTime);
              const end = session.endTime ? new Date(session.endTime) : null;
              const diff = end ? Math.round((end.getTime() - start.getTime()) / 60000) : '-';

              return (
                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{session.student.user.fullName}</div>
                        <div className="text-xs text-gray-400">@{session.student.user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-gray-400" />
                      <span>{diff} mins</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${
                      session.status === 'FINISHED' || session.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' :
                      session.status === 'ONGOING' || session.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <Award size={16} className={session.score !== null ? 'text-yellow-500' : 'text-gray-300'} />
                      <span className="font-bold">{session.score ?? '--'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/results/sessions/${session.id}`}
                      className="inline-flex items-center space-x-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <FileText size={16} />
                      <span>Details & Grade</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
