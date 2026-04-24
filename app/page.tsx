'use client'

import { useState, useEffect } from 'react'
import { loadQuestions } from '@/lib/questions'
import { Question } from '@/lib/types'

const ASSESSMENTS = [
  { value: 'SAT', label: 'SAT', count: 1294 },
  { value: 'PSAT10', label: 'PSAT/NMSQT 10', count: 1222 },
  { value: 'PSAT89', label: 'PSAT 8/9', count: 1075 },
]

const DIFFICULTIES = [
  { value: 'E', label: 'Fácil', color: 'badge-green', desc: 'Preguntas introductorias' },
  { value: 'M', label: 'Media', color: 'badge-orange', desc: 'Nivel intermedio' },
  { value: 'H', label: 'Difícil', color: 'badge-red', desc: 'Mayor complejidad' },
  { value: 'mixed', label: 'Mixto', color: 'badge-gray', desc: 'Combinación de niveles' },
]

const DOMAINS = [
  { value: 'all', label: 'Todos los dominios' },
  { value: 'Algebra', label: 'Álgebra' },
  { value: 'Advanced Math', label: 'Matemáticas Avanzadas' },
  { value: 'Problem-Solving and Data Analysis', label: 'Resolución de Problemas' },
  { value: 'Geometry and Trigonometry', label: 'Geometría y Trigonometría' },
]

export default function HomePage() {
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
          Banco de Preguntas
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          1,294 preguntas de matemáticas SAT, PSAT/NMSQT y PSAT 8/9
          con retroalimentación inmediata y modo simulación.
        </p>
      </div>

      {/* Config Card */}
      <div className="card p-8 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-6" style={{ letterSpacing: '-0.5px' }}>
          Configura tu práctica
        </h2>

        {/* Assessment */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Examen</label>
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
                  {a.count} preguntas
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Dificultad</label>
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
                <div className="font-medium">{d.label}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {difficulty !== 'mixed'
              ? `La mayoría de preguntas serán de dificultad ${DIFFICULTIES.find(d => d.value === difficulty)?.label.toLowerCase()}, con algunas de otros niveles.`
              : 'Distribución equitativa entre todos los niveles.'}
          </p>
        </div>

        {/* Domain */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">Dominio</label>
          <select
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="select"
          >
            {DOMAINS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Count */}
        <div className="text-center text-sm text-gray-500 mb-6">
          {loaded ? (
            <span>
              <span className="font-semibold text-black">{questionCount}</span> preguntas disponibles
            </span>
          ) : (
            'Cargando...'
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={freeUrl}
            className="btn-primary text-center py-3 block"
          >
            Modo Libre
          </a>
          <a
            href={simUrl}
            className="btn-secondary text-center py-3 block"
          >
            Simulación (30)
          </a>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-8 flex gap-6 text-xs text-gray-400">
        <span>SAT: 1,294</span>
        <span>PSAT/NMSQT 10: 1,222</span>
        <span>PSAT 8/9: 1,075</span>
      </div>
    </div>
  )
}
