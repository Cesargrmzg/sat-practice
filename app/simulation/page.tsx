'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadQuestions, filterQuestions, selectWeightedQuestions, getDifficultyLabel, getDifficultyColor } from '@/lib/questions'
import { saveSimulationResult, generateId } from '@/lib/storage'
import { Question, Difficulty, SimulationQuestion, SimulationResult } from '@/lib/types'
import QuestionCard from '@/components/QuestionCard'
import { useI18n } from '@/lib/i18n'

type SimState = 'setup' | 'playing' | 'results'

const TOTAL_QUESTIONS = 30
const SESSION_KEY = 'sat-sim-session'

interface SimSession {
  playerName: string
  assessment: string
  difficulty: string
  domain: string
  questions: Question[]
  currentIndex: number
  answers: SimulationQuestion[]
  startTime: number
  selectedAnswer: string | null
  showFeedback: boolean
}

function SimulationContent() {
  const { lang, t } = useI18n()
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
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const restoreChecked = useRef(false)

  // Check for saved session on mount
  useEffect(() => {
    if (restoreChecked.current) return
    restoreChecked.current = true
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        const session: SimSession = JSON.parse(saved)
        if (session.assessment === assessment && session.difficulty === difficulty && session.domain === domain) {
          setHasSavedSession(true)
        }
      }
    } catch {}
  }, [assessment, difficulty, domain])

  // Timer
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

  // Load question pool
  useEffect(() => {
    loadQuestions(lang).then(all => {
      const filtered = filterQuestions(all, assessment, difficulty, domain)
      setPool(filtered)
      setLoaded(true)
    })
  }, [assessment, difficulty, domain, lang])

  // Save session whenever state changes during play
  useEffect(() => {
    if (state !== 'playing' || questions.length === 0) return
    const session: SimSession = {
      playerName, assessment, difficulty, domain,
      questions, currentIndex, answers, startTime,
      selectedAnswer, showFeedback,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [state, playerName, assessment, difficulty, domain, questions, currentIndex, answers, startTime, selectedAnswer, showFeedback])

  const restoreSession = () => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (!saved) return
      const session: SimSession = JSON.parse(saved)
      setPlayerName(session.playerName)
      setQuestions(session.questions)
      setCurrentIndex(session.currentIndex)
      setAnswers(session.answers)
      setStartTime(session.startTime)
      setSelectedAnswer(session.selectedAnswer)
      setShowFeedback(session.showFeedback)
      setState('playing')
      setHasSavedSession(false)
    } catch {}
  }

  const discardSession = () => {
    localStorage.removeItem(SESSION_KEY)
    setHasSavedSession(false)
  }

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY)
  }

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
    clearSession()
    setState('results')
  }

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: lang === 'es' ? 'Excelente' : 'Excellent', color: 'text-green-600' }
    if (pct >= 70) return { label: lang === 'es' ? 'Bien' : 'Good', color: 'text-blue-600' }
    if (pct >= 50) return { label: lang === 'es' ? 'Regular' : 'Regular', color: 'text-orange-500' }
    return { label: lang === 'es' ? 'Necesitas mejorar' : 'Needs improvement', color: 'text-red-600' }
  }

  // SETUP STATE
  if (state === 'setup') {
    if (!loaded) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400">{t.loading()}</div>
        </div>
      )
    }

    return (
      <div className="max-w-lg mx-auto py-12">
        <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-6 block">
          ← {t.back()}
        </a>
        <h1 className="text-3xl font-semibold mb-2" style={{ letterSpacing: '-1.5px' }}>
          {t.simTitle()}
        </h1>
        <p className="text-gray-500 mb-8">
          {t.simSubtitle({ count: TOTAL_QUESTIONS })}
        </p>

        {/* Restore session prompt */}
        {hasSavedSession && (
          <div className="card p-6 mb-4 border-2 border-amber-300 bg-amber-50">
            <h3 className="font-semibold text-amber-800 mb-2">
              {lang === 'es' ? 'Sesión encontrada' : 'Session found'}
            </h3>
            <p className="text-sm text-amber-700 mb-4">
              {lang === 'es'
                ? 'Tienes una simulación sin terminar. ¿Quieres continuar donde te quedaste?'
                : 'You have an unfinished simulation. Do you want to continue where you left off?'}
            </p>
            <div className="flex gap-3">
              <button onClick={restoreSession} className="btn-primary">
                {lang === 'es' ? 'Continuar' : 'Continue'}
              </button>
              <button onClick={discardSession} className="btn-secondary">
                {lang === 'es' ? 'Empezar de nuevo' : 'Start over'}
              </button>
            </div>
          </div>
        )}

        <div className="card p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">{t.yourName()}</label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder={t.namePlaceholder()}
              className="input text-lg py-3"
              onKeyDown={e => { if (e.key === 'Enter') startSimulation() }}
              autoFocus
            />
          </div>

          <div className="text-sm text-gray-500 mb-4">
            <span className="font-semibold text-black">{pool.length}</span> {t.questionsAvail()}
            {pool.length < TOTAL_QUESTIONS && (
              <span className="text-red-500 ml-2">
                {t.needMin({ count: TOTAL_QUESTIONS })}
              </span>
            )}
          </div>

          <button
            onClick={startSimulation}
            disabled={!playerName.trim() || pool.length < TOTAL_QUESTIONS}
            className="btn-primary w-full py-3 text-base"
          >
            {t.startSim()}
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
              ← {t.cancel()}
            </a>
            <span className="text-sm text-gray-500 flex items-center gap-2">
              {t.questionOf({ name: playerName, current: currentIndex + 1, total: TOTAL_QUESTIONS })}
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
          {t.results()}
        </h1>
        <p className="text-gray-500 mb-8">{t.simCompleted({ name: playerName })}</p>

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
              <div className="text-gray-400">{t.correctLabel()}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-red-500">{incorrect}</div>
              <div className="text-gray-400">{t.incorrect()}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-400">{skipped}</div>
              <div className="text-gray-400">{t.skipped()}</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-600">{minutes}:{seconds.toString().padStart(2, '0')}</div>
              <div className="text-gray-400">{t.time()}</div>
            </div>
          </div>
        </div>

        {/* By domain */}
        <div className="card p-6 mb-4">
          <h3 className="font-semibold mb-4">{t.byDomain()}</h3>
          <div className="space-y-3">
            {Object.entries(byDomain).map(([d, stats]) => (
              <div key={d} className="flex items-center justify-between">
                <span className="text-sm">{d}</span>
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
          <h3 className="font-semibold mb-4">{t.byDifficulty()}</h3>
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
            {t.newSim()}
          </a>
          <a href="/history" className="btn-secondary">
            {t.viewHistory()}
          </a>
          <a href="/" className="btn-secondary">
            {t.home()}
          </a>
        </div>
      </div>
    )
  }

  return null
}

export default function SimulationPage() {
  const { t } = useI18n()
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">{t.loading()}</div>
      </div>
    }>
      <SimulationContent />
    </Suspense>
  )
}
