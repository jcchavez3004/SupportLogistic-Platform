'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Package, ScanLine, ArrowLeftRight, Bell } from 'lucide-react'
import { clsx } from 'clsx'

const mobileNav = [
  { name: 'Inicio',    href: '/inventory',           icon: BarChart3,      roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Productos', href: '/inventory/products',  icon: Package,        roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Escáner',   href: '/inventory/scanner',   icon: ScanLine,       roles: ['super_admin', 'operador'] },
  { name: 'Movimientos', href: '/inventory/movements', icon: ArrowLeftRight, roles: ['super_admin', 'operador', 'cliente'] },
  { name: 'Alertas',   href: '/inventory/alerts',    icon: Bell,           roles: ['super_admin', 'operador', 'cliente'] },
]

interface InventoryMobileNavProps {
  role: string
  alertCount?: number
}

export function InventoryMobileNav({ role, alertCount = 0 }: InventoryMobileNavProps) {
  const pathname = usePathname()
  const items = mobileNav.filter((item) => item.roles.includes(role))

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex justify-around py-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/inventory' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors relative',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {item.name === 'Alertas' && alertCount > 0 && (
                <span className="absolute -top-1 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
