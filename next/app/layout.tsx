import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { ClientProviders } from '@/components/ClientProviders'

export const metadata: Metadata = {
  title: 'Ecogram - BJJ Training Game Library',
  description: 'Organize your BJJ training games and build effective class sessions',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ecogram',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-mesh">
        <ClientProviders>
          <Navigation />
          <main className="pt-0 pb-20 sm:pt-16 sm:pb-0">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  )
}
