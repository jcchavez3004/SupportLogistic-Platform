import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getAlerts, getClientsForInventory } from '../actions'
import { AlertsClient } from './AlertsClient'

export default async function AlertsPage() {
  const profile = await getCurrentProfile()
  if (!profile) return null

  let clientId = profile.client_id

  if (['super_admin', 'operador'].includes(profile.role) && !clientId) {
    const clients = await getClientsForInventory()
    clientId = clients[0]?.id ?? null
  }

  if (!clientId) {
    return <p className="text-center text-gray-400 py-20">No hay cliente asociado.</p>
  }

  const alerts = await getAlerts(clientId)
  const isStaff = ['super_admin', 'operador'].includes(profile.role)

  return <AlertsClient alerts={alerts} isStaff={isStaff} />
}
