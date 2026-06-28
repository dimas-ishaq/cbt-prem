'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Input,
  Image,
  Spinner,
  Heading,
  Card,
  Grid,
} from '@chakra-ui/react';
import { Camera, User, Mail, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { assetUrl } from '@/lib/env';
import { toast } from '@/lib/toaster';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      setUsername(res.data.username || '');
      setFullName(res.data.fullName || '');
      setEmail(res.data.email || '');
      if (res.data.photo) {
        updateUser({ photo: res.data.photo });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengambil data profil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nama lengkap tidak boleh kosong');
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setSaving(true);
    try {
      const payload: any = { fullName, email };
      if (password) {
        payload.password = password;
      }

      const res = await api.put('/auth/profile', payload);
      updateUser({
        fullName: res.data.fullName,
      });
      toast.success('Profil berhasil diperbarui');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      toast.error('Hanya file gambar (JPG, PNG, WebP) yang diizinkan');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2 MB');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    setUploadingPhoto(true);
    try {
      const res = await api.put('/auth/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      updateUser({
        photo: res.data.photoUrl,
      });
      toast.success('Foto profil berhasil diunggah');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto profil');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <Flex minH="70vh" justify="center" align="center" direction="column" gap={3}>
        <Spinner size="lg" color="indigo.500" />
        <Text color="#7a8fab" fontSize="sm">Memuat profil Anda...</Text>
      </Flex>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={8}>
      <Heading size="lg" mb={6} color="text.primary" fontWeight="extrabold" letterSpacing="tight">
        Pengaturan Profil
      </Heading>

      <Grid templateColumns={{ base: '1fr', lg: '280px 1fr' }} gap={8}>
        {/* Left Side: Avatar Upload card */}
        <Stack gap={6}>
          <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={6}>
            <Card.Body p={0}>
              <Flex direction="column" align="center" justify="center">
                <Box position="relative" w={32} h={32} borderRadius="full" overflow="hidden" mb={4} cursor="pointer" onClick={() => fileInputRef.current?.click()}>
                <Flex
                  w="full"
                  h="full"
                  align="center"
                  justify="center"
                  color="white"
                  fontWeight="black"
                  fontSize="4xl"
                  style={user?.photo ? {} : { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  {user?.photo ? (
                    <Image src={assetUrl(user.photo)} alt="Profile Avatar" objectFit="cover" w="full" h="full" />
                  ) : (
                    user?.fullName?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </Flex>
                <Flex
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.700"
                  align="center"
                  justify="center"
                  opacity={0}
                  _hover={{ opacity: 1 }}
                  transition="opacity 0.2s"
                >
                  {uploadingPhoto ? <Spinner color="white" size="sm" /> : <Camera size={24} color="white" />}
                </Flex>
              </Box>

              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />

              <Button
                size="xs"
                variant="outline"
                color="text.primary"
                borderColor="border.default"
                _hover={{ bg: 'bg.subtle', borderColor: 'border.strong' }}
                borderRadius="xl"
                onClick={() => fileInputRef.current?.click()}
                loading={uploadingPhoto}
                mb={3}
              >
                Ganti Foto
              </Button>
              <Text fontSize="2xs" color="text.secondary" textAlign="center">
                Mendukung JPG, PNG, atau WebP. Maksimal 2MB.
              </Text>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={5}>
            <Card.Body p={0}>
              <Stack gap={3}>
                <Flex align="center" gap={2} color="text.secondary">
                  <User size={15} />
                  <Text fontSize="xs" fontWeight="semibold">Role</Text>
                </Flex>
                <Box bg="bg.subtle" border="1px solid" borderColor="border.default" px={3} py={2} borderRadius="xl">
                  <Text fontSize="xs" fontWeight="bold" color="brand.text" textTransform="uppercase" letterSpacing="wider">
                    {user?.role}
                  </Text>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>
        </Stack>

        {/* Right Side: Form inputs */}
        <Card.Root bg="bg.surface" border="1px solid" borderColor="border.default" borderRadius="2xl" p={{ base: 5, md: 8 }} as="form" onSubmit={handleUpdateProfile}>
          <Card.Body p={0}>
            <Stack gap={6}>
              <Stack gap={1.5}>
                <Text fontSize="xs" fontWeight="semibold" color="text.secondary">Username (Tidak dapat diubah)</Text>
                <Input
                  value={username}
                  disabled
                  bg="bg.muted"
                  borderColor="border.default"
                  color="text.muted"
                  fontSize="sm"
                  h={10}
                  borderRadius="xl"
                  _disabled={{ cursor: 'not-allowed', opacity: 0.6 }}
                />
              </Stack>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Stack gap={1.5}>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary">Nama Lengkap</Text>
                  <Input
                    placeholder="Nama Lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    bg="input.bg"
                    borderColor="input.border"
                    color="text.primary"
                    _focus={{ borderColor: 'input.focus.border' }}
                    fontSize="sm"
                    h={10}
                    borderRadius="xl"
                  />
                </Stack>

                <Stack gap={1.5}>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary">Alamat Email</Text>
                  <Input
                    type="email"
                    placeholder="nama@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="input.bg"
                    borderColor="input.border"
                    color="text.primary"
                    _focus={{ borderColor: 'input.focus.border' }}
                    fontSize="sm"
                    h={10}
                    borderRadius="xl"
                  />
                </Stack>
              </Grid>

              <Box borderTop="1px solid" borderColor="border.default" pt={6}>
                <Flex align="center" gap={2} mb={4} color="accent.gold">
                  <ShieldAlert size={16} />
                  <Text fontSize="xs" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing="wider">
                    Ubah Password (Isi jika ingin mengganti)
                  </Text>
                </Flex>

                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                  <Stack gap={1.5}>
                    <Text fontSize="xs" fontWeight="semibold" color="text.secondary">Password Baru</Text>
                    <Input
                      type="password"
                      placeholder="Masukkan password baru"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      bg="input.bg"
                      borderColor="input.border"
                      color="text.primary"
                      _focus={{ borderColor: 'input.focus.border' }}
                      fontSize="sm"
                      h={10}
                      borderRadius="xl"
                    />
                  </Stack>

                  <Stack gap={1.5}>
                    <Text fontSize="xs" fontWeight="semibold" color="text.secondary">Konfirmasi Password Baru</Text>
                    <Input
                      type="password"
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      bg="input.bg"
                      borderColor="input.border"
                      color="text.primary"
                      _focus={{ borderColor: 'input.focus.border' }}
                      fontSize="sm"
                      h={10}
                      borderRadius="xl"
                    />
                  </Stack>
                </Grid>
              </Box>

              <Flex justify="flex-end" pt={4}>
                <Button
                  type="submit"
                  size="sm"
                  bg="linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)"
                  color="white"
                  _hover={{ bg: 'linear-gradient(135deg, #4338ca 0%, #1d4ed8 100%)' }}
                  borderRadius="xl"
                  loading={saving}
                  px={6}
                  h={10}
                >
                  Simpan Perubahan
                </Button>
              </Flex>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Grid>
    </Box>
  );
}
