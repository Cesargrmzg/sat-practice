'use client'

import { useState, useEffect } from 'react'
import { loadQuestions } from '@/lib/questions'
import { Question } from '@/lib/types'
import { useI18n } from '@/lib/i18n'

const ASSESSMENTS = [
  { value: 'SAT', label: 'SAT', count: 1294 },
  { value: 'PSAT10', label: 'PSAT/NMSQT 10', count: 1222 },
  { value: 'PSAT89', label: 'PSAT 8/9', count: 1075 },
]

const DIFFICULTIES = [
  { value: 'E', key: 'easy' },
  { value: 'M', key: 'medium' },
  { value: 'H', key: 'hard' },
  { value: 'mixed', key: 'mixed' },
]

const DOMAINS = [
  { value: 'all', key: 'allDomains' },
  { value: 'Algebra', key: 'algebra' },
  { value: 'Advanced Math', key: 'advancedMath' },
  { value: 'Problem-Solving and Data Analysis', key: 'problemSolving' },
  { value: 'Geometry and Trigonometry', key: 'geometry' },
]

export default function HomePage() {
  const { lang, t } = useI18n()
  const [assessment, setAssessment] = useState('SAT')
  const [difficulty, setDifficulty] = useState('mixed')
  const [domain, setDomain] = useState('all')
  const [questionCount, setQuestionCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadQuestions().then(qs => {
      let filtered = qs
      if (assessment !== 'all') {
        filtered = filtered.filter(q => q.assessments.includes(assessment))
      }
      if (domain !== 'all') {
        filtered = filtered.filter(q => q.domain === domain)
      }
      if (difficulty !== 'mixed') {
        filtered = filtered.filter(q => q.difficulty === difficulty)
      }
      setQuestionCount(filtered.length)
      setLoaded(true)
    })
  }, [assessment, difficulty, domain])

  const freeUrl = `/free?assessment=${assessment}&difficulty=${difficulty}&domain=${domain}`
  const simUrl = `/simulation?assessment=${assessment}&difficulty=${difficulty}&domain=${domain}`

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1
          className="text-5xl font-semibold mb-4"
          style={{ letterSpacing: '-2px', lineHeight: '1.1' }}
        >
          {t.title()}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          {t.subtitle({ count: '1,294' })}
        </p>
      </div>

      {/* Config Card */}
      <div className="card p-8 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-6" style={{ letterSpacing: '-0.5px' }}>
          {t.configure()}
        </h2>

        {/* Assessment */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">{t.exam()}</label>
          <div className="grid grid-cols-3 gap-2">
            {ASSESSMENTS.map(a => (
              <button
                key={a.value}
                onClick={() => setAssessment(a.value)}
                className={`p-3 rounded-lg text-center text-sm transition-all ${
                  assessment === a.value
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{a.label}</div>
                <div className={`text-xs mt-0.5 ${assessment === a.value ? 'text-gray-400' : 'text-gray-400'}`}>
                  {lang === 'es' ? `${a.count} preguntas` : `${a.count} questions`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">{t.difficulty()}</label>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`p-3 rounded-lg text-center text-sm transition-all ${
                  difficulty === d.value
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{t[d.key]()}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {difficulty !== 'mixed'
              ? lang === 'es'
                ? `La mayoría de preguntas serán de dificultad ${t[difficulty === 'E' ? 'easy' : difficulty === 'M' ? 'medium' : 'hard']().toLowerCase()}, con algunas de otros niveles.`
                : `Most questions will be ${t[difficulty === 'E' ? 'easy' : difficulty === 'M' ? 'medium' : 'hard']().toLowerCase()} difficulty, with some from other levels.`
              : t.mixedDesc()}
          </p>
        </div>

        {/* Domain */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">{t.domain()}</label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="select"
          >
            {DOMAINS.map(d => (
              <option key={d.value} value={d.value}>{t[d.key]()}</option>
            ))}
          </select>
        </div>

        {/* Count */}
        <div className="text-center text-sm text-gray-500 mb-6">
          {loaded ? (
            <span>
              <span className="font-semibold text-black">{questionCount}</span>{' '}
              {lang === 'es' ? 'preguntas disponibles' : 'questions available'}
            </span>
          ) : (
            '...'
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a href={freeUrl} className="btn-primary text-center py-3 block">
            {t.freeMode()}
          </a>
          <a href={simUrl} className="btn-secondary text-center py-3 block">
            {t.simulation({ count: 30 })}
          </a>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 flex gap-6 text-xs text-gray-400">
        <span>{t.satCount({ count: '1,294' })}</span>
        <span>{t.psat10Count({ count: '1,222' })}</span>
        <span>{t.psat89Count({ count: '1,075' })}</span>
      </div>

      {/* Spanish disclaimer */}
      {lang === 'es' && (
        <div className="mt-4 text-[11px] text-orange-500/70 text-center max-w-md">
          ⚠ {t.langDisclaimer()}
        </div>
      )}
    </div>
  )
}
