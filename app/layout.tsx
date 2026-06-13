import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Agentation } from 'agentation'
import { SessionProvider } from '@/lib/session-context'
import { Toaster } from 'sonner'
import Script from 'next/script'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Ayushman Educational Academy | Smart School Management',
    template: '%s | Ayushman Educational Academy'
  },
  description: 'Welcome to Ayushman Educational Academy. Comprehensive Fee Management and Student Attendance System. Manage school fees, track students, and simplify administration.',
  keywords: [
    'Ayushman Educational Academy', 
    'Ayushman Education', 
    'Ayushman Academy',
    'Ayushman Educatiolna Academy', 
    'School Management', 
    'Fee Management System', 
    'Student Attendance', 
    'School ERP'
  ],
  authors: [{ name: 'Ayushman Educational Academy' }],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ayushman Educational Academy',
    description: 'Smart Fee Management and Student Attendance System for modern schools.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Ayushman Educational Academy',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={geist.className}>
        <SessionProvider>
          <Toaster position="top-center" expand={false} richColors />
          <div className="fade-in-page">{children}</div>
        </SessionProvider>
        {process.env.NODE_ENV === 'development' && <Agentation />}
        <Script
          id="global-logic"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Disable mouse wheel scroll on number inputs globally
              document.addEventListener('wheel', function(e) {
                if (document.activeElement && document.activeElement.type === 'number') {
                  document.activeElement.blur();
                }
              }, { passive: true });

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}