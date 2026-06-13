'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, FileText, Trash2, Search, Calendar, Clock, Lock } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  subject: {
    name: string;
  };
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  token?: string;
}

export default function ExamsPage() {
  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  if (isLoading) return <div>Loading exams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-500">Schedule and manage your examinations.</p>
        </div>
        <Link
          href="/admin/exams/create"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Schedule Exam</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Exam Title</th>
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Schedule</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {exams?.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{exam.title}</div>
                  {exam.token && (
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Lock size={12} className="mr-1" />
                      Token: {exam.token}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">{exam.subject.name}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{new Date(exam.startTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1 text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    <span>{exam.duration} mins</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                    exam.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                    exam.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {exam.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Link
                      href={`/admin/results/${exam.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Results"
                    >
                      <FileText size={18} />
                    </Link>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this exam?')) {
                          deleteMutation.mutate(exam.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {exams?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                  No exams scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
