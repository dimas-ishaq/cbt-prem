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
    const cacheBusted = `${href}${href.includes('?') ? '&' : '?'}v=${Date.now()}`;
    const ensureLink = (rel: string) => {
      let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = cacheBusted;
    };
    ensureLink('icon');
    ensureLink('shortcut icon');
    ensureLink('apple-touch-icon');
  }, [data?.faviconUrl]);

  return null;
}
