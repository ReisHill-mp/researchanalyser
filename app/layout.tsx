import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
  title: 'UserTestingSynth',
  description: 'Research workflow tool for turning UserTesting studies into actionable insights',
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
    <html lang="en" className={`light ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased" style={{ colorScheme: 'light' }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
