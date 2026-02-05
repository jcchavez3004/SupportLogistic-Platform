import { User } from '@supabase/supabase-js'

export function DashboardHeader({ user }: { user: User }) {
  return (
    <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Panel Administrativo</h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-xs sm:text-sm text-gray-600">
          <span className="font-medium">{user.email}</span>
        </div>
      </div>
    </header>
  )
}
