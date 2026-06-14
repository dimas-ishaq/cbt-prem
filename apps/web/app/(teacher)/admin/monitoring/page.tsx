'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Activity, ChevronRight, Users, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  subject: {
    name: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  _count: {
    examSessions: number;
  };
}

export default function MonitoringListPage() {
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ['exams-monitoring'],
    queryFn: async () => {
      const response = await api.get('/exams');
      // Only show published or ongoing exams for monitoring
      return response.data.filter((e: any) => e.status !== 'DRAFT');
    },
  });

  if (isLoading) return <div>Loading monitoring list...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Monitoring</h1>
        <p className="text-gray-500">Select an ongoing exam to monitor student progress in real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams?.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${exam.status === 'ONGOING' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Activity size={24} className={exam.status === 'ONGOING' ? 'animate-pulse' : ''} />
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                  exam.status === 'ONGOING' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {exam.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {exam.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{exam.subject.name}</p>
              
              <div className="mt-6 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Users size={16} className="mr-2" />
                  <span>{exam._count?.examSessions ?? 0} Students Enrolled</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar size={16} className="mr-2" />
                  <span>Started {new Date(exam.startTime).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/admin/monitoring/${exam.id}`}
                  className="flex items-center justify-center w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Enter Proctor View
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {exams?.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
            No active exams found for monitoring.
          </div>
        )}
      </div>
    </div>
  );
}
