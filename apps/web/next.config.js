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
            value: [
              "default-src 'self'",
              // Script: izinkan inline & eval — Chakra UI dan Next.js memerlukannya
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              // Style: izinkan inline — Chakra UI menggunakan CSS-in-JS
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Font: izinkan dari Google Fonts dan data URI
              "font-src 'self' data: https://fonts.gstatic.com",
              // Gambar: izinkan data URI dan blob
              "img-src 'self' data: blob:",
              // Koneksi: izinkan ke API lokal dan WebSocket
              "connect-src 'self' http://localhost:3001 ws://localhost:3000 ws://localhost:3001 http://localhost:3000",
              // Media
              "media-src 'self' blob: data:",
              // Worker untuk Next.js
              "worker-src 'self' blob:",
              // Frame: izinkan 'self' agar SEB WebView tidak diblokir
              "frame-ancestors 'self'",
            ].join('; '),
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
