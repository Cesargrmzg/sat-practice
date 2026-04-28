import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'SAT Practice — Question Bank',
  description: 'SAT, PSAT/NMSQT and PSAT 8/9 math practice platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <I18nProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
              {children}
            </main>
            <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-100">
              College Board® SAT Practice — All questions sourced from official College Board materials.
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}
