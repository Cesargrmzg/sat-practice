import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { parse, NodeType } = require('next/dist/compiled/node-html-parser')

const PLACEHOLDER_PATTERN = /\[\[\[[A-Z0-9_.-]+\]\]\]/i
const NOTRANSLATE_PATTERN = /class=["']notranslate["']/i
const PROTECTED_TAGS = new Set(['math', 'svg', 'style', 'script', 'noscript'])
const ENGLISH_LEAK_PATTERNS = [
  /\bChoice [A-D]\b/i,
  /\bThe correct answer is\b/i,
  /\bThe function\b/i,
  /\bWhat is the value of\b/i,
  /\bFor what value of\b/i,
  /\bWhich equation defines\b/i,
  /\bis defined by\b/i,
  /\bMoving from left to right\b/i,
  /\bThe graph of\b/i,
  /\bThe table shows\b/i,
  /\bThe line passes\b/i,
  /\bThe curve passes\b/i,
  /\bThe line\b/i,
  /\bThe curve\b/i,
  /\bThe parabola\b/i,
  /\bline of best fit\b/i,
  /\bdata points\b/i,
  /\bfeet\b/i,
  /\binches\b/i,
  /\byards?\b/i,
  /\bquarts?\b/i,
  /\bseconds?\b/i,
  /\bminutes?\b/i,
  /\bNonlinear functions\b/i,
  /\bLinear functions\b/i,
]

const AWKWARD_SPANISH_PATTERNS = [
  /\b[Ee]l gr[aá]fica\b/,
  /fabricante de fabricar/i,
  /alquilar la tienda\b/i,
  /tienda de campaña/i,
  /pista elevada de una pista de canicas/i,
  /veh[ií]culo utilitario deportivo/i,
  /\bcamiseta\b/i,
]

const MATH_TEXT_ENGLISH_LEAKS = new Set([
  'and',
  'use',
  'in',
  'of',
  'yard',
  'yards',
  'foot',
  'feet',
  'inch',
  'inches',
  'mile',
  'miles',
  'nautical mile',
  'meter',
  'meters',
  'centimeter',
  'centimeters',
  'millimeter',
  'millimeters',
  'kilometer',
  'kilometers',
  'kilogram',
  'kilograms',
  'kilograms (kg)',
  'gram',
  'grams',
  'milligram',
  'milligrams',
  'milliliter',
  'milliliters',
  'pound',
  'pounds',
  'ounce',
  'ounces',
  'fluid ounces',
  'teaspoon',
  'teaspoons',
  'tablespoon',
  'tablespoons',
  'cup',
  'cups',
  'quart',
  'quarts',
  'hour',
  'hours',
  'minute',
  'minutes',
  'second',
  'seconds',
  'degrees',
  'degrees fahrenheit',
  'degrees celsius',
  'square foot',
  'square feet',
  'square inch',
  'square inches',
  'square yard',
  'square yards',
  'square mile',
  'square miles',
  'square meter',
  'square meters',
  'square centimeter',
  'square centimeters',
  'cubic meter',
  'cubic meters',
  'cubic centimeter',
  'cubic centimeters',
  'feet per minute',
  'miles per hour',
  'miles per minute squared',
  'revolutions per minute',
  'pounds per square inch',
  'second squared',
  'seconds squared',
  'minute squared',
  'feet tall',
  'feet long',
  'in square feet',
  'in square centimeters',
  'in meters',
  'in centimeters',
  'in millimeters',
  'in degrees fahrenheit',
  'in degrees celsius',
  'in miles per minute squared',
  'in cm',
  'in mm',
  'in mg',
  'in rpm',
  'profit',
  'revenue',
  'total revenue',
  'expenses',
  'total expenses',
  'people',
  'items',
  'length',
  'width',
  'posters',
  'raccoons',
  'cherries',
  'furlong',
  'furlongs',
  'fathom',
  'fathoms',
  'rod',
  'rods',
  'dollar',
  'dollars',
  'volt',
  'volts',
  'quettagram',
  'quettagrams',
])

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function getFragments(question) {
  const optionFragments = (question.answer_options ?? []).map(option => option.content)
  return [question.stem, question.rationale, question.skill_desc, ...optionFragments].filter(Boolean)
}

function getClassNames(node) {
  const classAttr = node.getAttribute?.('class') ?? ''
  return classAttr.split(/\s+/).filter(Boolean)
}

function isProtectedNode(node, insideProtected = false) {
  if (insideProtected) return true
  if (node.nodeType === NodeType.TEXT_NODE) return false

  const tag = (node.rawTagName || '').toLowerCase()
  if (PROTECTED_TAGS.has(tag)) return true
  return false
}

function collectVisibleText(node, parts, insideProtected = false) {
  const protectedHere = isProtectedNode(node, insideProtected)

  if (node.nodeType === NodeType.TEXT_NODE) {
    if (!protectedHere) {
      parts.push(node.rawText)
    }
    return
  }

  if (protectedHere) return

  for (const child of node.childNodes || []) {
    collectVisibleText(child, parts, protectedHere)
  }
}

function getVisibleText(fragment) {
  const root = parse(`<div data-root="1">${fragment}</div>`)
  const wrapper = root.querySelector('div[data-root="1"]')
  const parts = []
  collectVisibleText(wrapper, parts)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function normalizeMathText(text) {
  return text
    .replace(/[\s\u00a0]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^[([{]+/, '')
    .replace(/[).,:;!?\]]+$/, '')
}

function isMtextNode(node) {
  return node.nodeType === NodeType.ELEMENT_NODE && (node.rawTagName || '').toLowerCase() === 'mtext'
}

function isWhitespaceMathSeparator(node) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return normalizeMathText(node.rawText) === ''
  }

  if (node.nodeType !== NodeType.ELEMENT_NODE) {
    return false
  }

  return (node.rawTagName || '').toLowerCase() === 'mo' && normalizeMathText(node.text) === ''
}

function collectMathTextRuns(node, runs) {
  if (node.nodeType === NodeType.TEXT_NODE) {
    return
  }

  const childNodes = node.childNodes || []
  for (const child of childNodes) {
    collectMathTextRuns(child, runs)
  }

  for (let index = 0; index < childNodes.length; index += 1) {
    const child = childNodes[index]
    if (!isMtextNode(child)) {
      continue
    }

    let phrase = normalizeMathText(child.text)
    if (phrase) {
      runs.add(phrase)
    }

    let cursor = index
    while (
      cursor + 2 < childNodes.length &&
      isWhitespaceMathSeparator(childNodes[cursor + 1]) &&
      isMtextNode(childNodes[cursor + 2])
    ) {
      const next = normalizeMathText(childNodes[cursor + 2].text)
      if (next) {
        phrase = phrase ? `${phrase} ${next}` : next
        runs.add(phrase)
      }
      cursor += 2
    }
  }
}

function getMathTextRuns(fragment) {
  const root = parse(`<div data-root="1">${fragment}</div>`)
  const wrapper = root.querySelector('div[data-root="1"]')
  const runs = new Set()

  for (const mathNode of wrapper.querySelectorAll('math')) {
    collectMathTextRuns(mathNode, runs)
  }

  return [...runs]
}

function validateBank(name, questions, expectedCount) {
  const issues = []
  const seenIds = new Set()

  if (!Array.isArray(questions) || questions.length === 0) {
    issues.push(`${name}: bank is empty or not an array`)
    return issues
  }

  if (expectedCount != null && questions.length !== expectedCount) {
    issues.push(`${name}: expected ${expectedCount} questions but found ${questions.length}`)
  }

  questions.forEach((question, index) => {
    const label = `${name} question #${index + 1}`

    if (!question.external_id) {
      issues.push(`${label}: missing external_id`)
    } else if (seenIds.has(question.external_id)) {
      issues.push(`${label}: duplicate external_id ${question.external_id}`)
    } else {
      seenIds.add(question.external_id)
    }

    for (const fragment of getFragments(question)) {
      if (PLACEHOLDER_PATTERN.test(fragment)) {
        issues.push(`${label}: unresolved placeholder token found`)
        break
      }
      if (NOTRANSLATE_PATTERN.test(fragment)) {
        issues.push(`${label}: untranslated placeholder wrapper found`)
        break
      }
    }
  })

  return issues
}

function validateSpanishBank(spanishQuestions, englishQuestions) {
  const issues = []

  spanishQuestions.forEach((question, index) => {
    const english = englishQuestions[index]
    const label = `Spanish question #${index + 1}`

    if (!english || question.external_id !== english.external_id) {
      issues.push(`${label}: external_id does not match English source order`)
      return
    }

    if ((question.answer_options ?? []).length !== (english.answer_options ?? []).length) {
      issues.push(`${label}: answer option count does not match English source`)
    }

    for (const fragment of getFragments(question)) {
      const visibleText = getVisibleText(fragment)
      if (!visibleText) continue

      const englishLeak = ENGLISH_LEAK_PATTERNS.find(pattern => pattern.test(visibleText))
      if (englishLeak) {
        issues.push(`${label}: visible English text leak matched ${englishLeak}`)
        break
      }

      const awkwardSpanish = AWKWARD_SPANISH_PATTERNS.find(pattern => pattern.test(visibleText))
      if (awkwardSpanish) {
        issues.push(`${label}: awkward Spanish phrasing matched ${awkwardSpanish}`)
        break
      }

      const mathTextLeak = getMathTextRuns(fragment).find(text => MATH_TEXT_ENGLISH_LEAKS.has(text))
      if (mathTextLeak) {
        issues.push(`${label}: MathML English text leak matched "${mathTextLeak}"`)
        break
      }
    }
  })

  return issues
}

const englishPath = 'public/data/questions.json'
const englishQuestions = readJson(englishPath)
const issues = validateBank('English', englishQuestions)

const spanishPath = 'public/data/questions.es.json'
if (existsSync(spanishPath)) {
  const spanishQuestions = readJson(spanishPath)
  issues.push(...validateBank('Spanish', spanishQuestions, englishQuestions.length))
  issues.push(...validateSpanishBank(spanishQuestions, englishQuestions))
}

if (issues.length > 0) {
  console.error('Question bank validation failed:')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log('Question bank validation passed')
