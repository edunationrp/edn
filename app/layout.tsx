import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AppToaster } from '@/components/providers/app-toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'EduNation — Plateforme Scolaire Numérique',
    template: '%s | EduNation',
  },
  description:
    'EduNation est la plateforme de gestion scolaire numérique des collèges et lycées du Burkina Faso.',
  keywords: ['école', 'gestion scolaire', 'Burkina Faso', 'bulletins', 'notes', 'EduNation'],
  authors: [{ name: 'EduNation' }],
  manifest: '/manifest.json',
  applicationName: 'EduNation',
  icons: {
    icon: [{ url: '/edunation.jpeg', type: 'image/jpeg' }],
    apple: [{ url: '/edunation.jpeg', type: 'image/jpeg' }],
    shortcut: '/edunation.jpeg',
  },
  appleWebApp: {
    capable: true,
    title: 'EduNation',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#1B3A6B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning
      >
        {children}
        <AppToaster />
      </body>
    </html>
  )
}
