'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, User, Mail, Trash2, Search, UserCheck, Shield } from 'lucide-react';
import { useState } from 'react';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: string;
}

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isAdding, setIsAdding] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nisn, setNisn] = useState(''); // Only for students
  const [nip, setNip] = useState('');   // Only for teachers

  const { data: students, isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data;
    },
  });

  const { data: teachers, isLoading: loadingTeachers } = useQuery<any[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = activeTab === 'STUDENT' ? '/students' : '/teachers';
      return api.post(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab === 'STUDENT' ? 'students' : 'teachers'] });
      setIsAdding(false);
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const endpoint = activeTab === 'STUDENT' ? `/students/${id}` : `/teachers/${id}`;
      return api.delete(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab === 'STUDENT' ? 'students' : 'teachers'] });
    }
  });

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setNisn('');
    setNip('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { username, password, fullName };
    if (activeTab === 'STUDENT') payload.nisn = nisn;
    else payload.nip = nip;
    createMutation.mutate(payload);
  };

  const users = activeTab === 'STUDENT' ? students : teachers;
  const isLoading = activeTab === 'STUDENT' ? loadingStudents : loadingTeachers;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage student and teacher accounts.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add {activeTab === 'STUDENT' ? 'Student' : 'Teacher'}</span>
        </button>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('STUDENT')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'STUDENT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Students
        </button>
        <button
          onClick={() => setActiveTab('TEACHER')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'TEACHER' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Teachers
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">{activeTab === 'STUDENT' ? 'NISN' : 'NIP'}</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-gray-700">
            {users?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <User size={16} />
                    </div>
                    <span className="font-medium text-gray-900">{u.user?.fullName || u.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{u.user?.username || u.username}</td>
                <td className="px-6 py-4 text-sm">{activeTab === 'STUDENT' ? u.nisn : u.nip}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this user?')) {
                        deleteMutation.mutate(u.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && users?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                  No {activeTab.toLowerCase()}s found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Add New {activeTab === 'STUDENT' ? 'Student' : 'Teacher'}</h2>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="johndoe123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === 'STUDENT' ? 'NISN' : 'NIP'}
                </label>
                <input
                  required
                  type="text"
                  value={activeTab === 'STUDENT' ? nisn : nip}
                  onChange={(e) => activeTab === 'STUDENT' ? setNisn(e.target.value) : setNip(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={activeTab === 'STUDENT' ? "1234567890" : "1980...001"}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
