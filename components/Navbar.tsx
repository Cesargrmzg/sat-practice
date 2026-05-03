'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useI18n()

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 sm:py-0 sm:h-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <Link href="/" className="font-semibold text-sm tracking-tight">
            SAT Practice
          </Link>
          <div className="sm:hidden">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:gap-4">
          <Link href="/free" className="text-gray-500 hover:text-black transition-colors">
            {t.practiceNav()}
          </Link>
          <Link href="/simulation" className="text-gray-500 hover:text-black transition-colors">
            {t.simulationNav()}
          </Link>
          <Link href="/history" className="text-gray-500 hover:text-black transition-colors">
            {t.historyNav()}
          </Link>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  )
}
