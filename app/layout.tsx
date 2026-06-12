import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Agentation } from 'agentation'
import { SessionProvider } from '@/lib/session-context'
import { Toaster } from 'sonner'
import Script from 'next/script'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ayushman Educational Academy',
  description: 'Fee Management System',
  manifest: '/manifest.json',
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