'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useI18n()

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
        <Link href="/" className="font-semibold text-sm tracking-tight">
          SAT Practice
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/free" className="text-sm text-gray-500 hover:text-black transition-colors">
            {t.freeMode()}
          </Link>
          <Link href="/simulation" className="text-sm text-gray-500 hover:text-black transition-colors">
            {t.simulation({ count: 30 })}
          </Link>
          <Link href="/history" className="text-sm text-gray-500 hover:text-black transition-colors">
            {t.historyTitle()}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  )
}
