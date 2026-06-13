import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth.store';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore((state) => state.access_token);

  useEffect(() => {
    if (!token) return;

    const s = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: { token },
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token]);

  return socket;
};
