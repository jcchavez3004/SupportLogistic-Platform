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
import { DriverDashboard, type Service as DriverServiceRow } from './components/DriverDashboard'

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
    return (
      <DriverDashboard
        driverId={profile.id}
        initialServices={services as DriverServiceRow[]}
      />
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
