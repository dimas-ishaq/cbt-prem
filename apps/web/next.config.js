/** @type {import('next').NextConfig} */
const nextConfig = {
  // Matikan header X-Powered-By
  poweredByHeader: false,

  // Alias html2canvas to html2canvas-pro to resolve "unsupported color function" error on Tailwind CSS v4 color tokens
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: 'html2canvas-pro',
    };
    return config;
  },

  turbopack: {
    resolveAlias: {
      html2canvas: 'html2canvas-pro',
    },
  },

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiBase}/uploads/:path*`,
      },
    ];
  },

  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const staticHeaders = [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: isProd
              ? 'public, max-age=31536000, immutable'
              : 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];

    return [
      ...staticHeaders,
      {
        // Terapkan ke semua route KECUALI _next/static
        source: '/((?!_next/).*)',
        headers: [
          // ── Kompatibilitas Safe Exam Browser (SEB) ──────────────────
          // SEB 3.x berbasis Chromium dan sangat sensitif terhadap CSP.
          // Jangan gunakan frame-ancestors 'none' — SEB membuka halaman
          // dalam embedded WebView yang bisa dianggap sebagai iframe.
          {
            key: 'Content-Security-Policy',
            value: (() => {
              const getOrigin = (urlStr) => {
                if (!urlStr) return '';
                try {
                  return new URL(urlStr).origin;
                } catch (e) {
                  return '';
                }
              };

              const apiOrigin = getOrigin(process.env.NEXT_PUBLIC_API_URL);
              const appOrigin = getOrigin(process.env.NEXT_PUBLIC_APP_URL);
              const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

              const connectSources = [
                "'self'",
                "http://localhost:3001",
                "ws://localhost:3000",
                "ws://localhost:3001",
                "http://localhost:3000",
                "https://static.cloudflareinsights.com",
                "https://cloudflareinsights.com",
              ];

              if (apiOrigin) connectSources.push(apiOrigin);
              if (appOrigin) connectSources.push(appOrigin);

              if (wsUrl) {
                if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
                  connectSources.push(wsUrl);
                } else {
                  const origin = getOrigin(wsUrl);
                  if (origin) {
                    connectSources.push(origin.replace(/^http/, 'ws'));
                    connectSources.push(origin.replace(/^https/, 'wss'));
                  }
                }
              }

              // Jika ada origin domain custom, tambahkan wildcard ws/wss untuk mengantisipasi load balancer/tunnel
              if (apiOrigin && apiOrigin.includes('.')) {
                try {
                  const host = new URL(apiOrigin).host;
                  connectSources.push(`wss://${host}`);
                  connectSources.push(`ws://${host}`);
                } catch (e) { }
              }

              // Gambar: izinkan data URI, blob, localhost/loopback API, dan origin custom
              const imgSources = [
                "'self'",
                "data:",
                "blob:",
                "http://localhost:3001",
                "http://127.0.0.1:3001",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
              ];
              if (apiOrigin) imgSources.push(apiOrigin);
              if (appOrigin) imgSources.push(appOrigin);

              return [
                "default-src 'self'",
                // Script: izinkan inline & eval — Chakra UI dan Next.js memerlukannya, serta Cloudflare Insights
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://static.cloudflareinsights.com",
                // Style: izinkan inline — Chakra UI menggunakan CSS-in-JS
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                // Font: izinkan dari Google Fonts dan data URI
                "font-src 'self' data: https://fonts.gstatic.com",
                // Gambar: izinkan dari API/App local dan remote
                `img-src ${imgSources.join(' ')}`,
                // Koneksi: izinkan ke API lokal, WebSocket, API custom dari env, dan Cloudflare
                `connect-src ${connectSources.join(' ')}`,
                // Media
                "media-src 'self' blob: data:",
                // Worker untuk Next.js
                "worker-src 'self' blob:",
                // Frame: izinkan 'self' agar SEB WebView tidak diblokir
                "frame-ancestors 'self'",
              ].join('; ');
            })(),
          },
          // Izinkan SEB membuka halaman ini di embedded frame
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Wajib untuk SEB agar tipe MIME tidak di-sniff
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Kurangi referrer agar tidak bocor ke luar SEB session
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // no-store hanya untuk halaman HTML, bukan untuk JS chunks
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
