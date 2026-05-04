import { createRequire } from 'node:module'
import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const { parse, NodeType } = require('next/dist/compiled/node-html-parser')

const SOURCE_PATH = 'public/data/questions.json'
const OUTPUT_PATH = 'public/data/questions.es.json'
const TEMP_OUTPUT_PATH = `${OUTPUT_PATH}.tmp`
const CACHE_PATH = '.questions.es.translation-cache.json'
const PROTECTED_TAGS = new Set(['math', 'svg', 'style', 'script', 'noscript'])
const TRANSLATABLE_ATTRS = ['aria-label', 'alt', 'title']
const MAX_BATCH_ITEMS = 40
const MAX_BATCH_CHARS = 4500
const MAX_RETRIES = 4

const SOURCE_OVERRIDES = new Map([
  ['Linear functions', 'Funciones lineales'],
  ['Nonlinear functions', 'Funciones no lineales'],
  ['Equivalent expressions', 'Expresiones equivalentes'],
  ['Percentages', 'Porcentajes'],
  ['Area and volume', 'Área y volumen'],
  ['Lines, angles, and triangles', 'Rectas, ángulos y triángulos'],
  ['Right triangles and trigonometry', 'Triángulos rectángulos y trigonometría'],
  ['Probability and conditional probability', 'Probabilidad y probabilidad condicional'],
  ['Linear equations in one variable', 'Ecuaciones lineales en una variable'],
  ['Linear equations in two variables', 'Ecuaciones lineales en dos variables'],
  ['Linear inequalities in one or two variables', 'Desigualdades lineales en una o dos variables'],
  ['Systems of two linear equations in two variables', 'Sistemas de dos ecuaciones lineales en dos variables'],
  ['Nonlinear equations in one variable and systems of equations in two variables', 'Ecuaciones no lineales en una variable y sistemas de ecuaciones en dos variables'],
  ['Ratios, rates, proportional relationships, and units', 'Razones, tasas, relaciones proporcionales y unidades'],
  ['One-variable data: Distributions and measures of center and spread', 'Datos de una variable: distribuciones y medidas de centro y dispersión'],
  ['Two-variable data: Models and scatterplots', 'Datos de dos variables: modelos y diagramas de dispersión'],
  ['Inference from sample statistics and margin of error', 'Inferencia a partir de estadísticas muestrales y margen de error'],
  ['Circles', 'Círculos'],
  ['x', 'x'],
  ['y', 'y'],
  ['xy', 'xy'],
  ['A', 'A'],
  ['B', 'B'],
  ['C', 'C'],
  ['D', 'D'],
  ['I', 'I'],
  ['II', 'II'],
  ['For the first curve:', 'Para la primera curva:'],
  ['For the second curve:', 'Para la segunda curva:'],
  ['For the curve in the system:', 'Para la curva del sistema:'],
  ['For the parabola in the system:', 'Para la parábola del sistema:'],
  ['The graph shown will be translated up [[N0]] units. Which of the following will be the resulting graph?', 'La gráfica mostrada se trasladará [[N0]] unidades hacia arriba. ¿Cuál de las siguientes será la gráfica resultante?'],
  ['The cost [[N0]], in dollars, for a manufacturer to make [[N1]] rings is represented by the line shown.', 'La línea mostrada representa el costo [[N0]], en dólares, de fabricar [[N1]] anillos.'],
  ['What is the cost, in dollars, for the manufacturer to make [[N0]] rings?', '¿Cuál es el costo, en dólares, de fabricar [[N0]] anillos?'],
  ['The graph shows the predicted value [[N0]], in dollars, of a certain sport utility vehicle [[N1]] years after it is first purchased.', 'La gráfica muestra el valor estimado [[N0]], en dólares, de cierto SUV [[N1]] años después de su compra.'],
  ['Which of the following is closest to the predicted value of the sport utility vehicle [[N0]] years after it is first purchased?', '¿Cuál de las siguientes opciones es la más cercana al valor estimado del SUV [[N0]] años después de su compra?'],
  ['Sean rents a tent at a cost of [[N0]] per day plus a onetime insurance fee of [[N1]]. Which equation represents the total cost [[N2]], in dollars, to rent the tent with insurance for [[N3]] days?', 'Sean alquila una carpa a un costo de [[N0]] por día, más una tarifa única de seguro de [[N1]]. ¿Qué ecuación representa el costo total [[N2]], en dólares, de alquilar la carpa con seguro durante [[N3]] días?'],
  ["The graph shows a marble's height above the ground [[N0]], in inches, [[N1]] seconds after it started moving on an elevated track of a marble run. Which of the following is the best interpretation of the [[N2]]-intercept of the graph?", 'La gráfica muestra la altura de una canica sobre el suelo [[N0]], en pulgadas, [[N1]] segundos después de que empezó a moverse en una pista elevada para canicas. ¿Cuál de las siguientes opciones es la mejor interpretación de la intersección con el eje [[N2]] de la gráfica?'],
  ['Moving from left to right:', 'De izquierda a derecha:'],
  ['Moving from left to right:[[N0]]\n[[N1]]', 'De izquierda a derecha:[[N0]]\n[[N1]]'],
  ['Moving from left to right:\n[[N0]]', 'De izquierda a derecha:\n[[N0]]'],
])

const MATH_TEXT_TRANSLATIONS = new Map([
  ['and', 'y'],
  ['use', 'usa'],
  ['in', 'en'],
  ['of', 'de'],
  ['yard', 'yarda'],
  ['yards', 'yardas'],
  ['foot', 'pie'],
  ['feet', 'pies'],
  ['inch', 'pulgada'],
  ['inches', 'pulgadas'],
  ['mile', 'milla'],
  ['miles', 'millas'],
  ['nautical mile', 'milla náutica'],
  ['meter', 'metro'],
  ['meters', 'metros'],
  ['centimeter', 'centímetro'],
  ['centimeters', 'centímetros'],
  ['millimeter', 'milímetro'],
  ['millimeters', 'milímetros'],
  ['kilometer', 'kilómetro'],
  ['kilometers', 'kilómetros'],
  ['kilogram', 'kilogramo'],
  ['kilograms', 'kilogramos'],
  ['kilograms (kg)', 'kilogramos (kg)'],
  ['gram', 'gramo'],
  ['grams', 'gramos'],
  ['milligram', 'miligramo'],
  ['milligrams', 'miligramos'],
  ['milliliter', 'mililitro'],
  ['milliliters', 'mililitros'],
  ['pound', 'libra'],
  ['pounds', 'libras'],
  ['ounce', 'onza'],
  ['ounces', 'onzas'],
  ['fluid ounces', 'onzas líquidas'],
  ['teaspoon', 'cucharadita'],
  ['teaspoons', 'cucharaditas'],
  ['tablespoon', 'cucharada'],
  ['tablespoons', 'cucharadas'],
  ['cup', 'taza'],
  ['cups', 'tazas'],
  ['quart', 'cuarto'],
  ['quarts', 'cuartos'],
  ['hour', 'hora'],
  ['hours', 'horas'],
  ['minute', 'minuto'],
  ['minutes', 'minutos'],
  ['second', 'segundo'],
  ['seconds', 'segundos'],
  ['degrees', 'grados'],
  ['fahrenheit', 'Fahrenheit'],
  ['celsius', 'Celsius'],
  ['degrees fahrenheit', 'grados Fahrenheit'],
  ['degrees celsius', 'grados Celsius'],
  ['square foot', 'pie cuadrado'],
  ['square feet', 'pies cuadrados'],
  ['square inch', 'pulgada cuadrada'],
  ['square inches', 'pulgadas cuadradas'],
  ['square yard', 'yarda cuadrada'],
  ['square yards', 'yardas cuadradas'],
  ['square mile', 'milla cuadrada'],
  ['square miles', 'millas cuadradas'],
  ['square meter', 'metro cuadrado'],
  ['square meters', 'metros cuadrados'],
  ['square centimeter', 'centímetro cuadrado'],
  ['square centimeters', 'centímetros cuadrados'],
  ['cubic meter', 'metro cúbico'],
  ['cubic meters', 'metros cúbicos'],
  ['cubic centimeter', 'centímetro cúbico'],
  ['cubic centimeters', 'centímetros cúbicos'],
  ['feet per minute', 'pies por minuto'],
  ['miles per hour', 'millas por hora'],
  ['miles per minute squared', 'millas por minuto cuadrado'],
  ['revolutions per minute', 'revoluciones por minuto'],
  ['pounds per square inch', 'libras por pulgada cuadrada'],
  ['second squared', 'segundo cuadrado'],
  ['seconds squared', 'segundos cuadrados'],
  ['minute squared', 'minuto cuadrado'],
  ['feet tall', 'pies de alto'],
  ['feet long', 'pies de largo'],
  ['in square feet', 'en pies cuadrados'],
  ['in square centimeters', 'en centímetros cuadrados'],
  ['in meters', 'en metros'],
  ['in centimeters', 'en centímetros'],
  ['in millimeters', 'en milímetros'],
  ['in degrees fahrenheit', 'en grados Fahrenheit'],
  ['in degrees celsius', 'en grados Celsius'],
  ['in miles per minute squared', 'en millas por minuto cuadrado'],
  ['in cm', 'en cm'],
  ['in mm', 'en mm'],
  ['in mg', 'en mg'],
  ['in rpm', 'en rpm'],
  ['profit', 'ganancia'],
  ['revenue', 'ingresos'],
  ['total revenue', 'ingresos totales'],
  ['expenses', 'gastos'],
  ['total expenses', 'gastos totales'],
  ['people', 'personas'],
  ['items', 'artículos'],
  ['length', 'largo'],
  ['width', 'ancho'],
  ['posters', 'carteles'],
  ['raccoons', 'mapaches'],
  ['cherries', 'cerezas'],
  ['furlong', 'estadio'],
  ['furlongs', 'estadios'],
  ['fathom', 'braza'],
  ['fathoms', 'brazas'],
  ['rod', 'vara'],
  ['rods', 'varas'],
  ['dollar', 'dólar'],
  ['dollars', 'dólares'],
  ['volt', 'voltio'],
  ['volts', 'voltios'],
  ['quettagram', 'quettagramo'],
  ['quettagrams', 'quettagramos'],
])

function hasLetters(text) {
  return /[A-Za-z]/.test(text)
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

function collectTemplates(node, templates, insideProtected = false) {
  if (node.nodeType === NodeType.TEXT_NODE) return

  const protectedHere = isProtectedNode(node, insideProtected)

  for (const attr of TRANSLATABLE_ATTRS) {
    const value = node.getAttribute?.(attr)
    if (value && hasLetters(value)) {
      templates.add(value)
    }
  }

  if (protectedHere) return

  for (const child of node.childNodes || []) {
    collectTemplates(child, templates, protectedHere)
  }

  const childNodes = node.childNodes || []
  if (childNodes.length === 0) return

  let template = ''
  let placeholderIndex = 0
  let hasTranslatableText = false

  for (const child of childNodes) {
    if (child.nodeType === NodeType.TEXT_NODE) {
      template += child.rawText
      if (hasLetters(child.rawText)) {
        hasTranslatableText = true
      }
      continue
    }

    template += `[[N${placeholderIndex++}]]`
  }

  if (hasTranslatableText) {
    templates.add(template)
  }
}

function restorePlaceholders(text, replacements) {
  let restored = text
  for (const [token, value] of replacements) {
    restored = restored.split(token).join(value)
  }
  return restored
}

function postEditTranslation(text) {
  return text
    .replace(/\s+([,.;:?])/g, '$1')
    .replace(/\b[Ee]l gr[aá]fica mostrada\b/g, 'La gráfica mostrada')
    .replace(/\b[Dd]el gr[aá]fica mostrada\b/g, 'de la gráfica mostrada')
    .replace(/\b[Aa]l gr[aá]fica mostrada\b/g, 'a la gráfica mostrada')
    .replace(/\b[Pp]ara el gr[aá]fica mostrada\b/g, 'para la gráfica mostrada')
    .replace(/\b[Ee]n el gr[aá]fica mostrada\b/g, 'en la gráfica mostrada')
    .replace(/\b[Ss]i el gr[aá]fica mostrada\b/g, 'si la gráfica mostrada')
    .replace(/\b[Ee]l gr[aá]fica\b/g, 'La gráfica')
    .replace(/\b[Dd]el gr[aá]fica\b/g, 'de la gráfica')
    .replace(/\b[Aa]l gr[aá]fica\b/g, 'a la gráfica')
    .replace(/\b[Pp]ara el gr[aá]fica\b/g, 'para la gráfica')
    .replace(/\b[Ee]n el gr[aá]fica\b/g, 'en la gráfica')
    .replace(/\b[Ss]i el gr[aá]fica\b/g, 'si la gráfica')
    .replace(/\buna ecuación del gr[aá]fica\b/gi, 'una ecuación de la gráfica')
    .replace(/\bque el gr[aá]fica\b/gi, 'que la gráfica')
    .replace(/\[\[N(\d+)\]\]-intercepto/gi, 'intersección con el eje [[N$1]]')
    .replace(/\[\[N(\d+)\]\]-intersección/gi, 'intersección con el eje [[N$1]]')
    .replace(/intercepto\s+\[\[N(\d+)\]\]/gi, 'intersección con el eje [[N$1]]')
    .replace(/intersección\s+\[\[N(\d+)\]\]/gi, 'intersección con el eje [[N$1]]')
    .replace(/\[\[N(\d+)\]\]-axis/gi, 'eje [[N$1]]')
    .replace(/\[\[N(\d+)\]\]-plane/gi, 'plano [[N$1]]')
    .replace(/cruza el eje\s+\[\[N(\d+)\]\]/gi, 'cruza el eje [[N$1]]')
    .replace(/intersecta el eje\s+\[\[N(\d+)\]\]/gi, 'interseca el eje [[N$1]]')
    .replace(/plano\s+\[\[N(\d+)\]\]/gi, 'plano [[N$1]]')
    .replace(/\bintersecta\b/gi, 'interseca')
    .replace(/\bintersectan\b/gi, 'intersecan')
    .replaceAll('Se da que', 'Se sabe que')
    .replaceAll('Se da por hecho que', 'Se sabe que')
    .replaceAll('Se da por sentado que', 'Se sabe que')
    .replaceAll('Tambien se da que', 'Tambien se sabe que')
    .replaceAll('También se da que', 'También se sabe que')
    .replaceAll('Tambien se da por hecho que', 'Tambien se sabe que')
    .replaceAll('También se da por hecho que', 'También se sabe que')
    .replaceAll('Debido a que se muestra la grafica de', 'Como se muestra la grafica de')
    .replaceAll('Debido a que se muestra la gráfica de', 'Como se muestra la gráfica de')
    .replaceAll('Moviéndose de izquierda a derecha:', 'De izquierda a derecha:')
    .replaceAll('Moviendo de izquierda a derecha:', 'De izquierda a derecha:')
    .replaceAll('Tenga en cuenta', 'Ten en cuenta')
    .replaceAll('tienda de campaña', 'carpa')
    .replaceAll('alquilar la tienda', 'alquilar la carpa')
    .replaceAll('alquiler de la tienda', 'alquiler de la carpa')
    .replaceAll('alquilar la tienda con seguro', 'alquilar la carpa con seguro')
    .replaceAll('de alquilar la tienda', 'de alquilar la carpa')
    .replaceAll('la tienda si la tarifa', 'la carpa si la tarifa')
    .replaceAll('vehículo utilitario deportivo', 'SUV')
    .replaceAll('después de su primera compra', 'después de su compra')
    .replaceAll('cuando se compra por primera vez', 'cuando se compra')
    .replaceAll('camiseta', 'camisa')
    .replaceAll('pista elevada de una pista de canicas', 'pista elevada para canicas')
    .replaceAll('para un fabricante de fabricar', 'de fabricar')
    .replaceAll('para el fabricante de fabricar', 'de fabricar')
    .replaceAll('para que un fabricante fabrique', 'de fabricar')
    .replaceAll('Esto es lo más cercano al valor previsto', 'Este valor es el más cercano al valor estimado')
    .replaceAll('es el más cercano al valor previsto', 'es el más cercano al valor estimado')
    .replace(/¿Para que valor de ([\s\S]+?) vale ([\s\S]+?)\?/g, '¿Para que valor de $1 se cumple $2?')
    .replace(/¿Para qué valor de ([\s\S]+?) vale ([\s\S]+?)\?/g, '¿Para qué valor de $1 se cumple $2?')
    .replace(/coordenada <em>y<\/em> de la interseccion <em>y<\/em>/g, 'coordenada <em>y</em> de la interseccion con el eje <em>y</em>')
    .replace(/coordenada <em>y<\/em> de la intersección <em>y<\/em>/g, 'coordenada <em>y</em> de la intersección con el eje <em>y</em>')
}

function normalizeMathText(text) {
  return text.replace(/[\s\u00a0]+/g, ' ').trim().toLowerCase()
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

function applyInitialCapitalization(source, translated) {
  const trimmedSource = source.trim()
  if (!trimmedSource) return translated

  const firstChar = trimmedSource[0]
  if (firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase()) {
    return translated[0].toUpperCase() + translated.slice(1)
  }

  return translated
}

function preserveEdgeWhitespace(startText, endText, translated) {
  const leading = startText.match(/^[\s\u00a0]*/)?.[0] ?? ''
  const trailing = endText.match(/[\s\u00a0]*$/)?.[0] ?? ''
  return `${leading}${translated}${trailing}`
}

function findMathTextTranslation(text) {
  const normalized = normalizeMathText(text)
  if (!normalized) return null

  const direct = MATH_TEXT_TRANSLATIONS.get(normalized)
  if (direct) {
    return direct
  }

  const prefix = normalized.match(/^[([{]+/)?.[0] ?? ''
  const suffix = normalized.match(/[).,:;!?\]]+$/)?.[0] ?? ''
  const core = normalized.slice(prefix.length, normalized.length - suffix.length)
  if (!core || (!prefix && !suffix)) {
    return null
  }

  const translatedCore = MATH_TEXT_TRANSLATIONS.get(core)
  return translatedCore ? `${prefix}${translatedCore}${suffix}` : null
}

function collapseMathTextRuns(node) {
  let index = 0

  while (index < (node.childNodes || []).length) {
    const childNodes = node.childNodes || []
    const child = childNodes[index]
    if (!isMtextNode(child)) {
      index += 1
      continue
    }

    const sequenceNodes = [child]
    const mtextNodes = [child]
    let cursor = index

    while (
      cursor + 2 < childNodes.length &&
      isWhitespaceMathSeparator(childNodes[cursor + 1]) &&
      isMtextNode(childNodes[cursor + 2])
    ) {
      sequenceNodes.push(childNodes[cursor + 1], childNodes[cursor + 2])
      mtextNodes.push(childNodes[cursor + 2])
      cursor += 2
    }

    let collapsed = false
    for (let count = mtextNodes.length; count > 1; count -= 1) {
      const candidateNodes = mtextNodes.slice(0, count)
      const translation = findMathTextTranslation(candidateNodes.map(item => item.text).join(' '))
      if (!translation) {
        continue
      }

      const firstNode = candidateNodes[0]
      const lastNode = candidateNodes[candidateNodes.length - 1]
      const translatedText = preserveEdgeWhitespace(
        firstNode.text,
        lastNode.text,
        applyInitialCapitalization(firstNode.text, translation)
      )

      firstNode.set_content(translatedText)
      for (const candidate of sequenceNodes.slice(1, count * 2 - 1)) {
        node.removeChild(candidate)
      }

      collapsed = true
      break
    }

    index += collapsed ? 1 : 1
  }
}

function localizeMathTextNodes(root) {
  for (const mathNode of root.querySelectorAll('math')) {
    const descendants = [mathNode, ...mathNode.querySelectorAll('*')]
    for (const element of descendants) {
      collapseMathTextRuns(element)
    }

    for (const mtextNode of mathNode.querySelectorAll('mtext')) {
      const translation = findMathTextTranslation(mtextNode.text)
      if (!translation) {
        continue
      }

      mtextNode.set_content(
        preserveEdgeWhitespace(
          mtextNode.text,
          mtextNode.text,
          applyInitialCapitalization(mtextNode.text, translation)
        )
      )
    }
  }
}

async function translatePayload(payload) {
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'en')
  url.searchParams.set('tl', 'es')
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', payload)

  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      return data[0].map(part => part[0]).join('')
    } catch (error) {
      lastError = error
      if (attempt === MAX_RETRIES) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 1000))
    }
  }

  throw lastError
}

function splitIntoBatches(entries) {
  const batches = []
  let current = []
  let currentChars = 0

  for (const entry of entries) {
    const estimatedChars = entry.length + 40
    const wouldOverflow = current.length >= MAX_BATCH_ITEMS || currentChars + estimatedChars > MAX_BATCH_CHARS
    if (current.length > 0 && wouldOverflow) {
      batches.push(current)
      current = []
      currentChars = 0
    }
    current.push(entry)
    currentChars += estimatedChars
  }

  if (current.length > 0) {
    batches.push(current)
  }

  return batches
}

function parseBatchTranslation(translated, expectedSize) {
  const matches = [...translated.matchAll(/\[\[\[SEG_(\d+)\]\]\]([\s\S]*?)\[\[\[END_\1\]\]\]/g)]
  if (matches.length !== expectedSize) {
    throw new Error(`Batch parse mismatch: expected ${expectedSize}, got ${matches.length}`)
  }

  return matches
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map(match => postEditTranslation(match[2]))
}

async function translateBatch(entries) {
  const payload = entries
    .map((entry, index) => `[[[SEG_${index}]]]${entry}[[[END_${index}]]]`)
    .join('\n')

  try {
    const translated = await translatePayload(payload)
    return parseBatchTranslation(translated, entries.length)
  } catch (error) {
    if (entries.length === 1) {
      throw error
    }

    const midpoint = Math.ceil(entries.length / 2)
    const left = await translateBatch(entries.slice(0, midpoint))
    const right = await translateBatch(entries.slice(midpoint))
    return [...left, ...right]
  }
}

function loadCache() {
  if (!existsSync(CACHE_PATH)) {
    return new Map()
  }

  const raw = JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
  return new Map(Object.entries(raw).map(([key, value]) => [key, postEditTranslation(value)]))
}

function saveCache(cache) {
  const serializable = Object.fromEntries([...cache.entries()].sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(CACHE_PATH, JSON.stringify(serializable, null, 2))
}

function getQuestionFields(question) {
  const fields = [
    ['stem', question.stem],
    ['rationale', question.rationale],
    ['skill_desc', question.skill_desc],
  ]

  for (const [index, option] of (question.answer_options || []).entries()) {
    fields.push([`answer_options.${index}.content`, option.content])
  }

  return fields.filter(([, value]) => Boolean(value))
}

function collectUniqueTemplates(questions) {
  const templates = new Set()
  for (const question of questions) {
    for (const [, fragment] of getQuestionFields(question)) {
      const root = parse(`<div data-root="1">${fragment}</div>`)
      const wrapper = root.querySelector('div[data-root="1"]')
      collectTemplates(wrapper, templates)
    }
  }
  return [...templates]
}

async function buildTranslations(templates, cache) {
  const pending = templates.filter(template => !cache.has(template))
  if (pending.length === 0) {
    console.log(`Translation cache hit for all ${templates.length} templates`)
    return
  }

  for (const [source, translation] of SOURCE_OVERRIDES.entries()) {
    if (!cache.has(source)) {
      cache.set(source, translation)
    }
  }

  const stillPending = pending.filter(template => !cache.has(template))
  const batches = splitIntoBatches(stillPending)
  let translatedCount = 0

  for (const [batchIndex, batch] of batches.entries()) {
    const translated = await translateBatch(batch)
    batch.forEach((source, index) => {
      cache.set(source, translated[index])
    })
    translatedCount += batch.length

    if ((batchIndex + 1) % 5 === 0 || batchIndex === batches.length - 1) {
      saveCache(cache)
      console.log(`Translated ${translatedCount}/${stillPending.length} templates`)
    }
  }
}

function translateFragment(fragment, cache) {
  const root = parse(`<div data-root="1">${fragment}</div>`)
  const wrapper = root.querySelector('div[data-root="1"]')

  function apply(node, insideProtected = false) {
    if (node.nodeType === NodeType.TEXT_NODE) return

    const protectedHere = isProtectedNode(node, insideProtected)

    for (const attr of TRANSLATABLE_ATTRS) {
      const value = node.getAttribute?.(attr)
      if (value && hasLetters(value)) {
        const translated = cache.get(value)
        if (!translated) {
          throw new Error(`Missing cached translation for attribute value: ${value.slice(0, 200)}`)
        }
        node.setAttribute(attr, translated)
      }
    }

    if (protectedHere) return

    for (const child of [...(node.childNodes || [])]) {
      if (child.nodeType !== NodeType.TEXT_NODE) {
        apply(child, protectedHere)
      }
    }

    const childNodes = node.childNodes || []
    if (childNodes.length === 0) return

    let template = ''
    let placeholderIndex = 0
    let hasTranslatableText = false
    const replacements = new Map()

    for (const child of childNodes) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        template += child.rawText
        if (hasLetters(child.rawText)) {
          hasTranslatableText = true
        }
        continue
      }

      const token = `[[N${placeholderIndex++}]]`
      template += token
      replacements.set(token, child.toString())
    }

    if (!hasTranslatableText) return

    const translated = cache.get(template)
    if (!translated) {
      throw new Error(`Missing cached translation for template: ${template.slice(0, 200)}`)
    }

    node.set_content(restorePlaceholders(translated, replacements))
  }

  apply(wrapper)
  localizeMathTextNodes(wrapper)
  return wrapper.innerHTML
}

function translateQuestion(question, cache) {
  const translated = {
    ...question,
    stem: translateFragment(question.stem, cache),
    rationale: translateFragment(question.rationale, cache),
    skill_desc: question.skill_desc ? translateFragment(question.skill_desc, cache) : question.skill_desc,
  }

  if (question.answer_options) {
    translated.answer_options = question.answer_options.map(option => ({
      ...option,
      content: translateFragment(option.content, cache),
    }))
  }

  return translated
}

function parseLimitArg() {
  const arg = process.argv.find(value => value.startsWith('--limit='))
  if (!arg) return null
  const value = Number(arg.split('=')[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

async function main() {
  const questions = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'))
  const limit = parseLimitArg()
  const targetQuestions = limit ? questions.slice(0, limit) : questions

  console.log(`Preparing Spanish translation for ${targetQuestions.length}/${questions.length} questions`)

  const cache = loadCache()
  const templates = collectUniqueTemplates(targetQuestions)
  console.log(`Found ${templates.length} unique text templates`)

  await buildTranslations(templates, cache)

  const translatedQuestions = []
  for (const [index, question] of targetQuestions.entries()) {
    translatedQuestions.push(translateQuestion(question, cache))

    if ((index + 1) % 50 === 0 || index === targetQuestions.length - 1) {
      writeFileSync(TEMP_OUTPUT_PATH, JSON.stringify(translatedQuestions))
      console.log(`Translated ${index + 1}/${targetQuestions.length} questions`)
    }
  }

  writeFileSync(TEMP_OUTPUT_PATH, JSON.stringify(translatedQuestions))
  renameSync(TEMP_OUTPUT_PATH, OUTPUT_PATH)
  saveCache(cache)

  console.log(`Wrote ${OUTPUT_PATH}`)
}

main().catch(error => {
  if (existsSync(TEMP_OUTPUT_PATH)) {
    unlinkSync(TEMP_OUTPUT_PATH)
  }
  console.error(error)
  process.exit(1)
})
