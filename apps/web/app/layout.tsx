import type { Metadata } from "next";
import { cookies } from 'next/headers';
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { FaviconSync } from '@/components/favicon-sync';
import { ThemeScript } from "@/components/theme-script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const appName = cookieStore.get('cbt-app-name')?.value || 'Novatech CBT';
  const faviconUrl = cookieStore.get('cbt-favicon-url')?.value || '/favicon.ico';
  return {
    title: appName,
    description: `${appName} Computer Based Test Platform`,
    icons: { icon: faviconUrl },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <Providers>
          <FaviconSync />
          {children}
        </Providers>
      </body>
    </html>
  );
}
