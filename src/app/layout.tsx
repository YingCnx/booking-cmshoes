import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'จองคิวซักรองเท้า',
  description: 'ระบบจองคิวรับซักรองเท้าออนไลน์',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  )
}
