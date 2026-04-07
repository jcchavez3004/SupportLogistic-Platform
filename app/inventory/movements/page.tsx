import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getMovements, getClientsForInventory } from '../actions'
import { MovementsClient } from './MovementsClient'

export default async function MovementsPage() {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const isStaff = ['super_admin', 'operador'].includes(profile.role)
  let clientId = profile.client_id

  if (isStaff && !clientId) {
    const clients = await getClientsForInventory()
    clientId = clients[0]?.id ?? null
  }

  if (!clientId) {
    return <p className="text-center text-gray-400 py-20">No hay cliente asociado.</p>
  }

  const movements = await getMovements(clientId, 200)

  return <MovementsClient movements={movements} />
}
