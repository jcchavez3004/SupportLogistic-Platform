'use client'

import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ImportProgressProps {
  status: 'idle' | 'importing' | 'success' | 'error'
  progress: number
  total: number
  message?: string
  onReset?: () => void
}

export function ImportProgress({ status, progress, total, message, onReset }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0

  if (status === 'idle') {
    return null
  }

  return (
    <div className={`rounded-2xl p-6 ${
      status === 'success' 
        ? 'bg-green-50 border-2 border-green-200' 
        : status === 'error'
        ? 'bg-red-50 border-2 border-red-200'
        : 'bg-indigo-50 border-2 border-indigo-200'
    }`}>
      <div className="flex items-center gap-4">
        {/* Icono */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          status === 'success'
            ? 'bg-green-500'
            : status === 'error'
            ? 'bg-red-500'
            : 'bg-indigo-500'
        }`}>
          {status === 'importing' && (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-6 w-6 text-white" />
          )}
          {status === 'error' && (
            <XCircle className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${
            status === 'success'
              ? 'text-green-900'
              : status === 'error'
              ? 'text-red-900'
              : 'text-indigo-900'
          }`}>
            {status === 'importing' && `Importando servicios... (${progress}/${total})`}
            {status === 'success' && `¡${progress} Servicios creados exitosamente!`}
            {status === 'error' && 'Error en la importación'}
          </p>
          
          {message && (
            <p className={`text-sm mt-1 ${
              status === 'success'
                ? 'text-green-700'
                : status === 'error'
                ? 'text-red-700'
                : 'text-indigo-700'
            }`}>
              {message}
            </p>
          )}

          {/* Barra de progreso */}
          {status === 'importing' && (
            <div className="mt-3">
              <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-indigo-600 mt-1 text-right">{percentage}%</p>
            </div>
          )}
        </div>

        {/* Botón de reset */}
        {(status === 'success' || status === 'error') && onReset && (
          <button
            onClick={onReset}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              status === 'success'
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Nueva Importación
          </button>
        )}
      </div>
    </div>
  )
}
