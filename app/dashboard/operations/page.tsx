import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getZonesSummary, getDriversForZoneAssignment } from './actions'
import { OperationsClient } from './components/OperationsClient'

export default async function OperationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const role = profile?.role || 'cliente'

  // Solo admin y operador pueden acceder
  if (role === 'cliente') {
    redirect('/dashboard')
  }

  // Obtener datos en paralelo
  const [zones, drivers] = await Promise.all([
    getZonesSummary(),
    getDriversForZoneAssignment(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Centro de Operaciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona y asigna envíos masivos por zonas. Visualiza el estado de cada estiba.
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-3xl font-bold text-gray-900">
            {zones.reduce((acc, z) => acc + z.total_count, 0)}
          </p>
          <p className="text-sm text-gray-500">Total Envíos</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-3xl font-bold text-amber-600">
            {zones.reduce((acc, z) => acc + z.pending_count, 0)}
          </p>
          <p className="text-sm text-gray-500">Pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-3xl font-bold text-green-600">
            {zones.reduce((acc, z) => acc + z.assigned_count, 0)}
          </p>
          <p className="text-sm text-gray-500">Asignados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-3xl font-bold text-indigo-600">
            {zones.length}
          </p>
          <p className="text-sm text-gray-500">Zonas Activas</p>
        </div>
      </div>

      {/* Grid de zonas */}
      <OperationsClient zones={zones} drivers={drivers} />
    </div>
  )
}
