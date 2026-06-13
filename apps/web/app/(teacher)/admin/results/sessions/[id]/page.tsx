'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { use, useState } from 'react';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, Save, User, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});

  const { data: session, isLoading } = useQuery({
    queryKey: ['session-detail', id],
    queryFn: async () => {
      const response = await api.get(`/exam-sessions/${id}`);
      return response.data;
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ answerId, score }: { answerId: string, score: number }) => {
      return api.patch(`/exam-sessions/answers/${answerId}/grade`, { score });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-detail', id] });
      alert('Score updated successfully');
    },
  });

  if (isLoading) return <div className="p-8">Loading session details...</div>;
  if (!session) return <div className="p-8 text-red-500">Session not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/results/${session.examId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.student.user.fullName}</h1>
            <p className="text-gray-500">{session.exam.title} • Result Detail</p>
          </div>
        </div>
        <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-6">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Score</p>
            <p className="text-2xl font-black text-blue-600">{session.score ?? '--'}</p>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</p>
            <p className="text-sm font-bold text-green-600 uppercase">{session.status}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-12">
        {session.answers.map((answer: any, idx: number) => {
          const question = answer.question;
          const isEssay = question.type === 'ESSAY';
          
          return (
            <div key={answer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold text-sm">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                      {question.type}
                    </span>
                    {answer.isCorrect !== null && (
                      <span className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
                        answer.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {answer.isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{answer.isCorrect ? 'Correct' : 'Incorrect'}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 font-bold uppercase">Points:</span>
                      <input
                        type="number"
                        defaultValue={answer.score || 0}
                        onChange={(e) => setEditingScores(prev => ({ ...prev, [answer.id]: parseInt(e.target.value) }))}
                        className="w-16 px-2 py-1 border rounded text-center text-sm font-bold"
                      />
                      <span className="text-gray-400">/ {question.points}</span>
                    </div>
                    {(editingScores[answer.id] !== undefined && editingScores[answer.id] !== answer.score) && (
                      <button
                        onClick={() => gradeMutation.mutate({ answerId: answer.id, score: editingScores[answer.id] })}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Save Score"
                      >
                        <Save size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-gray-900 font-medium mb-6" dangerouslySetInnerHTML={{ __html: question.content }} />

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Student Answer:</p>
                  {isEssay ? (
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {answer.essayAnswer || <span className="italic text-gray-400">No answer provided.</span>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.options.map((opt: any) => {
                        const isSelected = answer.selectedOption?.split(',').includes(opt.id);
                        return (
                          <div key={opt.id} className="flex items-center space-x-3 text-sm">
                            <div className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                              isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                            }`} />
                            <div className={`${opt.isCorrect ? 'text-green-700 font-bold' : 'text-gray-600'} ${isSelected ? 'underline' : ''}`} 
                                 dangerouslySetInnerHTML={{ __html: opt.content }} />
                            {opt.isCorrect && <CheckCircle2 size={14} className="text-green-500" />}
                            {isSelected && !opt.isCorrect && <XCircle size={14} className="text-red-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
