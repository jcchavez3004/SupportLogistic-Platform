'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { assignDriverToService } from '../actions'

type DriverOption = { id: string; full_name: string | null }

export function AssignDriverModal({
  isOpen,
  onClose,
  drivers,
  serviceId,
}: {
  isOpen: boolean
  onClose: () => void
  drivers: DriverOption[]
  serviceId: string | null
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setSelectedDriverId('')
      formRef.current?.reset()
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await assignDriverToService(formData)
      onClose()
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl shadow-2xl p-0 w-full max-w-md backdrop:bg-black/50"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Asignar conductor
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Selecciona un conductor disponible.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isPending}
          >
            <span className="sr-only">Cerrar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="mt-5 space-y-4">
          <input type="hidden" name="service_id" value={serviceId ?? ''} />

          <div>
            <label
              htmlFor="driver_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Conductor *
            </label>
            <select
              id="driver_id"
              name="driver_id"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              disabled={isPending}
            >
              <option value="" disabled>
                Selecciona un conductor…
              </option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name ? d.full_name : d.id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !serviceId || !selectedDriverId}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-md hover:bg-slate-800 disabled:opacity-60"
            >
              {isPending ? 'Asignando…' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}

