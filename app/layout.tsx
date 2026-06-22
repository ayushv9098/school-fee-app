import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Agentation } from 'agentation'
import { SessionProvider } from '@/lib/session-context'
import { Toaster } from 'sonner'
import Script from 'next/script'
import JsonLd from '@/components/seo/json-ld'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://school-fee-app.vercel.app'),
  title: {
    default: 'Ayushman Educational Academy | Smart School Fee Management - Semli Bari',
    template: '%s | Ayushman Educational Academy'
  },
  description: 'Ayushman Educational Academy, Semli Bari - Comprehensive School Fee Management and Student Attendance System. Manage school fees, track students, generate reports, and simplify administration with AI-powered insights.',
  keywords: [
    'Ayushman Educational Academy',
    'Ayushman Educational Academy Semli Bari',
    'Ayushman Academy',
    'Ayushman Education',
    'Semli Bari school',
    'school fee management',
    'school fee software',
    'fee management system',
    'student fee tracker',
    'school management system India',
    'teacher attendance system',
    'school ERP',
    'fee collection software',
    'school fees online',
    'student management system',
    'school fee app',
    'fees software',
    'school administration software',
  ],
  authors: [{ name: 'Ayushman Educational Academy' }],
  creator: 'AV Infra',
  publisher: 'Ayushman Educational Academy',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://school-fee-app.vercel.app',
  },
  openGraph: {
    title: 'Ayushman Educational Academy - Smart School Fee Management',
    description: 'Comprehensive Fee Management and Student Attendance System for Ayushman Educational Academy, Semli Bari.',
    type: 'website',
    locale: 'en_IN',
    url: 'https://school-fee-app.vercel.app',
    siteName: 'Ayushman Educational Academy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayushman Educational Academy | School Fee Management',
    description: 'Smart Fee Management & Attendance System for Ayushman Educational Academy, Semli Bari.',
  },
  verification: {
    google: '0JHKfwWhqYVUvuV0cvGJ4vqVoRJkI5JvK3qD2OE4PoM',
  },
  category: 'education',
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
        <JsonLd />
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