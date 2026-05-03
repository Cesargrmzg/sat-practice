import { existsSync, readFileSync } from 'node:fs'

const PLACEHOLDER_PATTERN = /\[\[\[[A-Z0-9_.-]+\]\]\]/i
const NOTRANSLATE_PATTERN = /class=["']notranslate["']/i

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function getFragments(question) {
  const optionFragments = (question.answer_options ?? []).map(option => option.content)
  return [question.stem, question.rationale, ...optionFragments].filter(Boolean)
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

const englishPath = 'public/data/questions.json'
const englishQuestions = readJson(englishPath)
const issues = validateBank('English', englishQuestions)

const spanishPath = 'public/data/questions.es.json'
if (existsSync(spanishPath)) {
  const spanishQuestions = readJson(spanishPath)
  issues.push(...validateBank('Spanish', spanishQuestions, englishQuestions.length))
}

if (issues.length > 0) {
  console.error('Question bank validation failed:')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log('Question bank validation passed')
