'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  Portal,
  Spinner,
  VStack,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotificationStore } from '@/store/notification.store';
import { useNotificationListener } from '@/hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const { unreadCount, addNotification } = useNotificationStore();

  // Fetch existing notifications from backend
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications/me');
        return Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        console.warn('Failed to load notifications:', error);
        return [];
      }
    },
    refetchInterval: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { setFromList } = useNotificationStore();

  useEffect(() => {
    if (data) {
      setFromList(
        data.map((n: any) => ({
          id: n.id,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          referenceId: n.referenceId,
          referenceType: n.referenceType,
          createdAt: n.createdAt,
          read: Boolean(n.notificationRecipients?.[0]?.isRead),
        }))
      );
    }
  }, [data, setFromList]);

  // Listen for real-time notifications
  useNotificationListener((n) => {
    addNotification(n);
  });

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        bellRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <Box position="relative" ref={panelRef}>
      <IconButton
        ref={bellRef}
        aria-label="Notifikasi"
        variant="ghost"
        size="sm"
        borderRadius="full"
        position="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <Badge
            colorPalette="red"
            borderRadius="full"
            position="absolute"
            top={-1}
            right={-1}
            fontSize="3xs"
            minW="16px"
            h="16px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontWeight="bold"
            pointerEvents="none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </IconButton>

      {open && (
        <Portal>
          <Box
            ref={panelRef}
            position="fixed"
            top="calc(60px + 0.5rem)"
            right="16px"
            w="min(420px, calc(100vw - 1rem))"
            maxH="min(560px, calc(100vh - 5rem))"
            bg="bg.surface"
            borderRadius="2xl"
            shadow="2xl"
            border="1px solid"
            borderColor="border.default"
            overflow="hidden"
            zIndex={9999}
          >
            {/* Header */}
            <Flex
              px={4}
              py={3}
              borderBottom="1px solid"
              borderColor="border.default"
              justify="space-between"
              align="center"
              bg="bg.elevated"
            >
              <Box>
                <Text fontWeight="bold" fontSize="sm">
                  Notifikasi
                </Text>
                <Text fontSize="2xs" color="text.secondary" mt={0.5}>
                  Update terbaru dan status baca
                </Text>
              </Box>
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="blue"
                  onClick={() => {
                    useNotificationStore.getState().markAllRead();
                  }}
                >
                  <CheckCheck size={14} />
                  Tandai semua dibaca
                </Button>
                <IconButton
                  aria-label="Tutup"
                  size="xs"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  <X size={14} />
                </IconButton>
              </HStack>
            </Flex>

            {/* Body */}
            <NotificationList />
          </Box>
        </Portal>
      )}
    </Box>
  );
}

function NotificationList() {
  const { notifications } = useNotificationStore();

  if (notifications.length === 0) {
    return (
      <Flex py={14} px={6} justify="center" align="center" bg="bg.elevated">
        <VStack gap={2.5} color="text.secondary" textAlign="center">
          <Box
            w={12}
            h={12}
            borderRadius="full"
            bg="bg.surface"
            display="flex"
            alignItems="center"
            justifyContent="center"
            shadow="sm"
            border="1px solid"
            borderColor="border.default"
          >
            <Bell size={24} />
          </Box>
          <Text fontSize="sm" fontWeight="medium" color="text.secondary">
            Belum ada notifikasi
          </Text>
          <Text fontSize="xs" color="text.muted">
            Notifikasi baru akan muncul di sini
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box overflowY="auto" maxH="440px" bg="bg.surface">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </Box>
  );
}

function NotificationItem({
  notification,
}: {
  notification: {
    id: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    createdAt: string;
    read: boolean;
  };
}) {
  const { markRead } = useNotificationStore();

  const priorityColor =
    notification.priority === 'HIGH'
      ? 'red.subtle'
      : notification.priority === 'NORMAL'
        ? 'blue.subtle'
        : 'bg.elevated';

  return (
    <Flex
      px={4}
      py={3.5}
      gap={3}
      bg={notification.read ? 'bg.surface' : priorityColor}
      borderBottom="1px solid"
      borderColor="border.default"
      cursor="pointer"
      transition="all 0.15s ease"
      _hover={{ bg: notification.read ? 'bg.elevated' : 'bg.elevated' }}
      onClick={() => markRead(notification.id)}
    >
      <Box
        w="10px"
        h="10px"
        mt="5px"
        borderRadius="full"
        bg={notification.read ? 'transparent' : 'blue.solid'}
        flexShrink={0}
        boxShadow={notification.read ? 'none' : '0 0 0 4px color-mix(in srgb, var(--chakra-colors-blue-solid) 18%, transparent)'}
      />
      <Box flex={1} minW={0}>
        <HStack gap={2} align="start" justify="space-between">
          <Text fontSize="sm" fontWeight={notification.read ? 'normal' : 'bold'} lineClamp={1}>
            {notification.title}
          </Text>
        </HStack>
        <Text fontSize="xs" color="text.secondary" lineClamp={2} mt={1}>
          {notification.message}
        </Text>
        <Text fontSize="2xs" color="text.muted" mt={1.5}>
          {timeAgo(notification.createdAt)}
        </Text>
      </Box>
    </Flex>
  );
}
