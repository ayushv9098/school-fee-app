import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Agentation } from 'agentation'

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
        <div className="fade-in-page">{children}</div>
        {process.env.NODE_ENV === 'development' && <Agentation />}
        <script
          dangerouslySetInnerHTML={{
            __html: `
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