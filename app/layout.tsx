import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
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
}

export const viewport: Viewport = {
  themeColor: '#1a4d2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
