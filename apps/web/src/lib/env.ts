export const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:3001/api';
export const WS_URL   = process.env.NEXT_PUBLIC_WS_URL   || API_BASE.replace(/\/api$/, '').replace(/^http/, 'ws') || 'http://0.0.0.0:3001';
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  || 'http://localhost:3000';

export function assetUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  
  // Normalize `/api/uploads/` by prepending the base API URL correctly
  if (url.startsWith('/api/uploads/')) {
    return `${API_BASE.replace(/\/api$/, '')}${url}`;
  }
  
  if (url.startsWith('/uploads/')) return `${API_BASE.replace(/\/api$/, '')}${url}`;
  return url;
}