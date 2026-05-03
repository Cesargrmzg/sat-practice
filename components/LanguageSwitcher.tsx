'use client'

import { useI18n } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        aria-label="Switch language to English"
        className={`px-2 py-1 text-xs rounded transition-colors ${
          lang === 'en'
            ? 'bg-black text-white'
            : 'text-gray-400 hover:text-black'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('es')}
        aria-pressed={lang === 'es'}
        aria-label="Cambiar idioma a español"
        className={`px-2 py-1 text-xs rounded transition-colors ${
          lang === 'es'
            ? 'bg-black text-white'
            : 'text-gray-400 hover:text-black'
        }`}
      >
        ES
      </button>
    </div>
  )
}
