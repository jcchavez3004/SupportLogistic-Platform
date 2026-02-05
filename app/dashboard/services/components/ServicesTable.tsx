'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, MapPin, Flag, Calendar, ChevronRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { AssignDriverModal } from './AssignDriverModal'
import { EvidenceUpload } from './EvidenceUpload'
import type { UserRole } from '@/utils/supabase/getCurrentProfile'

type ServiceRow = {
  id: string
  service_number: number | null
  pickup_address: string
  delivery_address: string
  status: string
  driver_id: string | null
  evidence_photo_url: string | null
  created_at: string
  clients: { company_name: string } | null
}

type DriverOption = { id: string; full_name: string | null }

interface ServicesTableProps {
  services: ServiceRow[]
  drivers: DriverOption[]
  role: UserRole
}

const statusLabels: Record<string, string> = {
  solicitado: 'Solicitado',
  asignado: 'Asignado',
  en_curso_recogida: 'En recogida',
  recogido: 'Recogido',
  en_curso_entrega: 'En entrega',
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

export function ServicesTable({ services, drivers, role }: ServicesTableProps) {
  const [assigningServiceId, setAssigningServiceId] = useState<string | null>(
    null
  )

  const isClient = role === 'cliente'
  const canAssign = !isClient
  const canChangeStatus = !isClient

  const driverById = useMemo(() => {
    const map = new Map<string, DriverOption>()
    drivers.forEach((d) => map.set(d.id, d))
    return map
  }, [drivers])

  if (!services || services.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">No hay servicios registrados aún.</p>
      </div>
    )
  }

  return (
    <>
      {canAssign && (
        <AssignDriverModal
          isOpen={assigningServiceId !== null}
          onClose={() => setAssigningServiceId(null)}
          drivers={drivers}
          serviceId={assigningServiceId}
        />
      )}

      {/* ========== VISTA MÓVIL: Tarjetas ========== */}
      <div className="block md:hidden space-y-4 p-4">
        {services.map((s) => {
          const serviceNumber = s.service_number
            ? `#${s.service_number}`
            : 'PENDIENTE'
          const statusColor =
            statusColors[s.status] || 'bg-gray-100 text-gray-800'
          const statusLabel = statusLabels[s.status] || s.status

          return (
            <div
              key={s.id}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Cabecera: Cliente + Estado */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600">
                    {serviceNumber}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                    {s.clients?.company_name ?? '—'}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Cuerpo: Direcciones */}
              <div className="px-4 py-4 space-y-4">
                {/* Recogida */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Recogida
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5 leading-snug">
                      {s.pickup_address}
                    </p>
                  </div>
                </div>

                {/* Entrega */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Entrega
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5 leading-snug">
                      {s.delivery_address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pie: Fecha + Botón */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(s.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                <Link
                  href={`/dashboard/services/${s.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm active:bg-blue-700 touch-manipulation"
                >
                  {isClient ? 'Ver Detalles' : 'Gestionar'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* ========== VISTA ESCRITORIO: Tabla ========== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N°
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              {!isClient && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
                </th>
              )}
              {!isClient && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evidencia
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección Recogida
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dirección Entrega
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((s) => {
              const serviceNumber = s.service_number
                ? `#${s.service_number}`
                : 'PENDIENTE'
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/services/${s.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {serviceNumber}
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {s.clients?.company_name ?? '—'}
                  </td>
                  {!isClient && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {s.driver_id ? (
                        (() => {
                          const d = driverById.get(s.driver_id)
                          return d?.full_name || '—'
                        })()
                      ) : s.status === 'solicitado' && canAssign ? (
                        <button
                          type="button"
                          onClick={() => setAssigningServiceId(s.id)}
                          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Asignar
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                  {!isClient && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EvidenceUpload
                        serviceId={s.id}
                        evidenceUrl={s.evidence_photo_url}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[26rem] truncate">
                    {s.pickup_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[26rem] truncate">
                    {s.delivery_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canChangeStatus ? (
                      <StatusBadge serviceId={s.id} status={s.status} />
                    ) : (
                      <StatusBadgeReadOnly status={s.status} />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Badge de estado de solo lectura (para clientes) */
function StatusBadgeReadOnly({ status }: { status: string }) {
  const color = statusColors[status] || 'bg-gray-100 text-gray-800'
  const label = statusLabels[status] || status

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {label}
    </span>
  )
}
