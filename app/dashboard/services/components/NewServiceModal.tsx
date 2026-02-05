'use client'

import { useEffect, useRef } from 'react'
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

export function NewServiceModal({
  isOpen,
  onClose,
  clients,
  role,
  clientId,
}: NewServiceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isClient = role === 'cliente'

  useEffect(() => {
    if (isOpen) dialogRef.current?.showModal()
    else dialogRef.current?.close()
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose()
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      await createNewService(formData)
      formRef.current?.reset()
      onClose()
    } catch (err) {
      console.error('Error creating service:', err)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="rounded-xl shadow-2xl p-0 w-full max-w-2xl backdrop:bg-black/50"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isClient ? 'Solicitar Envío' : 'Nuevo Servicio (Envío)'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isClient
                ? 'Completa los datos de recogida y entrega para tu solicitud.'
                : 'Completa los datos de recogida y entrega.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        <form ref={formRef} action={handleSubmit} className="mt-6 space-y-6">
          {/* Solo mostrar select de cliente si NO es rol cliente */}
          {!isClient && (
            <div>
              <label
                htmlFor="client_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cliente *
              </label>
              <select
                id="client_id"
                name="client_id"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona un cliente…
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Si es cliente, el client_id se inyecta en el backend; no necesita hidden input */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Recogida
              </h3>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="pickup_address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dirección de recogida *
              </label>
              <input
                id="pickup_address"
                name="pickup_address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                placeholder="Calle, número, ciudad…"
              />
            </div>
            <div>
              <label
                htmlFor="pickup_contact_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contacto (nombre)
              </label>
              <input
                id="pickup_contact_name"
                name="pickup_contact_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                placeholder="Nombre del contacto"
              />
            </div>
            <div>
              <label
                htmlFor="pickup_phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono
              </label>
              <input
                id="pickup_phone"
                name="pickup_phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                placeholder="Ej: +57 300 000 0000"
              />
            </div>

            <div className="md:col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-slate-900">Entrega</h3>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="delivery_address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dirección de entrega *
              </label>
              <input
                id="delivery_address"
                name="delivery_address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                placeholder="Calle, número, ciudad…"
              />
            </div>
            <div>
              <label
                htmlFor="delivery_contact_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contacto (nombre)
              </label>
              <input
                id="delivery_contact_name"
                name="delivery_contact_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                placeholder="Nombre del contacto"
              />
            </div>
            <div>
              <label
                htmlFor="delivery_phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono
              </label>
              <input
                id="delivery_phone"
                name="delivery_phone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
                placeholder="Ej: +57 300 000 0000"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="observations"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Observaciones
            </label>
            <textarea
              id="observations"
              name="observations"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              placeholder="Notas adicionales para el servicio…"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 border border-transparent rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              {isClient ? 'Solicitar Envío' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
