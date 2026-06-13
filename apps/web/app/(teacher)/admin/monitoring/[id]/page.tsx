'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { useEffect, useState, use } from 'react';
import { ChevronLeft, Users, AlertTriangle, CheckCircle2, Monitor } from 'lucide-react';
import Link from 'next/link';

interface Student {
  userId: string;
  username: string;
  fullName: string;
  progress: number;
  lastActive: string;
  status: string;
  violationCount?: number;
}

interface Violation {
  id: string;
  username: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function ExamMonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const socket = useSocket();
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [violations, setViolations] = useState<Violation[]>([]);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam-monitoring', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join_proctor', { examId: id });

    socket.on('student_joined', (data: any) => {
      setStudents(prev => ({
        ...prev,
        [data.userId]: {
          ...prev[data.userId],
          userId: data.userId,
          username: data.username,
          fullName: data.username, // Fallback if name not in event
          status: 'Online',
          progress: prev[data.userId]?.progress || 0,
          lastActive: new Date().toISOString(),
        }
      }));
    });

    socket.on('student_offline', (data: any) => {
      setStudents(prev => {
        if (!prev[data.userId]) return prev;
        return {
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            status: 'Offline',
          }
        };
      });
    });

    socket.on('student_answer_update', (data: any) => {
      setStudents(prev => {
        const student = prev[data.studentId];
        if (!student) return prev;
        
        const totalQuestions = exam?.examQuestions.length || 1;
        // Keep track of answered questions in a Set or similar for true progress
        // For now, we increment based on activity
        return {
          ...prev,
          [data.studentId]: {
            ...student,
            progress: Math.min(100, (student.progress || 0) + (100 / totalQuestions)),
            lastActive: new Date().toISOString(),
          }
        };
      });
    });

    socket.on('violation_alert', (data: any) => {
      setViolations(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          username: data.username,
          type: data.type,
          description: data.description,
          timestamp: data.timestamp,
        },
        ...prev,
      ]);

      setStudents(prev => {
        const student = prev[data.studentId];
        if (!student) return prev;
        return {
          ...prev,
          [data.studentId]: {
            ...student,
            violationCount: (student.violationCount || 0) + 1,
          }
        };
      });
    });

    return () => {
      socket.off('student_joined');
      socket.off('student_offline');
      socket.off('student_answer_update');
      socket.off('violation_alert');
    };
  }, [socket, id, exam]);

  if (isLoading) return <div>Loading monitor...</div>;

  const activeStudentCount = Object.keys(students).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/monitoring" className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proctor View: {exam?.title}</h1>
            <p className="text-sm text-gray-500">{exam?.subject.name} • {exam?.examQuestions.length} Questions</p>
          </div>
        </div>
        <div className="flex space-x-4">
          <Link
            href={`/admin/results/${id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Award size={18} />
            <span>View Final Results</span>
          </Link>
          <div className="px-4 py-2 bg-white rounded-lg border flex items-center space-x-2">
            <Users size={18} className="text-blue-600" />
            <span className="font-bold">{activeStudentCount}</span>
            <span className="text-sm text-gray-500">Students Active</span>
          </div>
          <div className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center space-x-2">
            <AlertTriangle size={18} />
            <span className="font-bold">{violations.length}</span>
            <span className="text-sm">Alerts</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Monitor size={20} className="mr-2" /> Student Progress
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(students).map((student) => (
                <div key={student.userId} className={`p-4 border rounded-xl transition-colors ${
                  student.status === 'Offline' ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        student.status === 'Offline' ? 'bg-gray-400' : 'bg-green-500 animate-pulse'
                      }`} />
                      <div>
                        <h3 className="font-bold text-gray-900">{student.username}</h3>
                        <p className="text-xs text-gray-500">Last active: {new Date(student.lastActive).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {student.violationCount && student.violationCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                          {student.violationCount} Alerts
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        student.status === 'Offline' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'
                      }`}>
                        {student.status === 'Offline' ? 'OFFLINE' : 'LIVE'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{Math.round(student.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {activeStudentCount === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 italic">
                  Waiting for students to join the exam...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle size={20} className="mr-2 text-red-600" /> Live Logs
            </h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {violations.map((v) => (
                <div key={v.id} className="p-3 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-red-900 text-sm">{v.username}</span>
                    <span className="text-[10px] text-red-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-red-700 uppercase">{v.type}</p>
                  <p className="text-xs text-red-600 mt-0.5">{v.description}</p>
                </div>
              ))}
              {violations.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <CheckCircle2 size={32} className="text-green-500" />
                  <p className="text-sm">No violations detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
