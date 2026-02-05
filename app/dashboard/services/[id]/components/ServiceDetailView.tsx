'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  User,
  Truck,
  FileText,
  Package,
  Edit,
  Save,
  X,
  Eye,
  Calendar,
} from 'lucide-react'
import type { UserRole } from '@/utils/supabase/getCurrentProfile'
import { updateService } from '../../../actions'
import { PDFDownloadButtons } from './PDFDownloadButtons'

interface ServiceData {
  id: string
  client_id: string
  driver_id: string | null
  status: string
  pickup_address: string
  pickup_contact_name: string | null
  pickup_phone: string | null
  delivery_address: string
  delivery_contact_name: string | null
  delivery_phone: string | null
  observations: string | null
  evidence_photo_url: string | null
  created_at: string
  updated_at: string
  clients: {
    id: string
    company_name: string
    nit: string | null
    address: string | null
    logo_url: string | null
  } | null
  driver: {
    id: string
    full_name: string | null
    phone: string | null
    vehicle_plate: string | null
  } | null
}

interface ServiceDetailViewProps {
  service: ServiceData
  serviceNumber: string
  role: UserRole
}

const statusLabels: Record<string, string> = {
  solicitado: 'Solicitado',
  asignado: 'Asignado',
  en_curso_recogida: 'En curso (recogida)',
  recogido: 'Recogido',
  en_curso_entrega: 'En curso (entrega)',
  entregado: 'Entregado',
  novedad: 'Novedad',
}

const statusColors: Record<string, string> = {
  solicitado: 'bg-yellow-100 text-yellow-800',
  asignado: 'bg-blue-100 text-blue-800',
  en_curso_recogida: 'bg-indigo-100 text-indigo-800',
  recogido: 'bg-purple-100 text-purple-800',
  en_curso_entrega: 'bg-cyan-100 text-cyan-800',
  entregado: 'bg-green-100 text-green-800',
  novedad: 'bg-red-100 text-red-800',
}

export function ServiceDetailView({
  service,
  serviceNumber,
  role,
}: ServiceDetailViewProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isClient = role === 'cliente'
  const canEdit = !isClient // Clientes no pueden editar
  const canGeneratePDF = role === 'super_admin' || role === 'operador'

  const handleSave = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateService(service.id, formData)
        setIsEditing(false)
        router.refresh()
      } catch (error) {
        console.error('Error updating service:', error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/services"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Servicio {serviceNumber}
            </h1>
            <p className="text-sm text-gray-500">
              Creado el{' '}
              {new Date(service.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              statusColors[service.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {statusLabels[service.status] || service.status}
          </span>

          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          )}

          {canGeneratePDF && (
            <PDFDownloadButtons
              service={service}
              serviceNumber={serviceNumber}
            />
          )}
        </div>
      </div>

      <form action={handleSave}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Datos del Cliente */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Cliente</h2>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Empresa</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {service.clients?.company_name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">NIT</dt>
                <dd className="text-sm text-gray-900">
                  {service.clients?.nit || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Dirección</dt>
                <dd className="text-sm text-gray-900">
                  {service.clients?.address || '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Conductor Asignado */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Truck className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Conductor</h2>
            </div>
            {service.driver ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Nombre</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {service.driver.full_name || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Teléfono</dt>
                  <dd className="text-sm text-gray-900">
                    {service.driver.phone || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Placa</dt>
                  <dd className="text-sm text-gray-900">
                    {service.driver.vehicle_plate || '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-gray-500">Sin conductor asignado</p>
            )}
          </div>

          {/* Datos de Recogida */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recogida</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Dirección
                </label>
                {isEditing ? (
                  <input
                    name="pickup_address"
                    defaultValue={service.pickup_address}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {service.pickup_address}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Contacto
                  </label>
                  {isEditing ? (
                    <input
                      name="pickup_contact_name"
                      defaultValue={service.pickup_contact_name || ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {service.pickup_contact_name || '—'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Teléfono
                  </label>
                  {isEditing ? (
                    <input
                      name="pickup_phone"
                      defaultValue={service.pickup_phone || ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {service.pickup_phone || '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Datos de Entrega */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Entrega</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Dirección
                </label>
                {isEditing ? (
                  <input
                    name="delivery_address"
                    defaultValue={service.delivery_address}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {service.delivery_address}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Contacto
                  </label>
                  {isEditing ? (
                    <input
                      name="delivery_contact_name"
                      defaultValue={service.delivery_contact_name || ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {service.delivery_contact_name || '—'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Teléfono
                  </label>
                  {isEditing ? (
                    <input
                      name="delivery_phone"
                      defaultValue={service.delivery_phone || ''}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {service.delivery_phone || '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Observaciones
              </h2>
            </div>
            {isEditing ? (
              <textarea
                name="observations"
                rows={4}
                defaultValue={service.observations || ''}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Notas adicionales..."
              />
            ) : (
              <p className="text-sm text-gray-700">
                {service.observations || 'Sin observaciones'}
              </p>
            )}
          </div>

          {/* Evidencia */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Eye className="h-5 w-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Evidencia Fotográfica
              </h2>
            </div>
            {service.evidence_photo_url ? (
              <div className="space-y-3">
                <a
                  href={service.evidence_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-gray-200"
                >
                  <img
                    src={service.evidence_photo_url}
                    alt="Evidencia de entrega"
                    className="h-48 w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
                <a
                  href={service.evidence_photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-4 w-4" />
                  Ver imagen completa
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No se ha cargado evidencia fotográfica
              </p>
            )}
          </div>
        </div>

        {/* Botones de edición */}
        {isEditing && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </form>

      {/* Mapa Placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
            <MapPin className="h-5 w-5 text-cyan-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Ubicación (Próximamente)
          </h2>
        </div>
        <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
          <p className="text-sm">
            Mapa de rastreo disponible en próximas versiones
          </p>
        </div>
      </div>
    </div>
  )
}
