import { Question, Difficulty, DIFFICULTY_WEIGHTS } from './types'

export type Lang = 'en' | 'es'

const ENGLISH_QUESTION_FILE = '/data/questions.json'
const SPANISH_QUESTION_FILE = '/data/questions.es.json'
const SPANISH_QUESTION_BANK_ENABLED = false
const BROKEN_TRANSLATION_PATTERN = /\[\[\[[A-Z0-9_.-]+\]\]\]/i

const cachedQuestions: Partial<Record<Lang, Question[]>> = {}

function containsBrokenTranslationMarkup(fragment?: string | null): boolean {
  if (!fragment) return false
  return BROKEN_TRANSLATION_PATTERN.test(fragment) || fragment.includes('class="notranslate"')
}

function isQuestionBankSafe(questions: Question[]): boolean {
  return questions.every(question => {
    if (containsBrokenTranslationMarkup(question.stem)) return false
    if (containsBrokenTranslationMarkup(question.rationale)) return false
    return !(question.answer_options ?? []).some(option => containsBrokenTranslationMarkup(option.content))
  })
}

function normalizeMathMarkup(html: string): string {
  if (typeof document === 'undefined') return html

  const template = document.createElement('template')
  template.innerHTML = html

  const fencedNodes = Array.from(template.content.querySelectorAll('mfenced'))
  for (const node of fencedNodes) {
    const parent = node.parentNode
    if (!parent) continue

    const open = node.getAttribute('open') ?? '('
    const close = node.getAttribute('close') ?? ')'
    const doc = node.ownerDocument ?? document

    const openMo = doc.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo')
    openMo.textContent = open
    parent.insertBefore(openMo, node)

    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node)
    }

    const closeMo = doc.createElementNS('http://www.w3.org/1998/Math/MathML', 'mo')
    closeMo.textContent = close
    parent.insertBefore(closeMo, node)
    parent.removeChild(node)
  }

  return template.innerHTML
}

function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    stem: normalizeMathMarkup(question.stem),
    rationale: normalizeMathMarkup(question.rationale),
    answer_options: question.answer_options?.map(opt => ({
      ...opt,
      content: normalizeMathMarkup(opt.content),
    })) ?? null,
  }
}

function mergeQuestion(base: Question, overlay: Partial<Question>): Question {
  return {
    ...base,
    ...overlay,
    stem: normalizeMathMarkup(overlay.stem ?? base.stem),
    rationale: normalizeMathMarkup(overlay.rationale ?? base.rationale),
    skill_desc: overlay.skill_desc ?? base.skill_desc,
    answer_options: overlay.answer_options
      ? overlay.answer_options.map(opt => ({
          ...opt,
          content: normalizeMathMarkup(opt.content),
        }))
      : base.answer_options,
  }
}

async function fetchQuestions(lang: Lang): Promise<Question[]> {
  const file = lang === 'es' ? SPANISH_QUESTION_FILE : ENGLISH_QUESTION_FILE
  const res = await fetch(file)
  if (!res.ok) throw new Error(`Failed to load ${file}`)
  return await res.json()
}

export async function loadQuestions(lang: Lang = 'en'): Promise<Question[]> {
  if (cachedQuestions[lang]) return cachedQuestions[lang]!

  const english = cachedQuestions.en ?? (await fetchQuestions('en')).map(normalizeQuestion)
  cachedQuestions.en = english

  if (lang !== 'es' || !SPANISH_QUESTION_BANK_ENABLED) {
    cachedQuestions[lang] = english
    return english
  }

  try {
    const spanishRaw = await fetchQuestions('es')
    const spanish = spanishRaw.map(normalizeQuestion)
    if (!isQuestionBankSafe(spanish)) {
      throw new Error('Spanish question bank failed validation')
    }

    const spanishById = new Map(spanish.map(q => [q.external_id, q]))
    const merged = english.map(base => {
      const overlay = spanishById.get(base.external_id)
      return overlay ? mergeQuestion(base, overlay) : base
    })

    cachedQuestions.es = merged
    return merged
  } catch {
    cachedQuestions.es = english
    return english
  }
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

export function getDifficultyLabel(d: string, lang: Lang = 'es'): string {
  const map: Record<Lang, Record<string, string>> = {
    en: { E: 'Easy', M: 'Medium', H: 'Hard' },
    es: { E: 'Fácil', M: 'Media', H: 'Difícil' },
  }
  return map[lang][d] || d
}

export function getAssessmentLabel(assessment: string, lang: Lang = 'es'): string {
  const map: Record<Lang, Record<string, string>> = {
    en: {
      SAT: 'SAT',
      PSAT10: 'PSAT/NMSQT 10',
      PSAT89: 'PSAT 8/9',
    },
    es: {
      SAT: 'SAT',
      PSAT10: 'PSAT/NMSQT 10',
      PSAT89: 'PSAT 8/9',
    },
  }
  return map[lang][assessment] || assessment
}

export function getDomainLabel(domain: string, lang: Lang = 'es'): string {
  const map: Record<Lang, Record<string, string>> = {
    en: {
      'Algebra': 'Algebra',
      'Advanced Math': 'Advanced Math',
      'Problem-Solving and Data Analysis': 'Problem-Solving & Data Analysis',
      'Geometry and Trigonometry': 'Geometry & Trigonometry',
    },
    es: {
      'Algebra': 'Álgebra',
      'Advanced Math': 'Matemáticas Avanzadas',
      'Problem-Solving and Data Analysis': 'Resolución de Problemas y Análisis de Datos',
      'Geometry and Trigonometry': 'Geometría y Trigonometría',
    },
  }
  return map[lang][domain] || domain
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
