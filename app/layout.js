import './globals.css';
import Frame from '@/components/Frame';
export const metadata = { title: 'JavaBali Travelmate', description: 'Sistem manajemen JavaBali Travelmate', manifest: '/manifest.json', icons: { icon: '/icon-192.png', apple: '/icon-192.png' } };
export const viewport = { themeColor: '#276E92', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" />
      </head>
      <body className="font-sans"><Frame>{children}</Frame></body>
    </html>
  );
}
