import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getDriverServices, getServiceStats } from './actions'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const stats = await getServiceStats()

  const isClient = profile?.role === 'cliente'
  const isDriver = profile?.role === 'conductor'

  if (isDriver && profile) {
    const services = await getDriverServices(profile.id)
    const activeStatuses = new Set([
      'asignado',
      'en_curso_recogida',
      'recogido',
      'en_curso_entrega',
    ])
    const activeService = services.find((s) => activeStatuses.has(s.status))

    const driverStats = services.reduce(
      (acc, s) => {
        acc.total += 1
        if (s.status === 'asignado') acc.asignado += 1
        if (s.status === 'entregado') acc.entregado += 1
        if (s.status === 'novedad') acc.novedad += 1
        if (activeStatuses.has(s.status)) acc.en_curso += 1
        return acc
      },
      { total: 0, asignado: 0, en_curso: 0, entregado: 0, novedad: 0 }
    )

    const statusLabel: Record<string, string> = {
      solicitado: 'Solicitado',
      asignado: 'Asignado',
      en_curso_recogida: 'En recogida',
      recogido: 'Recogido',
      en_curso_entrega: 'En entrega',
      entregado: 'Entregado',
      novedad: 'Novedad',
    }

    const statusStyle: Record<string, string> = {
      asignado: 'bg-blue-100 text-blue-700',
      en_curso_recogida: 'bg-amber-100 text-amber-700',
      recogido: 'bg-purple-100 text-purple-700',
      en_curso_entrega: 'bg-indigo-100 text-indigo-700',
      entregado: 'bg-emerald-100 text-emerald-700',
      novedad: 'bg-red-100 text-red-700',
      solicitado: 'bg-slate-100 text-slate-700',
    }

    return (
      <div className="mx-auto max-w-md space-y-5 pb-6">
        <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300">Estado</p>
              <p className="text-lg font-semibold">Disponible</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              En línea
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-800/70 p-3">
              <p className="text-xs text-slate-300">Asignados</p>
              <p className="mt-1 text-xl font-semibold">{driverStats.asignado}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3">
              <p className="text-xs text-slate-300">En curso</p>
              <p className="mt-1 text-xl font-semibold">{driverStats.en_curso}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3">
              <p className="text-xs text-slate-300">Entregados</p>
              <p className="mt-1 text-xl font-semibold">{driverStats.entregado}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-3">
              <p className="text-xs text-slate-300">Novedades</p>
              <p className="mt-1 text-xl font-semibold">{driverStats.novedad}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Viaje activo</p>
              <p className="text-base font-semibold text-gray-900">
                {activeService
                  ? activeService.clients?.company_name || 'Cliente asignado'
                  : 'Sin servicios activos'}
              </p>
            </div>
            {activeService ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  statusStyle[activeService.status] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {statusLabel[activeService.status] || activeService.status}
              </span>
            ) : null}
          </div>

          {activeService ? (
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div>
                <p className="text-xs text-gray-500">Recogida</p>
                <p className="font-medium text-gray-900">
                  {activeService.pickup_address || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Entrega</p>
                <p className="font-medium text-gray-900">
                  {activeService.delivery_address || '—'}
                </p>
              </div>
              {activeService.zone_label ? (
                <div>
                  <p className="text-xs text-gray-500">Zona</p>
                  <p className="font-medium text-gray-900">{activeService.zone_label}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Cuando tengas un servicio asignado aparecerá aquí.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Pedidos asignados</h3>
            <span className="text-xs text-gray-500">{services.length}</span>
          </div>

          <div className="mt-4 space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">No hay pedidos asignados.</p>
            ) : (
              services.slice(0, 6).map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {service.service_number ? `#${service.service_number}` : 'PENDIENTE'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.clients?.company_name || 'Cliente'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        statusStyle[service.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusLabel[service.status] || service.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="truncate">Recogida: {service.pickup_address || '—'}</p>
                    <p className="truncate">Entrega: {service.delivery_address || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resumen Operativo</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isClient
            ? 'Visualiza el estado de tus envíos solicitados.'
            : 'Vista general de todas las operaciones logísticas.'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
              <BarChart3 className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Solicitados */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Solicitados</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.solicitado}
              </p>
            </div>
          </div>
        </div>

        {/* Asignados */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Asignados</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.asignado}
              </p>
            </div>
          </div>
        </div>

        {/* En Curso */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">En Curso</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.en_curso}
              </p>
            </div>
          </div>
        </div>

        {/* Entregados */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Entregados</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.entregado}
              </p>
            </div>
          </div>
        </div>

        {/* Novedades */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Novedades</p>
              <p className="text-2xl font-bold text-red-600">{stats.novedad}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-sm">
        <h2 className="text-xl font-semibold">
          ¡Bienvenido, {profile?.full_name || user.email}!
        </h2>
        <p className="mt-2 text-blue-100">
          {isClient
            ? 'Desde aquí puedes solicitar nuevos envíos y hacer seguimiento de tus pedidos en tiempo real.'
            : 'Tienes acceso completo al panel de operaciones. Gestiona servicios, asigna conductores y supervisa las entregas.'}
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="/dashboard/services"
            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            {isClient ? 'Mis Envíos' : 'Ver Servicios'}
          </a>
        </div>
      </div>
    </div>
  )
}
