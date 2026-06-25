'use client';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';

/**
 * EmotionRegistry
 *
 * Collects Emotion styles generated during SSR and inserts them into the
 * HTML stream via `useServerInsertedHTML` BEFORE Next.js flushes its own
 * <head> content (MetadataOutlet, etc.).
 *
 * Without this, Emotion injects a raw <style data-emotion="css-global ...">
 * tag at a position in the tree where Next.js 16 expects a <Suspense>
 * boundary, causing a hydration mismatch.
 */
export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'css' });
    cache.compat = true;

    const prevInsert = cache.insert.bind(cache);
    let inserted: string[] = [];

    // Patch insert to track which style names get added during SSR
    cache.insert = (...args) => {
      const result = prevInsert(...args);
      const serialized = args[1];
      if (cache.inserted[serialized.name] !== undefined) {
        inserted.push(serialized.name);
      }
      return result;
    };

    const flush = () => {
      const prev = inserted;
      inserted = [];
      return prev;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    let styles = '';
    for (const name of names) {
      const style = cache.inserted[name];
      if (style && typeof style === 'string') {
        styles += style;
      }
    }
    if (!styles) return null;

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
