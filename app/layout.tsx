import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Surft Combat | 16-Bit Retro Arcade Shooter',
  description:
    'Single-screen 16-bit retro arcade space combat shooter built with Next.js 15, Canvas 2D, and Web Audio API.',
  authors: [{ name: 'Ridwan Adeshina (Surft)' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#150B29',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
