'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'en' | 'es'

const translations = {
  en: {
    // Home page
    title: 'Question Bank',
    subtitle: 'SAT, PSAT/NMSQT and PSAT 8/9 math questions with instant feedback and simulation mode.',
    configure: 'Configure your practice',
    exam: 'Exam',
    difficulty: 'Difficulty',
    domain: 'Domain',
    all: 'All',
    allDomains: 'All domains',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    mixed: 'Mixed',
    mixedDesc: 'Questions from all difficulty levels.',
    algebra: 'Algebra',
    advancedMath: 'Advanced Math',
    problemSolving: 'Problem-Solving & Data Analysis',
    geometry: 'Geometry & Trigonometry',
    freeMode: 'Practice Mode',
    simulation: 'Simulation ({count} questions)',
    satCount: '{count} SAT questions',
    psat10Count: '{count} PSAT/NMSQT 10',
    psat89Count: '{count} PSAT 8/9',
    language: 'Language',
    practiceNav: 'Practice',
    simulationNav: 'Simulation',
    historyNav: 'History',
    langDisclaimer: 'Spanish translations are machine-assisted and have been QA-reviewed. Math notation and official wording may still differ from the original.',
    questionLanguageNotice: 'Questions are shown in Spanish, while math notation and some labels remain in their original form.',

    // Free mode
    freeModeTitle: 'Practice Mode',
    answered: 'Answered',
    correct: 'Correct',
    accuracy: 'Accuracy',

    // Simulation
    simTitle: 'Simulation Mode',
    simSubtitle: '{count} questions with timer. Results are saved.',
    yourName: 'Your name',
    namePlaceholder: 'e.g. María García',
    questionsAvail: 'available',
    needMin: '(minimum {count} required)',
    startSim: 'Start Simulation',
    cancel: 'Cancel',
    questionOf: '{name} — Question {current} of {total}',
    results: 'Results',
    simCompleted: 'Simulation completed by {name}',
    correctLabel: 'Correct',
    incorrect: 'Incorrect',
    skipped: 'Skipped',
    time: 'Time',
    byDomain: 'By Domain',
    byDifficulty: 'By Difficulty',
    newSim: 'New Simulation',
    viewHistory: 'View History',
    home: 'Home',

    // History
    historyTitle: 'Simulation History',
    passwordRequired: 'Enter the password to view simulation history.',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    access: 'Access',
    wrongPassword: 'Incorrect password',
    confirmDelete: 'Delete all simulation history?',
    deleteAll: 'Delete All',
    noHistory: 'No simulation history yet.',

    // QuestionCard
    multipleChoice: 'Multiple Choice',
    shortAnswer: 'Short Answer',
    verify: 'Check Answer',
    skip: 'Skip',
    nextQuestion: 'Next Question',

    // Common
    back: 'Back',
    loading: 'Loading...',
    noQuestions: 'No questions available',
    noQuestionsDesc: 'No questions found with the selected filters.',
  },
  es: {
    // Home page
    title: 'Banco de Preguntas',
    subtitle: 'Preguntas de matemáticas SAT, PSAT/NMSQT y PSAT 8/9 con retroalimentación inmediata y modo simulación.',
    configure: 'Configura tu práctica',
    exam: 'Examen',
    difficulty: 'Dificultad',
    domain: 'Dominio',
    all: 'Todos',
    allDomains: 'Todos los dominios',
    easy: 'Fácil',
    medium: 'Media',
    hard: 'Difícil',
    mixed: 'Mixto',
    mixedDesc: 'Preguntas de todos los niveles de dificultad.',
    algebra: 'Álgebra',
    advancedMath: 'Matemáticas Avanzadas',
    problemSolving: 'Resolución de Problemas y Análisis de Datos',
    geometry: 'Geometría y Trigonometría',
    freeMode: 'Modo Práctica',
    simulation: 'Simulación ({count} preguntas)',
    satCount: '{count} preguntas SAT',
    psat10Count: '{count} PSAT/NMSQT 10',
    psat89Count: '{count} PSAT 8/9',
    language: 'Idioma',
    practiceNav: 'Práctica',
    simulationNav: 'Simulación',
    historyNav: 'Historial',
    langDisclaimer: 'Las traducciones al español son asistidas por máquina y revisadas con QA. La notación matemática y algunos términos oficiales pueden seguir la forma original.',
    questionLanguageNotice: 'Las preguntas se muestran en español, mientras que la notación matemática y algunas etiquetas se mantienen en su forma original.',

    // Free mode
    freeModeTitle: 'Modo Práctica',
    answered: 'Respondidas',
    correct: 'Correctas',
    accuracy: 'Precisión',

    // Simulation
    simTitle: 'Modo Simulación',
    simSubtitle: '{count} preguntas con cronómetro. Los resultados se guardan.',
    yourName: 'Tu nombre',
    namePlaceholder: 'ej. María García',
    questionsAvail: 'disponibles',
    needMin: '(mínimo {count} requeridas)',
    startSim: 'Iniciar Simulación',
    cancel: 'Cancelar',
    questionOf: '{name} — Pregunta {current} de {total}',
    results: 'Resultados',
    simCompleted: 'Simulación completada por {name}',
    correctLabel: 'Correctas',
    incorrect: 'Incorrectas',
    skipped: 'Saltadas',
    time: 'Tiempo',
    byDomain: 'Por Dominio',
    byDifficulty: 'Por Dificultad',
    newSim: 'Nueva Simulación',
    viewHistory: 'Ver Historial',
    home: 'Inicio',

    // History
    historyTitle: 'Historial de Simulaciones',
    passwordRequired: 'Ingresa la contraseña para ver el historial de simulaciones.',
    password: 'Contraseña',
    passwordPlaceholder: 'Ingresa la contraseña',
    access: 'Acceder',
    wrongPassword: 'Contraseña incorrecta',
    confirmDelete: '¿Eliminar todo el historial de simulaciones?',
    deleteAll: 'Eliminar Todo',
    noHistory: 'Aún no hay historial de simulaciones.',

    // QuestionCard
    multipleChoice: 'Opción Múltiple',
    shortAnswer: 'Respuesta Corta',
    verify: 'Verificar Respuesta',
    skip: 'Saltar',
    nextQuestion: 'Siguiente Pregunta',

    // Common
    back: 'Volver',
    loading: 'Cargando...',
    noQuestions: 'No hay preguntas disponibles',
    noQuestionsDesc: 'No se encontraron preguntas con los filtros seleccionados.',
  },
}

type Translations = typeof translations.en
type TranslationFn = (params?: Record<string, string | number>) => string
type TranslationObject = { [K in keyof Translations]: TranslationFn } & Record<string, TranslationFn>

interface I18nContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: TranslationObject
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'en' || saved === 'es') setLangState(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const makeT = (obj: Translations): TranslationObject => {
    const result = {} as TranslationObject
    for (const key of Object.keys(obj) as (keyof Translations)[]) {
      const template: string = obj[key]
      result[key] = ((params?: Record<string, string | number>): string => {
        if (!params) return template
        let out: string = template
        for (const [k, v] of Object.entries(params)) {
          out = out.replace(`{${k}}`, String(v))
        }
        return out
      }) as TranslationFn
    }
    return result
  }

  const t = makeT(translations[lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
