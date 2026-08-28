'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { assignDriverToService, searchFieldDrivers } from '../actions'
import type { FieldDriverSearchResult } from '../actions'

export type FieldDriverForm = {
  driver_full_name: string
  driver_cedula: string
  driver_phone: string
  driver_plate: string
}

function emptyDriver(): FieldDriverForm {
  return {
    driver_full_name: '',
    driver_cedula: '',
    driver_phone: '',
    driver_plate: '',
  }
}

export function AssignDriverModal({
  isOpen,
  onClose,
  serviceId,
  initialDriver,
}: {
  isOpen: boolean
  onClose: () => void
  serviceId: string | null
  /** Si se pasa, el formulario abre pre-cargado (edición del conductor actual). */
  initialDriver?: FieldDriverForm | null
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [driver, setDriver] = useState<FieldDriverForm>(emptyDriver)
  const [driverSuggestions, setDriverSuggestions] = useState<FieldDriverSearchResult[]>([])
  const [suggestField, setSuggestField] = useState<'cedula' | 'name' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const driverSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isPending, startTransition] = useTransition()

  const isEditMode = !!initialDriver

  useEffect(() => {
    if (isOpen) {
      setDriver(initialDriver ?? emptyDriver())
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setDriver(emptyDriver())
      setDriverSuggestions([])
      setSuggestField(null)
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (driverSearchTimeout.current) clearTimeout(driverSearchTimeout.current)
    }
  }, [])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  const scheduleDriverSearch = (value: string, field: 'cedula' | 'name') => {
    if (driverSearchTimeout.current) clearTimeout(driverSearchTimeout.current)
    if (value.trim().length < 2) {
      setDriverSuggestions([])
      setSuggestField(null)
      return
    }
    driverSearchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchFieldDrivers(value)
        setDriverSuggestions(results)
        setSuggestField(field)
      } catch {
        setDriverSuggestions([])
        setSuggestField(null)
      }
    }, 300)
  }

  const selectFieldDriver = (match: FieldDriverSearchResult) => {
    setDriver({
      driver_full_name: match.full_name ?? '',
      driver_cedula: match.cedula ?? '',
      driver_phone: match.phone ?? '',
      driver_plate: match.vehicle_plate ?? '',
    })
    setDriverSuggestions([])
    setSuggestField(null)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!serviceId) return
    if (!driver.driver_full_name.trim() || !driver.driver_cedula.trim()) {
      setError('Nombre y cédula del conductor son requeridos.')
      return
    }

    const fd = new FormData()
    fd.set('service_id', serviceId)
    fd.set('driver_full_name', driver.driver_full_name.trim())
    fd.set('driver_cedula', driver.driver_cedula.trim())
    fd.set('driver_phone', driver.driver_phone.trim())
    fd.set('driver_plate', driver.driver_plate.trim())

    startTransition(async () => {
      try {
        await assignDriverToService(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al asignar conductor')
      }
    })
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'
  const canSubmit =
    !!serviceId &&
    driver.driver_full_name.trim() !== '' &&
    driver.driver_cedula.trim() !== ''

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
              {isEditMode ? 'Editar conductor' : 'Asignar conductor'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Busca por cédula o nombre, o ingresa un conductor nuevo.
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className={labelClass}>Cédula *</label>
              <input
                value={driver.driver_cedula}
                onChange={(e) => {
                  const value = e.target.value
                  setDriver((prev) => ({ ...prev, driver_cedula: value }))
                  scheduleDriverSearch(value, 'cedula')
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (suggestField === 'cedula') {
                      setDriverSuggestions([])
                      setSuggestField(null)
                    }
                  }, 150)
                }}
                className={inputClass}
                placeholder="Buscar por cédula…"
                autoComplete="off"
                disabled={isPending}
              />
              {suggestField === 'cedula' && driverSuggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {driverSuggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectFieldDriver(s)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        {s.full_name} — {s.cedula}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative">
              <label className={labelClass}>Nombre *</label>
              <input
                value={driver.driver_full_name}
                onChange={(e) => {
                  const value = e.target.value
                  setDriver((prev) => ({ ...prev, driver_full_name: value }))
                  scheduleDriverSearch(value, 'name')
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (suggestField === 'name') {
                      setDriverSuggestions([])
                      setSuggestField(null)
                    }
                  }, 150)
                }}
                className={inputClass}
                placeholder="Nombre completo"
                autoComplete="off"
                disabled={isPending}
              />
              {suggestField === 'name' && driverSuggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                  {driverSuggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectFieldDriver(s)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50"
                      >
                        {s.full_name} — {s.cedula}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input
                type="tel"
                value={driver.driver_phone}
                onChange={(e) =>
                  setDriver((prev) => ({ ...prev, driver_phone: e.target.value }))
                }
                className={inputClass}
                placeholder="Ej: 300 000 0000"
                disabled={isPending}
              />
            </div>
            <div>
              <label className={labelClass}>Placa</label>
              <input
                value={driver.driver_plate}
                onChange={(e) =>
                  setDriver((prev) => ({ ...prev, driver_plate: e.target.value }))
                }
                className={inputClass}
                placeholder="ABC123"
                disabled={isPending}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
              disabled={isPending || !canSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-md hover:bg-slate-800 disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : isEditMode ? 'Guardar cambios' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
