import { SimulationResult } from './types'

const STORAGE_KEY = 'sat-practice-results'

export function saveSimulationResult(result: SimulationResult): void {
  const results = getSimulationResults()
  results.unshift(result)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
}

export function getSimulationResults(): SimulationResult[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function clearSimulationResults(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
