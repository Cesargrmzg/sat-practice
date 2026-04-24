'use client'

import { Suspense } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadQuestions, filterQuestions, getRandomQuestion } from '@/lib/questions'
import { Question, Difficulty } from '@/lib/types'
import QuestionCard from '@/components/QuestionCard'

function FreeContent() {
  const searchParams = useSearchParams()
  const assessment = searchParams.get('assessment') || 'SAT'
  const difficulty = (searchParams.get('difficulty') || 'mixed') as Difficulty
  const domain = searchParams.get('domain') || 'all'

  const [pool, setPool] = useState<Question[]>([])
  const [current, setCurrent] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadQuestions().then(all => {
      const filtered = filterQuestions(all, assessment, difficulty, domain)
      setPool(filtered)
      if (filtered.length > 0) {
        setCurrent(getRandomQuestion(filtered))
      }
      setLoaded(true)
    })
  }, [assessment, difficulty, domain])

  const nextQuestion = useCallback(() => {
    if (pool.length === 0) return
    const q = getRandomQuestion(pool)
    setCurrent(q)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }, [pool])

  const handleCheck = () => {
    if (!selectedAnswer || !current) return
    setShowFeedback(true)
    setQuestionCount(prev => prev + 1)
    
    const correctIds = current.correct_answer || []
    if (correctIds.includes(selectedAnswer)) {
      setCorrectCount(prev => prev + 1)
    }
  }

  const handleNext = () => {
    nextQuestion()
  }

  const handleSkip = () => {
    nextQuestion()
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Cargando preguntas...</div>
      </div>
    )
  }

  if (pool.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-4" style={{ letterSpacing: '-1px' }}>
          No hay preguntas disponibles
        </h2>
        <p className="text-gray-500 mb-6">
          No se encontraron preguntas con los filtros seleccionados.
        </p>
        <a href="/" className="btn-primary inline-block">
          Volver al inicio
        </a>
      </div>
    )
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors">
            ← Volver
          </a>
          <h1 className="text-lg font-semibold" style={{ letterSpacing: '-0.5px' }}>
            Modo Libre
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            Respondidas: <span className="font-semibold text-black">{questionCount}</span>
          </span>
          <span className="text-gray-500">
            Correctas: <span className="font-semibold text-green-600">{correctCount}</span>
          </span>
          {questionCount > 0 && (
            <span className="text-gray-500">
              Acierto: <span className="font-semibold text-black">
                {Math.round((correctCount / questionCount) * 100)}%
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      {current && (
        <QuestionCard
          question={current}
          questionNumber={questionCount + 1}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelectAnswer={setSelectedAnswer}
          onCheck={handleCheck}
          onNext={handleNext}
          onSkip={handleSkip}
          mode="free"
        />
      )}
    </div>
  )
}

export default function FreePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Cargando...</div>
      </div>
    }>
      <FreeContent />
    </Suspense>
  )
}
