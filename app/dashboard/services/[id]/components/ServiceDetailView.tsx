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
import { updateService, type ServiceDetail } from '../../../actions'
import { PDFDownloadButtons } from './PDFDownloadButtons'
import { LiveTrackingMap } from './LiveTrackingMap'
import { ClientDate, ClientDateTime, ClientTime } from '@/app/components/ClientDate'

interface ServiceDetailViewProps {
  service: ServiceDetail
  serviceNumber: string
  role: UserRole
  /** ID del servicio para Realtime en el mapa (explícito desde la página). */
  serviceId: string
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
  serviceId,
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
              <ClientDate
                date={service.created_at}
                options={{ day: 'numeric', month: 'long', year: 'numeric' }}
              />
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
                Evidencia de Entrega
              </h2>
            </div>

            {service.evidence_photo_url || service.evidence_photo_url_2 || service.evidence_signature_url ? (
              <div className="space-y-4">
                {/* Fotos */}
                <div className="grid grid-cols-2 gap-3">
                  {service.evidence_photo_url && (
                    <a href={service.evidence_photo_url} target="_blank" rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-gray-200">
                      <img src={service.evidence_photo_url} alt="Foto evidencia 1"
                        className="h-36 w-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  )}
                  {service.evidence_photo_url_2 && (
                    <a href={service.evidence_photo_url_2} target="_blank" rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-gray-200">
                      <img src={service.evidence_photo_url_2} alt="Foto evidencia 2"
                        className="h-36 w-full object-cover hover:scale-105 transition-transform" />
                    </a>
                  )}
                </div>
                {/* Firma */}
                {service.evidence_signature_url && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Firma del destinatario
                    </p>
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 inline-block">
                      <img src={service.evidence_signature_url} alt="Firma"
                        className="h-20 object-contain" />
                    </div>
                  </div>
                )}
                {/* Timestamps */}
                {service.completed_at && (
                  <p className="text-xs text-gray-400">
                    Entregado el <ClientDateTime date={service.completed_at} />
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No se ha registrado evidencia de entrega
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

      {/* Tracking del conductor */}
      {(service.driver_lat && service.driver_lng) ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
                <MapPin className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ubicación del Conductor
                </h2>
                {service.driver_location_updated_at && (
                  <p className="text-xs text-gray-400">
                    Actualizado: <ClientTime date={service.driver_location_updated_at} />
                  </p>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              En vivo
            </span>
          </div>
          <LiveTrackingMap
            lat={service.driver_lat}
            lng={service.driver_lng}
            deliveryAddress={service.delivery_address}
            pickupAddress={service.pickup_address}
            serviceId={serviceId}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100">
              <MapPin className="h-5 w-5 text-cyan-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Ubicación</h2>
          </div>
          <div className="flex h-32 items-center justify-center rounded-lg bg-gray-50 border border-dashed border-gray-200">
            <div className="text-center">
              <Truck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {service.driver_id
                  ? 'El conductor aún no ha iniciado el recorrido'
                  : 'Sin conductor asignado'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
