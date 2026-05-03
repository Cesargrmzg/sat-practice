'use client'

import { useState, useEffect } from 'react'
import { getSimulationResults, clearSimulationResults } from '@/lib/storage'
import { SimulationResult } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import { getAssessmentLabel, getDifficultyLabel, getDifficultyColor, getDomainLabel } from '@/lib/questions'

const ADMIN_PASSWORD = 'admin123'
const AUTH_KEY = 'sat-history-auth'

export default function HistoryPage() {
  const { lang, t } = useI18n()
  const [results, setResults] = useState<SimulationResult[]>([])
  const [loaded, setLoaded] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [selectedResult, setSelectedResult] = useState<SimulationResult | null>(null)

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY)
    if (auth === 'true') {
      setAuthenticated(true)
      setResults(getSimulationResults())
    }
    setLoaded(true)
  }, [])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      sessionStorage.setItem(AUTH_KEY, 'true')
      setResults(getSimulationResults())
      setError('')
    } else {
      setError(t.wrongPassword())
    }
  }

  const handleClear = () => {
    if (confirm(t.confirmDelete())) {
      clearSimulationResults()
      setResults([])
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">{t.loading()}</div>
      </div>
    )
  }

  // Password gate
  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto py-20">
        <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-6 block">
          ← {t.back()}
        </a>
        <h1 className="text-3xl font-semibold mb-2" style={{ letterSpacing: '-1.5px' }}>
          {t.historyTitle()}
        </h1>
        <p className="text-gray-500 mb-8">{t.passwordRequired()}</p>

        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">{t.password()}</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder={t.passwordPlaceholder()}
            className="input text-lg py-3 mb-3"
            onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}
          <button onClick={handleLogin} className="btn-primary w-full py-3">
            {t.access()}
          </button>
        </div>
      </div>
    )
  }

  // Detail view
  if (selectedResult) {
    const r = selectedResult
    const date = new Date(r.date)
    const dateStr = date.toLocaleDateString(lang === 'es' ? 'es' : 'en', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const byDomain: Record<string, { correct: number; total: number }> = {}
    for (const a of r.questions) {
      if (!byDomain[a.domain]) byDomain[a.domain] = { correct: 0, total: 0 }
      byDomain[a.domain].total++
      if (a.isCorrect) byDomain[a.domain].correct++
    }

    const byDiff: Record<string, { correct: number; total: number }> = {}
    for (const a of r.questions) {
      if (!byDiff[a.difficulty]) byDiff[a.difficulty] = { correct: 0, total: 0 }
      byDiff[a.difficulty].total++
      if (a.isCorrect) byDiff[a.difficulty].correct++
    }

    return (
      <div className="max-w-2xl mx-auto py-8">
        <button onClick={() => setSelectedResult(null)} className="text-sm text-gray-400 hover:text-black transition-colors mb-6 block">
          ← {t.back()}
        </button>
        <h1 className="text-3xl font-semibold mb-2" style={{ letterSpacing: '-1.5px' }}>
          {r.name}
        </h1>
        <p className="text-gray-500 mb-8">{dateStr}</p>

        {/* Score card */}
        <div className="card p-8 text-center mb-6">
          <div className={`text-6xl font-semibold mb-2 ${
            r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-orange-500' : 'text-red-500'
          }`} style={{ letterSpacing: '-3px' }}>
            {r.percentage}%
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm mt-4">
            <div>
              <div className="text-2xl font-semibold text-green-600">{r.correct}</div>
              <div className="text-gray-400">{t.correctLabel()}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-500">{r.incorrect}</div>
              <div className="text-gray-400">{t.incorrect()}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-400">{r.skipped}</div>
              <div className="text-gray-400">{t.skipped()}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-600">
                {Math.floor(r.timeTaken / 60)}:{(r.timeTaken % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400">{t.time()}</div>
            </div>
          </div>
        </div>

        {/* By domain */}
        <div className="card p-6 mb-4">
          <h3 className="font-semibold mb-4">{t.byDomain()}</h3>
          <div className="space-y-3">
            {Object.entries(byDomain).map(([d, stats]) => (
              <div key={d} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm">{getDomainLabel(d, lang)}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: `${(stats.correct / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-mono text-gray-500 w-12 text-right">{stats.correct}/{stats.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By difficulty */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">{t.byDifficulty()}</h3>
          <div className="space-y-3">
            {Object.entries(byDiff).map(([diff, stats]) => (
              <div key={diff} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className={`badge ${getDifficultyColor(diff)}`}>{getDifficultyLabel(diff, lang)}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full" style={{ width: `${(stats.correct / stats.total) * 100}%` }} />
                  </div>
                  <span className="text-sm font-mono text-gray-500 w-12 text-right">{stats.correct}/{stats.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">{lang === 'es' ? 'Por pregunta' : 'By question'}</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {r.questions.map((q, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                  q.isSkipped
                    ? 'bg-gray-200 text-gray-500'
                    : q.isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                }`}
                title={`${i + 1}: ${q.isSkipped ? (lang === 'es' ? 'Saltada' : 'Skipped') : q.isCorrect ? (lang === 'es' ? 'Correcta' : 'Correct') : (lang === 'es' ? 'Incorrecta' : 'Incorrect')}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setSelectedResult(null)} className="btn-secondary">
          ← {t.back()}
        </button>
      </div>
    )
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-2 block">
            ← {t.back()}
          </a>
          <h1 className="text-3xl font-semibold" style={{ letterSpacing: '-1.5px' }}>
            {t.historyTitle()}
          </h1>
        </div>
        {results.length > 0 && (
          <button onClick={handleClear} className="btn-secondary text-red-600">
            {t.deleteAll()}
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">{t.noHistory()}</p>
          <a href="/simulation" className="btn-primary inline-block">
            {t.newSim()}
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(r => {
            const date = new Date(r.date)
            const dateStr = date.toLocaleDateString(lang === 'es' ? 'es' : 'en', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
            const minutes = Math.floor(r.timeTaken / 60)
            const seconds = r.timeTaken % 60

            return (
              <div key={r.id} className="card p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedResult(r)}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="text-lg font-semibold mb-1">{r.name}</div>
                    <div className="text-sm text-gray-400">{dateStr}</div>
                  </div>
                  <div className={`text-3xl font-semibold ${
                    r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-orange-500' : 'text-red-500'
                  }`} style={{ letterSpacing: '-1.5px' }}>
                    {r.percentage}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-blue">
                    {getAssessmentLabel(r.assessment, lang)}
                  </span>
                  <span className="badge badge-gray">
                    {getDifficultyLabel(r.difficulty, lang)}
                  </span>
                  <span className="badge badge-gray">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex gap-6 text-sm">
                  <span className="text-green-600">
                    ✓ {r.correct} {lang === 'es' ? 'correctas' : 'correct'}
                  </span>
                  <span className="text-red-500">
                    ✗ {r.incorrect} {lang === 'es' ? 'incorrectas' : 'incorrect'}
                  </span>
                  {r.skipped > 0 && (
                    <span className="text-gray-400">
                      → {r.skipped} {lang === 'es' ? 'saltadas' : 'skipped'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
