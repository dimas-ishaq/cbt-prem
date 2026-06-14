'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Lock, User, Eye, EyeOff, BookOpen, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  Box,
  Button,
  Stack,
  Text,
  Heading,
  Field,
  IconButton,
  Spinner,
  Flex,
  Badge,
} from '@chakra-ui/react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      if (user.role === 'SISWA') {
        router.push('/dashboard');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Login gagal. Periksa kembali username dan password Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      w="full"
      bg="bg.surface"
      borderRadius="2xl"
      border="1px solid"
      borderColor="border.default"
      overflow="hidden"
      style={{ boxShadow: '0 4px 40px rgba(79,70,229,0.10), 0 1px 8px rgba(0,0,0,0.08)' }}
      className="animate-bounce-in"
    >
      {/* Gradient accent bar */}
      <Box
        h="3px"
        style={{
          background: 'linear-gradient(90deg, #4f46e5 0%, #2563eb 40%, #7c3aed 70%, #fbbf24 100%)',
        }}
      />

      <Box p={{ base: 7, md: 9 }}>
        {/* ── Header ──────────────────────────────────────────── */}
        <Stack gap={1.5} mb={7} textAlign="center" align="center">
          <Flex
            align="center"
            justify="center"
            w={14}
            h={14}
            borderRadius="2xl"
            mb={1}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
              boxShadow: '0 8px 24px rgba(79,70,229,0.40)',
            }}
          >
            <BookOpen size={26} color="white" />
          </Flex>

          <Heading
            size="xl"
            fontWeight="black"
            color="text.primary"
            letterSpacing="tight"
          >
            Masuk ke Akun Anda
          </Heading>
          <Text color="text.secondary" fontSize="sm">
            CBT Enterprise &mdash; Platform Ujian Terpercaya
          </Text>

          {/* Secure badge */}
          <Flex align="center" gap={1.5} mt={1}>
            <ShieldCheck size={13} color="#059669" />
            <Text fontSize="2xs" color="status.success.text" fontWeight="bold" letterSpacing="wider" textTransform="uppercase">
              Koneksi Aman &amp; Terenkripsi
            </Text>
          </Flex>
        </Stack>

        {/* ── Error Alert ─────────────────────────────────────── */}
        {error && (
          <Flex
            align="start"
            gap={3}
            p={3.5}
            mb={5}
            borderRadius="xl"
            border="1px solid"
            borderColor="danger.200"
            bg="status.danger.bg"
            className="animate-fade-up"
          >
            <Box flexShrink={0} mt={0.5}>
              <AlertCircle size={15} color="#be123c" />
            </Box>
            <Text fontSize="sm" color="status.danger.text" fontWeight="medium" lineHeight="snug">
              {error}
            </Text>
          </Flex>
        )}

        {/* ── Form ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack gap={4}>

            {/* Username */}
            <Field.Root invalid={!!errors.username}>
              <Field.Label
                fontSize="xs"
                fontWeight="bold"
                color="text.secondary"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Username
              </Field.Label>
              <Box position="relative">
                {/* Icon */}
                <Box
                  position="absolute"
                  left="13px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  pointerEvents="none"
                  transition="color 0.15s"
                  style={{
                    color: errors.username
                      ? '#be123c'
                      : focused === 'username'
                      ? '#4f46e5'
                      : '#94a3b8',
                  }}
                >
                  <User size={16} />
                </Box>

                <input
                  {...register('username')}
                  id="login-username"
                  autoComplete="username"
                  placeholder="Masukkan username Anda"
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    border: errors.username
                      ? '1.5px solid #f43f5e'
                      : focused === 'username'
                      ? '1.5px solid #4f46e5'
                      : '1.5px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxShadow: focused === 'username'
                      ? '0 0 0 3px rgba(79,70,229,0.12)'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              </Box>
              {errors.username && (
                <Field.ErrorText fontSize="xs" color="status.danger.text" mt={1} fontWeight="medium">
                  {errors.username.message}
                </Field.ErrorText>
              )}
            </Field.Root>

            {/* Password */}
            <Field.Root invalid={!!errors.password}>
              <Field.Label
                fontSize="xs"
                fontWeight="bold"
                color="text.secondary"
                mb={1.5}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Password
              </Field.Label>
              <Box position="relative">
                {/* Lock icon */}
                <Box
                  position="absolute"
                  left="13px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                  pointerEvents="none"
                  transition="color 0.15s"
                  style={{
                    color: errors.password
                      ? '#be123c'
                      : focused === 'password'
                      ? '#4f46e5'
                      : '#94a3b8',
                  }}
                >
                  <Lock size={16} />
                </Box>

                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password Anda"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  style={{
                    width: '100%',
                    paddingLeft: '40px',
                    paddingRight: '46px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    border: errors.password
                      ? '1.5px solid #f43f5e'
                      : focused === 'password'
                      ? '1.5px solid #4f46e5'
                      : '1.5px solid var(--border-default)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxShadow: focused === 'password'
                      ? '0 0 0 3px rgba(79,70,229,0.12)'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />

                {/* Eye toggle */}
                <Box
                  position="absolute"
                  right="4px"
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={2}
                >
                  <IconButton
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    variant="ghost"
                    size="sm"
                    color="text.muted"
                    _hover={{ color: 'brand.solid', bg: 'brand.subtle' }}
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    borderRadius="lg"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </IconButton>
                </Box>
              </Box>
              {errors.password && (
                <Field.ErrorText fontSize="xs" color="status.danger.text" mt={1} fontWeight="medium">
                  {errors.password.message}
                </Field.ErrorText>
              )}
            </Field.Root>

            {/* Submit */}
            <Button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              w="full"
              mt={1}
              size="lg"
              borderRadius="xl"
              fontWeight="bold"
              cursor={isLoading ? 'not-allowed' : 'pointer'}
              style={{
                background: isLoading
                  ? '#818cf8'
                  : 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                color: 'white',
                paddingTop: '13px',
                paddingBottom: '13px',
                fontSize: '15px',
                fontWeight: '700',
                boxShadow: isLoading
                  ? 'none'
                  : '0 4px 14px rgba(79,70,229,0.40)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.01em',
              }}
              _hover={
                !isLoading
                  ? {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(79,70,229,0.50)',
                    }
                  : undefined
              }
              _active={{ transform: 'translateY(0)' }}
            >
              {isLoading ? (
                <Flex align="center" gap={2} justify="center">
                  <Spinner size="sm" color="white" />
                  <Text color="white" fontWeight="bold" fontSize="sm">
                    Memproses...
                  </Text>
                </Flex>
              ) : (
                <Flex align="center" gap={2} justify="center">
                  <Text color="white" fontWeight="bold">Masuk Sekarang</Text>
                  <ArrowRight size={16} color="white" />
                </Flex>
              )}
            </Button>
          </Stack>
        </form>

        {/* ── Footer ──────────────────────────────────────────── */}
        <Box mt={6} pt={5} borderTop="1px solid" borderColor="border.default">
          <Flex align="center" justify="center" gap={4}>
            {['SSL', 'AES-256', 'Zero Trust'].map((label) => (
              <Flex key={label} align="center" gap={1}>
                <Box
                  w={1}
                  h={1}
                  borderRadius="full"
                  bg="success.500"
                />
                <Text fontSize="2xs" color="text.muted" fontWeight="semibold" letterSpacing="wide">
                  {label}
                </Text>
              </Flex>
            ))}
          </Flex>
          <Text
            textAlign="center"
            fontSize="2xs"
            color="text.muted"
            mt={2}
          >
            Hubungi administrator jika mengalami kesulitan login.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
