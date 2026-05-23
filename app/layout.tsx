import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Agentation } from 'agentation'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ayushman Educational Academy',
  description: 'Fee Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <div className="fade-in-page">{children}</div>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}