import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Home Inventory Tracker',
  description: 'Track and manage your family household items with photos',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['nextjs', 'home inventory', 'family', 'tracker', 'household', 'items', 'photos'],
  authors: [{ name: 'Shubham Udgirkar', url: 'https://www.linkedin.com/in/shubhamudgirkar' }],
  viewport:  "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover",
  icons: [ 
    { rel: 'icon', url: 'icons/HI-logo-white-512.png' },
    { rel: 'apple-touch-icon', url: 'icons/HI-logo-white-512.png' },
  ]
  
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <meta name="theme-color" content="#ffffffff" />
        <link rel="icon" href="/icons/HI-logo.png"></link>
        <link rel="apple-touch-icon" href="/icons/HI-logo-white-512.png"></link>
        <link rel="manifest" href="/manifest.json" />
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}