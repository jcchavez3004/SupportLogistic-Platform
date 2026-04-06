'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Plus, Trash2, MapPin, Truck } from 'lucide-react'
import { createNewService } from '../actions'
import type { UserRole } from '@/utils/supabase/getCurrentProfile'

type ClientOption = { id: string; company_name: string }

interface NewServiceModalProps {
  isOpen: boolean
  onClose: () => void
  clients: ClientOption[]
  role: UserRole
  clientId: string | null
}

type DeliveryPoint = {
  id: string
  address: string
  contact_name: string
  contact_phone: string
  time_start: string
  time_end: string
  description: string
  reference_id: string
}

const POINT_COLORS = [
  'border-blue-300 bg-blue-50',
  'border-green-300 bg-green-50',
  'border-purple-300 bg-purple-50',
  'border-amber-300 bg-amber-50',
]

const POINT_BADGE_COLORS = [
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-amber-600',
]

const MAX_POINTS = 4

function emptyPoint(): DeliveryPoint {
  return {
    id: crypto.randomUUID(),
    address: '',
    contact_name: '',
    contact_phone: '',
    time_start: '',
    time_end: '',
    description: '',
    reference_id: '',
  }
}

export function NewServiceModal({
  isOpen,
  onClose,
  clients,
  role,
}: NewServiceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isClient = role === 'cliente'

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([emptyPoint()])

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  const addPoint = () => {
    if (deliveryPoints.length >= MAX_POINTS) return
    setDeliveryPoints((prev) => [...prev, emptyPoint()])
  }

  const removePoint = (id: string) => {
    if (deliveryPoints.length <= 1) return
    setDeliveryPoints((prev) => prev.filter((p) => p.id !== id))
  }

  const updatePoint = (id: string, field: keyof DeliveryPoint, value: string) => {
    setDeliveryPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setPending(true)

    try {
      const form = e.currentTarget
      const fd = new FormData(form)

      fd.set('delivery_address', deliveryPoints[0].address)
      fd.set('delivery_contact_name', deliveryPoints[0].contact_name)
      fd.set('delivery_phone', deliveryPoints[0].contact_phone)
      fd.set(
        'delivery_points_json',
        JSON.stringify(deliveryPoints.map((p, i) => ({ order: i + 1, ...p })))
      )
      fd.set('is_multipoint', deliveryPoints.length > 1 ? 'true' : 'false')
      fd.set('requires_assistant', form.requires_assistant?.checked ? 'true' : 'false')

      await createNewService(fd)
      setDeliveryPoints([emptyPoint()])
      formRef.current?.reset()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el servicio')
    } finally {
      setPending(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <dialog
      ref={dialogRef}
      className="rounded-2xl shadow-2xl p-0 w-full max-w-2xl backdrop:bg-black/50"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div
        className="max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isClient ? 'Solicitar Envío' : 'Nuevo Servicio'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Completa los datos de recogida y entrega.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente (solo admin/operador) */}
          {!isClient && (
            <div>
              <label className={labelClass}>Cliente *</label>
              <select
                name="client_id"
                required
                className={inputClass + ' bg-white'}
                defaultValue=""
              >
                <option value="" disabled>Selecciona un cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* SECCIÓN 1 — Datos generales */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-gray-500" />
              Datos del servicio
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Fecha *</label>
                <input
                  name="scheduled_date"
                  type="date"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Hora recolección *</label>
                <input
                  name="scheduled_pickup_time"
                  type="time"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo vehículo</label>
                <select name="vehicle_type" className={inputClass + ' bg-white'} defaultValue="">
                  <option value="">Sin especificar</option>
                  <option value="Moto">Moto</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="NPR">NPR</option>
                  <option value="Tractomula">Tractomula</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    name="requires_assistant"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Requiere auxiliar
                </label>
              </div>
            </div>
          </fieldset>

          {/* SECCIÓN 2 — Origen */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Origen (recogida)
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>Dirección de recogida *</label>
                <input
                  name="pickup_address"
                  required
                  className={inputClass}
                  placeholder="Calle, número, ciudad…"
                />
              </div>
              <div>
                <label className={labelClass}>Contacto nombre</label>
                <input
                  name="pickup_contact_name"
                  className={inputClass}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input
                  name="pickup_phone"
                  type="tel"
                  className={inputClass}
                  placeholder="Ej: 300 000 0000"
                />
              </div>
            </div>
          </fieldset>

          {/* SECCIÓN 3 — Puntos de entrega */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Puntos de entrega
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({deliveryPoints.length}/{MAX_POINTS})
              </span>
            </legend>

            <div className="space-y-4">
              {deliveryPoints.map((point, idx) => (
                <div
                  key={point.id}
                  className={`rounded-xl border-2 p-4 space-y-3 ${POINT_COLORS[idx % POINT_COLORS.length]}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${POINT_BADGE_COLORS[idx % POINT_BADGE_COLORS.length]}`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        Punto {idx + 1}
                      </span>
                    </div>
                    {deliveryPoints.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePoint(point.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar punto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Dirección de entrega *</label>
                      <input
                        required
                        value={point.address}
                        onChange={(e) => updatePoint(point.id, 'address', e.target.value)}
                        className={inputClass}
                        placeholder="Calle, número, ciudad…"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Contacto nombre</label>
                      <input
                        value={point.contact_name}
                        onChange={(e) => updatePoint(point.id, 'contact_name', e.target.value)}
                        className={inputClass}
                        placeholder="Nombre"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Teléfono</label>
                      <input
                        type="tel"
                        value={point.contact_phone}
                        onChange={(e) => updatePoint(point.id, 'contact_phone', e.target.value)}
                        className={inputClass}
                        placeholder="300 000 0000"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Hora inicio entrega</label>
                      <input
                        type="time"
                        value={point.time_start}
                        onChange={(e) => updatePoint(point.id, 'time_start', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Hora fin entrega</label>
                      <input
                        type="time"
                        value={point.time_end}
                        onChange={(e) => updatePoint(point.id, 'time_end', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Descripción / elementos</label>
                      <input
                        value={point.description}
                        onChange={(e) => updatePoint(point.id, 'description', e.target.value)}
                        className={inputClass}
                        placeholder="Cajas, sobres…"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>ID / Referencia</label>
                      <input
                        value={point.reference_id}
                        onChange={(e) => updatePoint(point.id, 'reference_id', e.target.value)}
                        className={inputClass}
                        placeholder="OC-1234"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {deliveryPoints.length < MAX_POINTS && (
              <button
                type="button"
                onClick={addPoint}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar punto de entrega
              </button>
            )}
          </fieldset>

          {/* SECCIÓN 4 — Observaciones */}
          <div>
            <label className={labelClass}>Observaciones generales</label>
            <textarea
              name="observations"
              rows={3}
              className={inputClass}
              placeholder="Notas adicionales para el servicio…"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {pending ? 'Creando...' : isClient ? 'Solicitar Envío' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
