import Link from 'next/link'
import {
  Package, Layers, AlertTriangle, XCircle,
  ArrowLeftRight, Bell, ScanLine, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react'
import { getCurrentProfile } from '@/utils/supabase/getCurrentProfile'
import { getInventoryStats, getMovements, getClientsForInventory } from './actions'
import { MovementBadge } from './components/MovementBadge'

export default async function InventoryDashboard() {
  const profile = await getCurrentProfile()
  if (!profile) return null

  const isStaff = ['super_admin', 'operador'].includes(profile.role)
  let clientId = profile.client_id

  let clients: { id: string; company_name: string }[] = []
  if (isStaff && !clientId) {
    clients = await getClientsForInventory()
    clientId = clients[0]?.id ?? null
  }

  if (!clientId) {
    return (
      <div className="text-center py-20">
        <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500">No hay cliente asociado para mostrar inventario.</p>
      </div>
    )
  }

  const [stats, movements] = await Promise.all([
    getInventoryStats(clientId),
    getMovements(clientId, 5),
  ])

  const statCards = [
    { label: 'Total productos',  value: stats.total_products,    icon: Package,        color: 'bg-blue-500',    text: 'text-blue-600'    },
    { label: 'Unidades en stock', value: stats.total_stock,       icon: Layers,         color: 'bg-indigo-500',  text: 'text-indigo-600'  },
    { label: 'Stock bajo',       value: stats.low_stock_count,    icon: AlertTriangle,  color: 'bg-amber-500',   text: 'text-amber-600'   },
    { label: 'Sin stock',        value: stats.out_of_stock_count, icon: XCircle,        color: 'bg-red-500',     text: 'text-red-600'     },
    { label: 'Movimientos hoy',  value: stats.movements_today,    icon: ArrowLeftRight, color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Alertas activas',  value: stats.alerts_active,      icon: Bell,           color: 'bg-orange-500',  text: 'text-orange-600'  },
  ]

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Content row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent movements */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Últimos movimientos</h2>
            <Link href="/inventory/movements" className="text-xs text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {movements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay movimientos registrados.</p>
          ) : (
            <div className="space-y-3">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <MovementBadge type={m.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {m.product?.name ?? 'Producto'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {m.reference ?? '—'} · {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${
                    ['ingreso', 'ajuste_positivo', 'devolucion'].includes(m.type) ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {['ingreso', 'ajuste_positivo', 'devolucion'].includes(m.type) ? '+' : '−'}{m.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick access for staff */}
        {isStaff ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Acceso rápido</h2>
            <div className="space-y-3">
              <Link
                href="/inventory/scanner?mode=ingreso"
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Registrar Ingreso</p>
                  <p className="text-xs text-emerald-600">Escanea productos para ingreso a bodega</p>
                </div>
              </Link>
              <Link
                href="/inventory/scanner?mode=salida"
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <ArrowUpCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-red-800">Registrar Salida</p>
                  <p className="text-xs text-red-600">Escanea productos para despacho</p>
                </div>
              </Link>
              <Link
                href="/inventory/products"
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-800">Catálogo de Productos</p>
                  <p className="text-xs text-blue-600">Ver y gestionar productos</p>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Tu inventario</h2>
            <div className="space-y-3">
              <Link
                href="/inventory/products"
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-800">Ver mis productos</p>
                  <p className="text-xs text-blue-600">Catálogo completo con stock actual</p>
                </div>
              </Link>
              {stats.alerts_active > 0 && (
                <Link
                  href="/inventory/alerts"
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-orange-800">{stats.alerts_active} alertas activas</p>
                    <p className="text-xs text-orange-600">Revisar productos con stock bajo</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
