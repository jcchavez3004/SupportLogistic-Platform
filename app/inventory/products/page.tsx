import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getInventoryProducts, getClientsForInventory } from '../actions'
import { ProductCard } from '../components/ProductCard'
import { ProductsClient } from './ProductsClient'

export default async function ProductsPage() {
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

  const products = await getInventoryProducts(clientId)

  return <ProductsClient products={products} isStaff={isStaff} clientId={clientId} />
}
