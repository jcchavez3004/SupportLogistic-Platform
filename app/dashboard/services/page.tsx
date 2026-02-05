import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getClientsForSelect, getDriversForSelect, getServices, getServicesForClient } from './actions'
import { NewServiceButton } from './components/NewServiceButton'
import { ServicesTable } from './components/ServicesTable'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'

export default async function ServicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const role = profile?.role || 'cliente'
  const clientId = profile?.client_id || null

  // Si es cliente, solo mostrar sus servicios
  const servicesPromise =
    role === 'cliente' && clientId
      ? getServicesForClient(clientId)
      : getServices()

  // Si es cliente, no necesita la lista de clientes (su client_id se inyecta automáticamente)
  const clientsPromise =
    role === 'cliente' ? Promise.resolve([]) : getClientsForSelect()

  // Si es cliente, no necesita la lista de conductores
  const driversPromise =
    role === 'cliente' ? Promise.resolve([]) : getDriversForSelect()

  const [services, clients, drivers] = await Promise.all([
    servicesPromise,
    clientsPromise,
    driversPromise,
  ])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header responsivo: apila en móvil, lado a lado en desktop */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {role === 'cliente' ? 'Mis Envíos' : 'Servicios (Envíos)'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">
            {role === 'cliente'
              ? 'Visualiza y solicita envíos para tu empresa.'
              : 'Crea y gestiona los envíos asociados a tus clientes.'}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <NewServiceButton clients={clients} role={role} clientId={clientId} />
        </div>
      </div>

      {/* Contenedor de tabla/tarjetas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ServicesTable services={services} drivers={drivers} role={role} />
      </div>
    </div>
  )
}
