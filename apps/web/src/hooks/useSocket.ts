import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';
import { WS_URL } from '../lib/env';

type NotificationPayload = {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
};

let socketSingleton: Socket | null = null;

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(socketSingleton);
  const token = useAuthStore((s) => s.access_token);

  useEffect(() => {
    if (!token) {
      socketSingleton?.disconnect();
      socketSingleton = null;
      setSocket(null);
      return;
    }

    if (socketSingleton) {
      setSocket(socketSingleton);
      return;
    }

    socketSingleton = io(process.env.NEXT_PUBLIC_WS_URL || WS_URL, {
      auth: { token },
    });

    setSocket(socketSingleton);

    return () => {
      socketSingleton?.disconnect();
      socketSingleton = null;
      setSocket(null);
    };
  }, [token]);

  return socket;
}

export function useNotificationListener(handler: (data: NotificationPayload) => void) {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const callback = (data: NotificationPayload) => handlerRef.current(data);
    socket.on('new_notification', callback);

    return () => {
      socket.off('new_notification', callback);
    };
  }, [socket]);
}

