import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getInventoryStats, getInventoryProducts, getMovements, getClientsForInventory } from '../actions'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
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

  const [stats, products, movements] = await Promise.all([
    getInventoryStats(clientId),
    getInventoryProducts(clientId),
    getMovements(clientId, 500),
  ])

  return <ReportsClient stats={stats} products={products} movements={movements} />
}
