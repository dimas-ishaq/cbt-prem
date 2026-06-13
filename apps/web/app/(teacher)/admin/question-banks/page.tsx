'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, FileText, Trash2, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface QuestionBank {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
  };
  _count: {
    questions: number;
  };
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function QuestionBanksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subjectId: '' });
  const queryClient = useQueryClient();

  const { data: questionBanks, isLoading } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks'],
    queryFn: async () => {
      const response = await api.get('/question-banks');
      return response.data;
    },
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (newBank: typeof formData) => api.post('/question-banks', newBank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-banks'] });
      setIsModalOpen(false);
      setFormData({ name: '', subjectId: '' });
    },
  });

  if (isLoading) return <div>Loading question banks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Banks</h1>
          <p className="text-gray-500">Organize your questions into banks by subject.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>New Question Bank</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionBanks?.map((bank) => (
          <div key={bank.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {bank.subject.name}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {bank.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {bank._count.questions} questions
              </p>
              
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Created {new Date(bank.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/admin/question-banks/${bank.id}`}
                  className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Manage Questions
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {questionBanks?.length === 0 && (
          <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full text-gray-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No question banks yet</h3>
            <p className="text-gray-500 mt-2">Start by creating your first question bank to add questions.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Create Bank</span>
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Create Question Bank</h2>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Midterm Exam Prep"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select Subject</option>
                  {subjects?.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
