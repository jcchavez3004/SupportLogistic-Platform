import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from './components/DashboardSidebar'
import { DashboardHeader } from './components/DashboardHeader'
import { getCurrentProfile, UserRole } from '@/utils/supabase/getCurrentProfile'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar role={role} />
      <div className="md:pl-64">
        <DashboardHeader user={user} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
