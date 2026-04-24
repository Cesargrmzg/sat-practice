import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAT Practice — Banco de Preguntas',
  description: 'Practica preguntas de matemáticas SAT, PSAT/NMSQT y PSAT 8/9 con retroalimentación inmediata',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight" style={{ letterSpacing: '-0.5px' }}>
                SAT Practice
              </span>
            </a>
            <div className="flex items-center gap-6">
              <a href="/free" className="text-sm text-gray-600 hover:text-black transition-colors">
                Modo Libre
              </a>
              <a href="/simulation" className="text-sm text-gray-600 hover:text-black transition-colors">
                Simulación
              </a>
              <a href="/history" className="text-sm text-gray-600 hover:text-black transition-colors">
                Historial
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
