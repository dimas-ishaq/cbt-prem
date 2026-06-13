'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  FileText, 
  BookOpen, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const stats = [
  { name: 'Total Students', value: '1,234', icon: Users, change: '+12%', changeType: 'increase' },
  { name: 'Active Exams', value: '8', icon: FileText, change: '0%', changeType: 'neutral' },
  { name: 'Subjects', value: '24', icon: BookOpen, change: '+2', changeType: 'increase' },
  { name: 'Average Score', value: '78.5', icon: Activity, change: '-2.4%', changeType: 'decrease' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back to the CBT management panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <stat.icon size={24} />
              </div>
              <span className={`flex items-center text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 
                stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stat.change}
                {stat.changeType === 'increase' ? <ArrowUpRight size={16} /> : 
                 stat.changeType === 'decrease' ? <ArrowDownRight size={16} /> : null}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Exams</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900">Ujian Tengah Semester Matematika</h4>
                  <p className="text-sm text-gray-500">Subject: Mathematics • 120 Students</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Completed</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Live Monitoring Alerts</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 border border-red-100 bg-red-50 rounded-lg">
                <div className="p-2 bg-red-100 text-red-600 rounded-full">
                  <Activity size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-red-900">Violation Detected</h4>
                  <p className="text-sm text-red-700">Student: John Doe • Type: Tab Switching</p>
                  <p className="text-xs text-red-500 mt-1">2 minutes ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
