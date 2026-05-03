'use client'

import { Question } from '@/lib/types'
import { getDifficultyLabel, getDifficultyColor, getDomainShort } from '@/lib/questions'
import { useI18n } from '@/lib/i18n'

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions?: number
  selectedAnswer: string | null
  showFeedback: boolean
  onSelectAnswer: (answerId: string) => void
  onCheck: () => void
  onNext: () => void
  mode: 'free' | 'simulation'
  isSkipped?: boolean
  onSkip?: () => void
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  showFeedback,
  onSelectAnswer,
  onCheck,
  onNext,
  mode,
  isSkipped,
  onSkip,
}: QuestionCardProps) {
  const { lang, t } = useI18n()
  const isMCQ = question.type === 'mcq'
  const isSPR = question.type === 'spr'
  const correctIds = question.correct_answer || []

  const isCorrect = showFeedback && selectedAnswer
    ? correctIds.includes(selectedAnswer)
    : null

  const sprCorrectAnswer = isSPR && question.answer_options
    ? question.answer_options[0]?.content?.replace(/<[^>]*>/g, '')?.trim()
    : null

  return (
    <div className="card p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm font-mono text-gray-400">
            {mode === 'simulation' && totalQuestions
              ? `${questionNumber} / ${totalQuestions}`
              : `#${questionNumber}`}
          </span>
            <span className={`badge ${getDifficultyColor(question.difficulty)}`}>
             {getDifficultyLabel(question.difficulty, lang)}
          </span>
          <span className="badge badge-gray">
            {getDomainShort(question.domain)}
          </span>
          {question.assessments.length > 0 && (
            <span className="badge badge-blue">
              {question.assessments.join(' / ')}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 uppercase font-mono self-start sm:self-auto">
          {isMCQ ? t.multipleChoice() : t.shortAnswer()}
        </span>
      </div>

      {/* Stem */}
      <div
        className="question-stem mb-8 text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: question.stem }}
      />

      {/* MCQ Options */}
      {isMCQ && question.answer_options && (
        <div className="space-y-3 mb-6">
          {question.answer_options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx)
            const isThisCorrect = correctIds.includes(letter)
            const isSelected = selectedAnswer === letter

            let optionClass = 'answer-option'
            if (showFeedback) {
              if (isThisCorrect) optionClass += ' correct'
              else if (isSelected && !isThisCorrect) optionClass += ' incorrect'
            } else if (isSelected) {
              optionClass += ' selected'
            }

            return (
              <button
                key={opt.id}
                onClick={() => !showFeedback && onSelectAnswer(letter)}
                disabled={showFeedback}
                className={`${optionClass} w-full text-left p-4 rounded-lg flex items-start gap-3`}
                style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
              >
                <span className={`
                  flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
                  ${showFeedback && isThisCorrect ? 'bg-green-100 text-green-700' : ''}
                  ${showFeedback && isSelected && !isThisCorrect ? 'bg-red-100 text-red-700' : ''}
                  ${!showFeedback && isSelected ? 'bg-black text-white' : ''}
                  ${!showFeedback && !isSelected ? 'bg-gray-100 text-gray-500' : ''}
                `}>
                  {letter}
                </span>
                <div
                  className="flex-1 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: opt.content }}
                />
              </button>
            )
          })}
        </div>
      )}

      {/* SPR Input */}
      {isSPR && (
        <div className="mb-6">
          {!showFeedback ? (
            <div>
              <label className="block text-sm text-gray-500 mb-2">
                {lang === 'es' ? 'Tu respuesta:' : 'Your answer:'}
              </label>
              <input
                type="text"
                value={selectedAnswer || ''}
                onChange={e => onSelectAnswer(e.target.value)}
                placeholder={lang === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
                className="input text-lg py-3"
                onKeyDown={e => { if (e.key === 'Enter') onCheck() }}
              />
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-500 mb-1">
                {lang === 'es' ? 'Tu respuesta:' : 'Your answer:'}
              </div>
              <div className={`text-lg font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {selectedAnswer || (lang === 'es' ? '(sin respuesta)' : '(no answer)')}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {lang === 'es' ? 'Respuesta correcta:' : 'Correct answer:'}
              </div>
              <div className="text-lg font-medium text-green-600">{sprCorrectAnswer}</div>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div className={`p-4 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-medium mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {isCorrect
              ? (lang === 'es' ? '✓ Correcto' : '✓ Correct')
              : (lang === 'es' ? '✗ Incorrecto' : '✗ Incorrect')}
          </div>
          {question.rationale && (
            <div
              className="rationale text-sm text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.rationale }}
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {!showFeedback ? (
          <div className="flex gap-3">
            <button
              onClick={onCheck}
              disabled={!selectedAnswer}
              className="btn-primary"
            >
              {t.verify()}
            </button>
            {mode === 'free' && onSkip && (
              <button onClick={onSkip} className="btn-secondary">
                {t.skip()}
              </button>
            )}
          </div>
        ) : (
          <button onClick={onNext} className="btn-primary">
            {mode === 'simulation'
              ? (questionNumber === totalQuestions
                  ? (lang === 'es' ? 'Ver resultados' : 'View results')
                  : t.nextQuestion())
              : t.nextQuestion()}
          </button>
        )}
      </div>
    </div>
  )
}
