'use client'

import { useState, useEffect } from 'react'
import { getSimulationResults, clearSimulationResults } from '@/lib/storage'
import { SimulationResult } from '@/lib/types'
import { ASSESSMENT_LABELS, DIFFICULTY_LABELS } from '@/lib/types'

export default function HistoryPage() {
  const [results, setResults] = useState<SimulationResult[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setResults(getSimulationResults())
    setLoaded(true)
  }, [])

  const handleClear = () => {
    if (confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) {
      clearSimulationResults()
      setResults([])
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/" className="text-sm text-gray-400 hover:text-black transition-colors mb-2 block">
            ← Volver
          </a>
          <h1 className="text-3xl font-semibold" style={{ letterSpacing: '-1.5px' }}>
            Historial
          </h1>
        </div>
        {results.length > 0 && (
          <button onClick={handleClear} className="btn-secondary text-red-600">
            Borrar historial
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No hay simulaciones registradas</p>
          <a href="/simulation" className="btn-primary inline-block">
            Iniciar simulación
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(r => {
            const date = new Date(r.date)
            const dateStr = date.toLocaleDateString('es', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
            const minutes = Math.floor(r.timeTaken / 60)
            const seconds = r.timeTaken % 60

            return (
              <div key={r.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold mb-1">{r.name}</div>
                    <div className="text-sm text-gray-400">{dateStr}</div>
                  </div>
                  <div className={`text-3xl font-semibold ${
                    r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-orange-500' : 'text-red-500'
                  }`} style={{ letterSpacing: '-1.5px' }}>
                    {r.percentage}%
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-blue">
                    {ASSESSMENT_LABELS[r.assessment] || r.assessment}
                  </span>
                  <span className="badge badge-gray">
                    {DIFFICULTY_LABELS[r.difficulty] || r.difficulty}
                  </span>
                  <span className="badge badge-gray">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex gap-6 text-sm">
                  <span className="text-green-600">
                    ✓ {r.correct} correctas
                  </span>
                  <span className="text-red-500">
                    ✗ {r.incorrect} incorrectas
                  </span>
                  {r.skipped > 0 && (
                    <span className="text-gray-400">
                      → {r.skipped} saltadas
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
