import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.access_token);

  useEffect(() => {
    if (!token) return;

    const s = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
    });

    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return socketRef.current;
}

export function useNotificationListener(
  handler: (data: {
    id: string;
    type: string;
    priority: string;
    title: string;
    message: string;
    referenceId?: string;
    referenceType?: string;
    createdAt: string;
  }) => void
) {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const callback = (data: any) => handlerRef.current(data);
    socket.on('new_notification', callback);

    return () => {
      socket.off('new_notification', callback);
    };
  }, [socket]);
}
