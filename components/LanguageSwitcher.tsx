'use client'

import { useI18n } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang('en')}
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
        className={`px-2 py-1 text-xs rounded transition-colors ${
          lang === 'es'
            ? 'bg-black text-white'
            : 'text-gray-400 hover:text-black'
        }`}
      >
        ES
      </button>
      {lang === 'es' && (
        <span className="text-[10px] text-orange-500 ml-1 hidden sm:inline">
          ⚠ {t.langDisclaimer()}
        </span>
      )}
    </div>
  )
}
