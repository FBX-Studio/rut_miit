import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ВРПТВ Система - Панель оптимизации маршрутов',
  description: 'Продвинутая система оптимизации задачи маршрутизации транспорта с временными окнами (ВРПТВ) с мониторингом в реальном времени и адаптивной реоптимизацией.',
  keywords: 'ВРПТВ, оптимизация маршрутов, логистика, доставка, управление автопарком, мониторинг в реальном времени',
  authors: [{ name: 'Команда ВРПТВ Системы' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'ВРПТВ Система - Панель оптимизации маршрутов',
    description: 'Продвинутая система оптимизации задачи маршрутизации транспорта с временными окнами',
    type: 'website',
    locale: 'ru_RU',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}