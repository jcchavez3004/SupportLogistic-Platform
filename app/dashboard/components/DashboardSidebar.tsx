'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Building2, Truck, Users, FileSpreadsheet, LayoutGrid, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import type { UserRole } from '@/utils/supabase/getCurrentProfile'
import { createClient } from '@/utils/supabase/client'

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['super_admin', 'operador', 'cliente', 'conductor'] },
  { name: 'Clientes', href: '/dashboard/clients', icon: Building2, roles: ['super_admin', 'operador'] },
  { name: 'Servicios', href: '/dashboard/services', icon: Truck, roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Operaciones', href: '/dashboard/operations', icon: LayoutGrid, roles: ['super_admin', 'operador'] },
  { name: 'Importar Masivo', href: '/dashboard/bulk-import', icon: FileSpreadsheet, roles: ['cliente'] },
  { name: 'Conductores', href: '/dashboard/drivers', icon: Users, roles: ['super_admin', 'operador'] },
]

interface DashboardSidebarProps {
  role: UserRole
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Filtrar navegación según rol
  const navigation = allNavigation.filter((item) =>
    item.roles.includes(role)
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 bg-slate-800 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">SupportLogistic</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="px-4 py-4 border-t border-slate-700 space-y-3">
          {/* Rol badge */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 capitalize">
            {role.replace('_', ' ')}
          </span>

          {/* Botón Cerrar Sesión */}
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors text-red-400 hover:bg-red-950/50 hover:text-red-300"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
