import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ClientsTable } from './components/ClientsTable'
import { NewClientButton } from './components/NewClientButton'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getServiceTypes, getAllClientsServiceTypes } from './actions'

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const role = profile?.role || 'cliente'

  // Clientes no deberían ver esta página (el sidebar la oculta), pero por seguridad:
  if (role === 'cliente') {
    redirect('/dashboard')
  }

  // Obtener clientes, tipos de servicio y servicios de clientes en paralelo
  const [clientsResult, serviceTypes, clientServiceTypes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, company_name, nit, address, logo_url, created_at')
      .order('created_at', { ascending: false }),
    getServiceTypes(),
    getAllClientsServiceTypes(),
  ])

  const { data: clients, error } = clientsResult

  if (error) {
    console.error('Error fetching clients:', error)
  }

  // Solo super_admin puede crear/editar clientes; operador solo lectura
  const canManageClients = role === 'super_admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra y visualiza todos los clientes registrados
          </p>
        </div>
        {canManageClients && <NewClientButton serviceTypes={serviceTypes} />}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ClientsTable 
          clients={clients || []} 
          serviceTypes={serviceTypes}
          clientServiceTypes={clientServiceTypes}
          canEdit={canManageClients}
        />
      </div>
    </div>
  )
}
