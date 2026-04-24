'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadQuestions, filterQuestions, selectWeightedQuestions, getDifficultyLabel, getDifficultyColor } from '@/lib/questions'
import { saveSimulationResult, generateId } from '@/lib/storage'
import { Question, Difficulty, SimulationQuestion, SimulationResult } from '@/lib/types'
import QuestionCard from '@/components/QuestionCard'

type SimState = 'setup' | 'playing' | 'results'

const TOTAL_QUESTIONS = 30

function SimulationContent() {
  const searchParams = useSearchParams()
  const assessment = searchParams.get('assessment') || 'SAT'
  const difficulty = (searchParams.get('difficulty') || 'mixed') as Difficulty
  const domain = searchParams.get('domain') || 'all'

  const [state, setState] = useState<SimState>('setup')
  const [playerName, setPlayerName] = useState('')
  const [pool, setPool] = useState<Question[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answers, setAnswers] = useState<SimulationQuestion[]>([])
  const [startTime, setStartTime] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (state !== 'playing') return
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [state, startTime])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    loadQuestions().then(all => {
      const filtered = filterQuestions(all, assessment, difficulty, domain)
      setPool(filtered)
      setLoaded(true)
    })
  }, [assessment, difficulty, domain])

  const startSimulation = () => {
    if (!playerName.trim() || pool.length < TOTAL_QUESTIONS) return
    const selected = selectWeightedQuestions(pool, difficulty, TOTAL_QUESTIONS)
    setQuestions(selected)
    setAnswers([])
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setStartTime(Date.now())
    setState('playing')
  }

  const currentQuestion = questions[currentIndex]

  const handleCheck = () => {
    if (!selectedAnswer || !currentQuestion) return
    setShowFeedback(true)

    const correctIds = currentQuestion.correct_answer || []
    const isCorrect = correctIds.includes(selectedAnswer)

    const simQ: SimulationQuestion = {
      questionId: currentQuestion.external_id,
      domain: currentQuestion.domain,
      difficulty: currentQuestion.difficulty,
      type: currentQuestion.type,
      selectedAnswer,
      correctAnswer: correctIds,
      isCorrect,
      isSkipped: false,
    }

    setAnswers(prev => [...prev, simQ])
  }

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      finishSimulation()
      return
    }
    setCurrentIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  const handleSkip = () => {
    const simQ: SimulationQuestion = {
      questionId: currentQuestion.external_id,
      domain: currentQuestion.domain,
      difficulty: currentQuestion.difficulty,
      type: currentQuestion.type,
      selectedAnswer: null,
      correctAnswer: currentQuestion.correct_answer || [],
      isCorrect: false,
      isSkipped: true,
    }
    setAnswers(prev => [...prev, simQ])

    if (currentIndex >= questions.length - 1) {
      finishSimulation()
      return
    }
    setCurrentIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  const finishSimulation = () => {
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const correct = answers.filter(a => a.isCorrect).length
    const incorrect = answers.filter(a => !a.isCorrect && !a.isSkipped).length
    const skipped = answers.filter(a => a.isSkipped).length

    const result: SimulationResult = {
      id: generateId(),
      name: playerName,
      date: new Date().toISOString(),
      assessment,
      difficulty,
      totalQuestions: TOTAL_QUESTIONS,
      correct,
      incorrect,
      skipped,
      percentage: Math.round((correct / TOTAL_QUESTIONS) * 100),
      questions: answers,
      timeTaken,
    }

    saveSimulationResult(result)
    setState('results')
  }

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: 'Excelente', color: 'text-green-600' }
    if (pct >= 70) return { label: 'Bien', color: 'text-blue-600' }
    if (pct >= 50) return { label: 'Regular', color: 'text-orange-500' }
    return { label: 'Necesitas mejorar', color: 'text-red-600' }
  }

  // SETUP STATE
  if (state === 'setup') {
    if (!loaded) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">Cargando...</div>
        </div>
      )
    }

    return (
      <div className="max-w-lg mx-auto py-12">
        <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-6 block">
          ← Volver
        </a>
        <h1 className="text-3xl font-semibold mb-2" style={{ letterSpacing: '-1.5px' }}>
          Modo Simulación
        </h1>
        <p className="text-gray-500 mb-8">
          Responde {TOTAL_QUESTIONS} preguntas cronometradas. Los resultados se guardarán con tu nombre.
        </p>

        <div className="card p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Tu nombre</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Ingresa tu nombre..."
              className="input text-lg py-3"
              onKeyDown={e => { if (e.key === 'Enter') startSimulation() }}
              autoFocus
            />
          </div>

          <div className="text-sm text-gray-500 mb-4">
            <span className="font-semibold text-black">{pool.length}</span> preguntas disponibles
            {pool.length < TOTAL_QUESTIONS && (
              <span className="text-red-500 ml-2">
                (necesitas al menos {TOTAL_QUESTIONS})
              </span>
            )}
          </div>

          <button
            onClick={startSimulation}
            disabled={!playerName.trim() || pool.length < TOTAL_QUESTIONS}
            className="btn-primary w-full py-3 text-base"
          >
            Iniciar Simulación
          </button>
        </div>
      </div>
    )
  }

  // PLAYING STATE
  if (state === 'playing' && currentQuestion) {
    return (
      <div>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors">
              ← Cancelar
            </a>
            <span className="text-sm text-gray-500 flex items-center gap-2">
              {playerName} — Pregunta {currentIndex + 1} de {TOTAL_QUESTIONS}
              <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {formatTime(timeElapsed)}
              </span>
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>

        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={TOTAL_QUESTIONS}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelectAnswer={setSelectedAnswer}
          onCheck={handleCheck}
          onNext={handleNext}
          onSkip={handleSkip}
          mode="simulation"
        />
      </div>
    )
  }

  // RESULTS STATE
  if (state === 'results') {
    const correct = answers.filter(a => a.isCorrect).length
    const incorrect = answers.filter(a => !a.isCorrect && !a.isSkipped).length
    const skipped = answers.filter(a => a.isSkipped).length
    const pct = Math.round((correct / TOTAL_QUESTIONS) * 100)
    const grade = getGrade(pct)
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const minutes = Math.floor(timeTaken / 60)
    const seconds = timeTaken % 60

    // By domain stats
    const byDomain: Record<string, { correct: number; total: number }> = {}
    for (const a of answers) {
      if (!byDomain[a.domain]) byDomain[a.domain] = { correct: 0, total: 0 }
      byDomain[a.domain].total++
      if (a.isCorrect) byDomain[a.domain].correct++
    }

    // By difficulty stats
    const byDiff: Record<string, { correct: number; total: number }> = {}
    for (const a of answers) {
      if (!byDiff[a.difficulty]) byDiff[a.difficulty] = { correct: 0, total: 0 }
      byDiff[a.difficulty].total++
      if (a.isCorrect) byDiff[a.difficulty].correct++
    }

    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-semibold mb-2" style={{ letterSpacing: '-1.5px' }}>
          Resultados
        </h1>
        <p className="text-gray-500 mb-8">{playerName} — Simulación completada</p>

        {/* Score card */}
        <div className="card p-8 text-center mb-6">
          <div className={`text-6xl font-semibold mb-2 ${grade.color}`} style={{ letterSpacing: '-3px' }}>
            {pct}%
          </div>
          <div className={`text-xl font-medium mb-4 ${grade.color}`}>
            {grade.label}
          </div>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <div className="text-2xl font-semibold text-green-600">{correct}</div>
              <div className="text-gray-400">Correctas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-500">{incorrect}</div>
              <div className="text-gray-400">Incorrectas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-400">{skipped}</div>
              <div className="text-gray-400">Saltadas</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-600">{minutes}:{seconds.toString().padStart(2, '0')}</div>
              <div className="text-gray-400">Tiempo</div>
            </div>
          </div>
        </div>

        {/* By domain */}
        <div className="card p-6 mb-4">
          <h3 className="font-semibold mb-4">Por dominio</h3>
          <div className="space-y-3">
            {Object.entries(byDomain).map(([domain, stats]) => (
              <div key={domain} className="flex items-center justify-between">
                <span className="text-sm">{domain}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-500 w-12 text-right">
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By difficulty */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Por dificultad</h3>
          <div className="space-y-3">
            {Object.entries(byDiff).map(([diff, stats]) => (
              <div key={diff} className="flex items-center justify-between">
                <span className={`badge ${getDifficultyColor(diff)}`}>
                  {getDifficultyLabel(diff)}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-gray-500 w-12 text-right">
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a href="/simulation" className="btn-primary">
            Nueva simulación
          </a>
          <a href="/history" className="btn-secondary">
            Ver historial
          </a>
          <a href="/" className="btn-secondary">
            Inicio
          </a>
        </div>
      </div>
    )
  }

  return null
}

export default function SimulationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Cargando...</div>
      </div>
    }>
      <SimulationContent />
    </Suspense>
  )
}
