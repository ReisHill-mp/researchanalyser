import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'UserTestingSynth',
  description: 'Research workflow tool for turning UserTesting studies into actionable insights',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#f7f8f3',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`} style={{ colorScheme: 'light' }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
