'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, User, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Stack,
  Input,
  Spinner,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: string;
}

export default function UsersManagementPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const handleExport = async () => {
    try {
      const response = await api.get('/users/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cbt_users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert('Gagal mengekspor data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        const firstLine = lines[0];
        if (!firstLine) {
          alert('File CSV tidak valid.');
          return;
        }
        const rawHeaders = firstLine.split(',');
        const headers = rawHeaders.map(h => h.trim().replace(/^["']|["']$/g, ''));

        const parsedUsers: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const lineVal = lines[i];
          if (!lineVal) continue;
          const line = lineVal.trim();
          if (!line) continue;

          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const userObj: any = {};
          headers.forEach((header, index) => {
            let val = values[index] || '';
            val = val.replace(/^["']|["']$/g, '');
            userObj[header] = val;
          });

          if (userObj.nisn && !userObj.nis) {
            userObj.nis = userObj.nisn;
          }
          if (userObj.nis && !userObj.nisn) {
            userObj.nisn = userObj.nis;
          }

          parsedUsers.push(userObj);
        }

        if (parsedUsers.length === 0) {
          alert('Tidak ada data pengguna yang valid untuk diimpor.');
          return;
        }

        const response = await api.post('/users/import', { users: parsedUsers });
        const { created, updated, errors } = response.data;

        let message = `Impor selesai!\n- Baru dibuat: ${created}\n- Diperbarui: ${updated}`;
        if (errors && errors.length > 0) {
          message += `\n\nAda ${errors.length} error:\n` + errors.slice(0, 5).join('\n');
          if (errors.length > 5) {
            message += `\n...dan ${errors.length - 5} error lainnya.`;
          }
        }
        alert(message);

        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['teachers'] });
      } catch (err: any) {
        alert('Gagal memproses file CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
    mutationFn: async (newUser: any) => {
      const endpoint = activeTab === 'STUDENT' ? '/students' : '/teachers';
      return api.post(endpoint, newUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab === 'STUDENT' ? 'students' : 'teachers'] });
      setIsAdding(false);
      resetForm();
      alert('Pengguna berhasil ditambahkan!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Gagal menambahkan pengguna.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const endpoint = activeTab === 'STUDENT' ? `/students/${id}` : `/teachers/${id}`;
      return api.delete(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab === 'STUDENT' ? 'students' : 'teachers'] });
      alert('Pengguna berhasil dihapus.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Gagal menghapus pengguna.');
    },
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
    const payload = activeTab === 'STUDENT' 
      ? { username, password, fullName, nisn, class: 'X' }
      : { username, password, fullName, nip };
    createMutation.mutate(payload);
  };

  const isLoading = activeTab === 'STUDENT' ? loadingStudents : loadingTeachers;
  const users = activeTab === 'STUDENT' ? students : teachers;

  return (
    <Stack gap={6}>
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="xl" fontWeight="bold" color="gray.900">
            {t('usersTitle')}
          </Heading>
          <Text color="gray.500" mt={1}>
            {t('usersDesc')}
          </Text>
        </Box>
        <HStack gap={3}>
          <Button
            variant="outline"
            color="indigo.600"
            borderColor="indigo.200"
            _hover={{ bg: 'indigo.50' }}
            borderRadius="lg"
            px={4}
            py={2}
            fontWeight="medium"
            onClick={handleExport}
            cursor="pointer"
          >
            {t('exportCsv')}
          </Button>
          <Button
            variant="outline"
            color="indigo.600"
            borderColor="indigo.200"
            _hover={{ bg: 'indigo.50' }}
            borderRadius="lg"
            px={4}
            py={2}
            fontWeight="medium"
            onClick={() => document.getElementById('csv-import-input')?.click()}
            cursor="pointer"
          >
            {t('importCsv')}
          </Button>
          <input
            id="csv-import-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <Button
            bg="indigo.600"
            color="white"
            _hover={{ bg: 'indigo.700' }}
            borderRadius="lg"
            px={4}
            py={2}
            fontWeight="medium"
            onClick={() => setIsAdding(true)}
            cursor="pointer"
          >
            <Plus size={20} style={{ marginRight: '6px' }} />
            {activeTab === 'STUDENT' ? t('addStudent') : t('addTeacher')}
          </Button>
        </HStack>
      </Flex>

      {/* Tab Switcher */}
      <Flex gap={1} bg="gray.100" p={1} borderRadius="lg" w="fit-content">
        <Button
          onClick={() => setActiveTab('STUDENT')}
          px={4}
          py={2}
          borderRadius="md"
          fontSize="sm"
          fontWeight="medium"
          bg={activeTab === 'STUDENT' ? 'white' : 'transparent'}
          shadow={activeTab === 'STUDENT' ? 'sm' : 'none'}
          color={activeTab === 'STUDENT' ? 'indigo.600' : 'gray.500'}
          _hover={{ color: activeTab !== 'STUDENT' ? 'gray.700' : undefined }}
          cursor="pointer"
          variant="ghost"
        >
          {t('studentsTab')}
        </Button>
        <Button
          onClick={() => setActiveTab('TEACHER')}
          px={4}
          py={2}
          borderRadius="md"
          fontSize="sm"
          fontWeight="medium"
          bg={activeTab === 'TEACHER' ? 'white' : 'transparent'}
          shadow={activeTab === 'TEACHER' ? 'sm' : 'none'}
          color={activeTab === 'TEACHER' ? 'indigo.600' : 'gray.500'}
          _hover={{ color: activeTab !== 'TEACHER' ? 'gray.700' : undefined }}
          cursor="pointer"
          variant="ghost"
        >
          {t('teachersTab')}
        </Button>
      </Flex>

      {/* Users Table */}
      <Box bg="white" borderRadius="xl" shadow="sm" borderWidth="1px" borderColor="gray.100" overflow="hidden">
        {isLoading ? (
          <Flex justify="center" align="center" py={16}>
            <Spinner size="lg" color="indigo.600" />
          </Flex>
        ) : (
          <Table.Root size="md">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                  {t('fullNameLabel')}
                </Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                  {t('usernameLabel')}
                </Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase">
                  {activeTab === 'STUDENT' ? t('nisnLabel') : t('nipLabel')}
                </Table.ColumnHeader>
                <Table.ColumnHeader px={6} py={4} fontWeight="semibold" color="gray.600" fontSize="xs" textTransform="uppercase" textAlign="end">
                  {t('actionsLabel')}
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users?.map((u) => (
                <Table.Row key={u.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                  <Table.Cell px={6} py={4}>
                    <HStack gap={3}>
                      <Flex
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg="gray.100"
                        align="center"
                        justify="center"
                        color="gray.500"
                      >
                        <User size={16} />
                      </Flex>
                      <Text fontWeight="medium" color="gray.900">
                        {u.user?.fullName || u.fullName}
                      </Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm" fontFamily="mono" color="gray.500">
                    {u.user?.username || u.username}
                  </Table.Cell>
                  <Table.Cell px={6} py={4} fontSize="sm">
                    {activeTab === 'STUDENT' ? u.nisn : u.nip}
                  </Table.Cell>
                  <Table.Cell px={6} py={4} textAlign="end">
                    <IconButton
                      variant="ghost"
                      color="red.600"
                      _hover={{ bg: 'red.50' }}
                      size="sm"
                      borderRadius="lg"
                      aria-label="Delete User"
                      onClick={() => {
                        if (confirm(t('confirmDeleteUser'))) {
                          deleteMutation.mutate(u.id);
                        }
                      }}
                      cursor="pointer"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Table.Cell>
                </Table.Row>
              ))}
              {!isLoading && users?.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={4} px={6} py={12} textAlign="center" color="gray.500" fontStyle="italic">
                    {t('noUsersFound')}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Add User Modal */}
      {isAdding && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          backdropFilter="blur(4px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
          p={4}
        >
          <Box
            bg="white"
            borderRadius="2xl"
            shadow="xl"
            w="full"
            maxW="md"
            overflow="hidden"
          >
            <Flex
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              justify="space-between"
              align="center"
              bg="gray.50"
            >
              <Heading size="md" fontWeight="bold" color="gray.900">
                {activeTab === 'STUDENT' ? t('addStudent') : t('addTeacher')}
              </Heading>
              <Button
                variant="ghost"
                color="gray.400"
                _hover={{ color: 'gray.600' }}
                onClick={() => setIsAdding(false)}
                fontSize="xl"
                p={0}
                minW={0}
                cursor="pointer"
              >
                ×
              </Button>
            </Flex>
            <form onSubmit={handleSubmit}>
              <Stack gap={4} p={6}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {t('fullNameLabel')} <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {t('usernameLabel')} <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe123"
                    fontFamily="mono"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    Password <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={1}>
                    {activeTab === 'STUDENT' ? t('nisnLabel') : t('nipLabel')} <span style={{ color: 'red' }}>*</span>
                  </Text>
                  <Input
                    required
                    type="text"
                    value={activeTab === 'STUDENT' ? nisn : nip}
                    onChange={(e) => activeTab === 'STUDENT' ? setNisn(e.target.value) : setNip(e.target.value)}
                    placeholder={activeTab === 'STUDENT' ? '1234567890' : '1980...001'}
                    borderRadius="lg"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'indigo.500', boxShadow: '0 0 0 1px var(--chakra-colors-indigo-500)' }}
                  />
                </Box>
                <Flex gap={3} pt={4}>
                  <Button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    flex={1}
                    variant="outline"
                    borderRadius="lg"
                    fontWeight="medium"
                    cursor="pointer"
                  >
                    {t('cancelBtn')}
                  </Button>
                  <Button
                    type="submit"
                    flex={1}
                    bg="indigo.600"
                    color="white"
                    _hover={{ bg: 'indigo.700' }}
                    borderRadius="lg"
                    fontWeight="medium"
                    cursor="pointer"
                    loading={createMutation.isPending}
                  >
                    {t('saveBtn')}
                  </Button>
                </Flex>
              </Stack>
            </form>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
