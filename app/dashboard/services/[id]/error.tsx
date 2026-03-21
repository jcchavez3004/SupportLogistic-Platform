'use client'

import Link from 'next/link'

export default function ServiceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-lg font-semibold text-gray-900">No se pudo cargar el servicio</h2>
      <p className="max-w-md text-center text-sm text-gray-600">
        {error.message || 'Ocurrió un error inesperado.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard/services"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Volver al listado
        </Link>
      </div>
    </div>
  )
}
