import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getStaffMembers } from './actions'
import { StaffTable } from './components/StaffTable'
import { NewStaffModal } from './components/NewStaffModal'
import { Users } from 'lucide-react'

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()

  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const staff = await getStaffMembers()

  const stats = {
    total: staff.length,
    operadores: staff.filter((s) => s.role === 'operador').length,
    admins: staff.filter((s) => s.role === 'super_admin').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Gestión de Staff
          </h1>
          <p className="mt-1 text-sm text-gray-500 hidden sm:block">
            Administra el equipo de operaciones de SupportLogistic.
          </p>
        </div>
        <NewStaffModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total staff</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.operadores}</p>
          <p className="text-xs text-gray-500 mt-0.5">Operadores</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          <p className="text-xs text-gray-500 mt-0.5">Super Admins</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">
            Miembros del equipo
          </h2>
        </div>
        <StaffTable staff={staff} currentUserId={user.id} />
      </div>
    </div>
  )
}
