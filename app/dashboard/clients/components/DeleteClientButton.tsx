'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { deleteClient } from '../actions'

interface DeleteClientButtonProps {
  clientId: string
  clientName: string
}

export function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteClient(clientId)
      if (result.success) {
        setShowConfirm(false)
        router.refresh()
      } else {
        setError(result.error ?? 'Error desconocido')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Eliminar cliente
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  ¿Eliminar a{' '}
                  <strong className="text-gray-700">{clientName}</strong>?
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Se eliminarán también sus servicios asignados y usuarios vinculados.
                  Esta acción no se puede deshacer.
                </p>
                {error && (
                  <div className="mt-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowConfirm(false); setError(null) }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando...</>
                  : <><Trash2 className="h-4 w-4" /> Sí, eliminar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
