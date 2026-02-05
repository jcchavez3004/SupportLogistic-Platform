import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getDrivers } from './actions'
import { Phone, Truck, IdCard, User } from 'lucide-react'

export default async function DriversPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const drivers = await getDrivers()

  return (
    <div className="space-y-6">
      {/* Header responsivo: apila en móvil, fila en desktop */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Conductores</h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">
            Lista de usuarios con rol <span className="font-medium">conductor</span>.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white shadow-sm hover:bg-gray-50 disabled:opacity-60 touch-manipulation"
          title="Por ahora se gestionan desde Supabase (Auth)"
        >
          Nuevo Conductor
        </button>
      </div>

      {/* ========== VISTA MÓVIL: Tarjetas ========== */}
      <div className="block md:hidden space-y-4">
        {drivers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No hay conductores registrados.</p>
          </div>
        ) : (
          drivers.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Cabecera de la tarjeta */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {d.full_name || 'Sin nombre'}
                  </span>
                </div>
                <StatusBadge status={d.status} />
              </div>

              {/* Cuerpo de la tarjeta */}
              <div className="px-4 py-3 space-y-3">
                {/* Teléfono */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Teléfono</p>
                    <p className="text-sm font-medium text-gray-900">
                      {d.phone || '—'}
                    </p>
                  </div>
                </div>

                {/* Placa del Vehículo */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Placa del Vehículo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {d.vehicle_plate || '—'}
                    </p>
                  </div>
                </div>

                {/* ID/Cédula - usando el ID del conductor como referencia */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <IdCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID Usuario</p>
                    <p className="text-sm font-medium text-gray-900 font-mono truncate max-w-[180px]">
                      {d.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Pie de la tarjeta - Botón de acción */}
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed touch-manipulation"
                  title="Funcionalidad próximamente"
                >
                  Ver Detalles (próximamente)
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========== VISTA ESCRITORIO: Tabla ========== */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placa del Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No hay conductores registrados.
                  </td>
                </tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {d.full_name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {d.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {d.vehicle_plate || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/** Componente Badge de estado reutilizable */
function StatusBadge({ status }: { status: string | null }) {
  const isActive = status === 'activo'
  
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        isActive
          ? 'bg-green-50 text-green-700 ring-green-600/20'
          : 'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
    >
      {status === 'activo' ? 'Activo' : status === 'inactivo' ? 'Inactivo' : status || '—'}
    </span>
  )
}

