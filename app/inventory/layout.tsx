import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { InventorySidebar } from './components/InventorySidebar'
import { InventoryMobileNav } from './components/InventoryMobileNav'

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const allowedRoles = ['super_admin', 'operador', 'cliente']
  if (!allowedRoles.includes(profile.role)) redirect('/dashboard')

  let companyName: string | null = null
  if (profile.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', profile.client_id)
      .single()
    companyName = client?.company_name ?? null
  }

  let alertCount = 0
  if (profile.client_id) {
    const { count } = await supabase
      .from('inventory_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', profile.client_id)
      .eq('resolved', false)
    alertCount = count ?? 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InventorySidebar role={profile.role} companyName={companyName} alertCount={alertCount} />
      <InventoryMobileNav role={profile.role} alertCount={alertCount} />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Inventario WMS</h1>
              {companyName && <p className="text-xs text-gray-500">{companyName}</p>}
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full capitalize">
              {profile.role.replace('_', ' ')}
            </span>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
