'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Trash2, ChevronLeft, HelpCircle, FileDown } from 'lucide-react';
import { useState, use, useRef } from 'react';
import Link from 'next/link';
import { QuestionForm } from '@/components/admin/question-form';

interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  points: number;
  options: Option[];
}

interface QuestionBank {
  id: string;
  name: string;
  subject: {
    name: string;
  };
  questions: Question[];
}

export default function QuestionBankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: bank, isLoading } = useQuery<QuestionBank>({
    queryKey: ['question-bank', id],
    queryFn: async () => {
      const response = await api.get(`/question-banks/${id}`);
      return response.data;
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (newQuestion: any) => api.post('/questions', { ...newQuestion, questionBankId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      setIsAddingQuestion(false);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => api.delete(`/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/questions/import/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank', id] });
      alert('Questions imported successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to import questions');
    },
  });

  if (isLoading) return <div>Loading question bank...</div>;
  if (!bank) return <div>Question bank not found</div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/question-banks"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{bank.name}</h1>
            <p className="text-gray-500">{bank.subject.name} • {bank.questions.length} Questions</p>
          </div>
        </div>
        {!isAddingQuestion && (
          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".docx"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <FileDown size={20} />
              <span>{importMutation.isPending ? 'Importing...' : 'Import from Word'}</span>
            </button>
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Question</span>
            </button>
          </div>
        )}
      </div>

      {isAddingQuestion ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold mb-6">Create New Question</h2>
          <QuestionForm 
            onSubmit={(data) => createQuestionMutation.mutate(data)}
            onCancel={() => setIsAddingQuestion(false)}
            isSubmitting={createQuestionMutation.isPending}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {bank.questions.map((question, idx) => (
            <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {question.type}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      question.difficulty === 'MUDAH' ? 'bg-green-100 text-green-700' :
                      question.difficulty === 'SEDANG' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      if (confirm('Delete this question?')) {
                        deleteQuestionMutation.mutate(question.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="text-gray-900 font-medium mb-4" dangerouslySetInnerHTML={{ __html: question.content }} />
                
                {question.type !== 'ESSAY' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.options.map((option, optIdx) => (
                      <div 
                        key={option.id}
                        className={`p-3 border rounded-lg flex items-center space-x-3 ${
                          option.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full border text-xs font-bold ${
                          option.isCorrect ? 'bg-green-600 border-green-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <div dangerouslySetInnerHTML={{ __html: option.content }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {bank.questions.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
              <div className="inline-flex p-4 bg-gray-100 rounded-full text-gray-400 mb-4">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No questions in this bank</h3>
              <p className="text-gray-500 mt-2">Start adding questions to use them in your exams.</p>
              <button
                onClick={() => setIsAddingQuestion(true)}
                className="mt-6 inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                <span>Add First Question</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
