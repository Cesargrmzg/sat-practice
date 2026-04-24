export interface Question {
  external_id: string
  type: 'mcq' | 'spr'
  domain: string
  domain_code: string
  skill_code: string
  skill_desc: string
  difficulty: 'E' | 'M' | 'H'
  stem: string
  answer_options: AnswerOption[] | null
  correct_answer: string[] | null
  rationale: string
  has_svg: number
  has_mathml: number
  assessment: string
  assessments: string[]
}

export interface AnswerOption {
  id: string
  content: string
}

export interface SimulationResult {
  id: string
  name: string
  date: string
  assessment: string
  difficulty: string
  totalQuestions: number
  correct: number
  incorrect: number
  skipped: number
  percentage: number
  questions: SimulationQuestion[]
  timeTaken: number
}

export interface SimulationQuestion {
  questionId: string
  domain: string
  difficulty: string
  type: string
  selectedAnswer: string | null
  correctAnswer: string[]
  isCorrect: boolean
  isSkipped: boolean
}

export type AppMode = 'free' | 'simulation'
export type Difficulty = 'E' | 'M' | 'H' | 'mixed'

export const DIFFICULTY_LABELS: Record<string, string> = {
  E: 'Fácil',
  M: 'Media',
  H: 'Difícil',
  mixed: 'Mixto',
}

export const DOMAIN_LABELS: Record<string, string> = {
  'Algebra': 'Álgebra',
  'Advanced Math': 'Matemáticas Avanzadas',
  'Problem-Solving and Data Analysis': 'Resolución de Problemas y Análisis de Datos',
  'Geometry and Trigonometry': 'Geometría y Trigonometría',
}

export const ASSESSMENT_LABELS: Record<string, string> = {
  SAT: 'SAT',
  PSAT10: 'PSAT/NMSQT 10',
  PSAT89: 'PSAT 8/9',
}

export const DIFFICULTY_WEIGHTS: Record<string, Record<string, number>> = {
  E: { E: 0.7, M: 0.2, H: 0.1 },
  M: { E: 0.15, M: 0.7, H: 0.15 },
  H: { E: 0.1, M: 0.2, H: 0.7 },
  mixed: { E: 0.33, M: 0.34, H: 0.33 },
}
