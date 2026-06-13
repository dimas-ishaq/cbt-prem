'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ChevronLeft, Save, Plus, Trash2, HelpCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Subject {
  id: string;
  name: string;
}

interface QuestionBank {
  id: string;
  name: string;
  subjectId: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  points: number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    token: '',
    password: '',
    maxAttempts: 1,
    randomizeSoal: true,
    randomizeOpsi: true,
    passingGrade: 0,
    status: 'DRAFT',
  });

  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      return response.data;
    },
  });

  const { data: questionBanks } = useQuery<QuestionBank[]>({
    queryKey: ['question-banks', formData.subjectId],
    queryFn: async () => {
      const response = await api.get('/question-banks');
      return response.data.filter((b: any) => b.subjectId === formData.subjectId);
    },
    enabled: !!formData.subjectId,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['questions', selectedBankId],
    queryFn: async () => {
      const response = await api.get(`/question-banks/${selectedBankId}`);
      return response.data.questions;
    },
    enabled: !!selectedBankId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/exams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      router.push('/admin/exams');
    },
  });

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question.');
      return;
    }
    createMutation.mutate({
      ...formData,
      questionIds: selectedQuestionIds,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/exams"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Schedule New Exam</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Exam Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mathematics Midterm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Select Questions</h2>
            
            {!formData.subjectId ? (
              <div className="text-center py-8 text-gray-500">
                Please select a subject first to browse questions.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Bank</label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Bank</option>
                    {questionBanks?.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {selectedBankId && (
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg divide-y">
                    {questions?.map((q) => (
                      <div 
                        key={q.id} 
                        className={`p-4 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedQuestionIds.includes(q.id) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleQuestion(q.id)}
                      >
                        <div className={`mt-1 flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center ${
                          selectedQuestionIds.includes(q.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                        }`}>
                          {selectedQuestionIds.includes(q.id) && <CheckCircle2 size={14} />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.content }} />
                          <div className="flex space-x-2 mt-1">
                            <span className="text-xs text-gray-500">{q.type}</span>
                            <span className="text-xs text-gray-500">{q.points} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {questions?.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No questions found in this bank.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Exam Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Token (Optional)</label>
                <input
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. ABCXYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="********"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.randomizeSoal}
                    onChange={(e) => setFormData({ ...formData, randomizeSoal: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Randomize Question Order</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.randomizeOpsi}
                    onChange={(e) => setFormData({ ...formData, randomizeOpsi: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Randomize Options Order</span>
                </label>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">Selected Questions:</span>
                  <span className="font-bold text-gray-900">{selectedQuestionIds.length}</span>
                </div>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50"
                >
                  <Save size={20} />
                  <span>{createMutation.isPending ? 'Scheduling...' : 'Schedule Exam'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
