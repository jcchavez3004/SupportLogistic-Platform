'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, Package, ScanLine, ArrowLeftRight,
  Bell, FileDown, LogOut, ArrowLeft,
} from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/utils/supabase/client'

const staffRoles = ['super_admin', 'operador']

const allNav = [
  { name: 'Dashboard',   href: '/inventory',            icon: BarChart3,       roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Productos',   href: '/inventory/products',   icon: Package,         roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Escáner',     href: '/inventory/scanner',    icon: ScanLine,        roles: ['super_admin', 'operador'] },
  { name: 'Movimientos', href: '/inventory/movements',  icon: ArrowLeftRight,  roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Alertas',     href: '/inventory/alerts',     icon: Bell,            roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Reportes',    href: '/inventory/reports',    icon: FileDown,        roles: ['super_admin', 'operador', 'cliente'] },
]

interface InventorySidebarProps {
  role: string
  companyName?: string | null
  alertCount?: number
}

export function InventorySidebar({ role, companyName, alertCount = 0 }: InventorySidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navigation = allNav.filter((item) => item.roles.includes(role))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 bg-slate-800 shadow-lg">
      <div className="flex flex-col h-full w-full">
        <div className="px-4 pt-5 pb-3 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs mb-3 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Dashboard
          </Link>
          <h1 className="text-lg font-bold text-white">Inventario WMS</h1>
          {companyName && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{companyName}</p>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/inventory' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <span className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </span>
                {item.name === 'Alertas' && alertCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {alertCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700 space-y-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 capitalize">
            {role.replace('_', ' ')}
          </span>
          {staffRoles.includes(role) && (
            <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-600/20 text-violet-300">
              Staff
            </span>
          )}
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
