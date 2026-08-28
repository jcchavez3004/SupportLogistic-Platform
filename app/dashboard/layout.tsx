import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { DashboardSidebar } from './components/DashboardSidebar'
import { DashboardHeader } from './components/DashboardHeader'
import { getCurrentProfile, UserRole } from '@/utils/supabase/getCurrentProfile'
import { PWAInstallBanner } from '@/app/components/PWAInstallBanner'
import { PWARegister } from '@/app/components/PWARegister'

const CLIENTE_ALLOWED_PATHS = ['/dashboard', '/dashboard/audifarma']

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const role: UserRole = profile?.role || 'cliente'

  if (role === 'cliente') {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? ''
    const allowed = CLIENTE_ALLOWED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    )
    if (!allowed) {
      redirect('/dashboard/audifarma')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar role={role} clientId={profile?.client_id} />
      <div className="md:pl-64">
        <DashboardHeader user={user} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <PWARegister />
      {role === 'conductor' && <PWAInstallBanner />}
    </div>
  )
}
