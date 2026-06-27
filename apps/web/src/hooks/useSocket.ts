import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

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

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore((s) => s.access_token);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    const s = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
    });

    setSocket(s);

    return () => {
      s.disconnect();
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

