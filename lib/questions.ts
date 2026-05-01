import { Question, Difficulty, DIFFICULTY_WEIGHTS } from './types'

let cachedQuestions: Question[] | null = null

function normalizeMathText(text: string): string {
  return text
    .replace(/\(\s*negative\s+(\d+(?:\.\d+)?)\s+comma\s+([^\)]+?)\s*\)/gi, '(-$1, $2)')
    .replace(/\(\s*(\d+(?:\.\d+)?)\s+comma\s+([^\)]+?)\s*\)/gi, '($1, $2)')
    .replace(/\bnegative\s+(\d+(?:\.\d+)?)\s+comma\s+([\d.]+)\b/gi, '(-$1, $2)')
}

function normalizeHtmlContent(html: string): string {
  return normalizeMathText(html)
}

function normalizeQuestion(question: Question): Question {
  const normalizeOption = (opt: { id: string; content: string }) => ({
    ...opt,
    content: normalizeHtmlContent(opt.content),
  })

  return {
    ...question,
    stem: normalizeHtmlContent(question.stem),
    rationale: normalizeHtmlContent(question.rationale),
    answer_options: question.answer_options?.map(normalizeOption) ?? null,
  }
}

export async function loadQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions
  
  const res = await fetch('/data/questions.json')
  const data: Question[] = await res.json()
  cachedQuestions = data.map(normalizeQuestion)
  return cachedQuestions
}

export function filterQuestions(
  questions: Question[],
  assessment: string,
  difficulty: Difficulty,
  domain?: string
): Question[] {
  let filtered = questions

  // Filter by assessment
  if (assessment !== 'all') {
    filtered = filtered.filter(q => q.assessments.includes(assessment))
  }

  // Filter by domain
  if (domain && domain !== 'all') {
    filtered = filtered.filter(q => q.domain === domain)
  }

  // Filter by difficulty (not for mixed)
  if (difficulty !== 'mixed') {
    filtered = filtered.filter(q => q.difficulty === difficulty)
  }

  return filtered
}

export function selectWeightedQuestions(
  questions: Question[],
  difficulty: Difficulty,
  count: number
): Question[] {
  if (difficulty === 'mixed') {
    return shuffleArray(questions).slice(0, count)
  }

  const weights = DIFFICULTY_WEIGHTS[difficulty]
  const byDifficulty: Record<string, Question[]> = { E: [], M: [], H: [] }
  
  for (const q of questions) {
    byDifficulty[q.difficulty]?.push(q)
  }

  const result: Question[] = []
  const targetE = Math.round(count * weights.E)
  const targetM = Math.round(count * weights.M)
  const targetH = count - targetE - targetM

  const pickN = (arr: Question[], n: number) => shuffleArray(arr).slice(0, n)

  result.push(...pickN(byDifficulty.E, Math.min(targetE, byDifficulty.E.length)))
  result.push(...pickN(byDifficulty.M, Math.min(targetM, byDifficulty.M.length)))
  result.push(...pickN(byDifficulty.H, Math.min(targetH, byDifficulty.H.length)))

  // Fill remaining slots if some pools were too small
  const remaining = count - result.length
  if (remaining > 0) {
    const usedIds = new Set(result.map(q => q.external_id))
    const unused = questions.filter(q => !usedIds.has(q.external_id))
    result.push(...shuffleArray(unused).slice(0, remaining))
  }

  return shuffleArray(result).slice(0, count)
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getRandomQuestion(questions: Question[]): Question {
  return questions[Math.floor(Math.random() * questions.length)]
}

export function getDifficultyLabel(d: string): string {
  const map: Record<string, string> = { E: 'Fácil', M: 'Media', H: 'Difícil' }
  return map[d] || d
}

export function getDifficultyColor(d: string): string {
  const map: Record<string, string> = { 
    E: 'badge-green', 
    M: 'badge-orange', 
    H: 'badge-red' 
  }
  return map[d] || 'badge-gray'
}

export function getDomainShort(domain: string): string {
  const map: Record<string, string> = {
    'Algebra': 'ALG',
    'Advanced Math': 'AM',
    'Problem-Solving and Data Analysis': 'PSDA',
    'Geometry and Trigonometry': 'GEO',
  }
  return map[domain] || domain.slice(0, 3).toUpperCase()
}
