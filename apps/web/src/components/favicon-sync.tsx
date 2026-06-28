'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEffect } from 'react';

export function FaviconSync() {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => (await api.get('/settings/public')).data,
  });

  useEffect(() => {
    const href = data?.faviconUrl || '/favicon.ico';
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }, [data?.faviconUrl]);

  return null;
}
