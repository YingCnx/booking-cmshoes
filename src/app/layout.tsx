import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ร้านซักเกิบแอนด์สปา',
  description: 'ระบบร้านซักเกิบแอนด์สปา',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  )
}
