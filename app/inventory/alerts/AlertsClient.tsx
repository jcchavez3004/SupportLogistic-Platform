'use client'

import { useTransition } from 'react'
import { AlertTriangle, XCircle, CheckCircle2, Bell, Clock } from 'lucide-react'
import { resolveAlert, type InventoryAlert } from '../actions'

interface AlertsClientProps {
  alerts: InventoryAlert[]
  isStaff: boolean
}

export function AlertsClient({ alerts, isStaff }: AlertsClientProps) {
  const [isPending, startTransition] = useTransition()

  const handleResolve = (alertId: string) => {
    startTransition(async () => { await resolveAlert(alertId) })
  }

  const sinStock = alerts.filter(a => a.type === 'sin_stock')
  const stockMinimo = alerts.filter(a => a.type === 'stock_minimo')

  if (alerts.length === 0) {
    return (
      <div className="text-center py-20">
        <CheckCircle2 className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700">Sin alertas activas</h2>
        <p className="text-sm text-gray-400 mt-1">Todos los productos están dentro de los niveles establecidos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Alertas de Inventario</h2>
        <p className="text-sm text-gray-500">{alerts.length} alertas activas</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <XCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-700">{sinStock.length}</p>
            <p className="text-xs text-red-600">Sin stock</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-700">{stockMinimo.length}</p>
            <p className="text-xs text-amber-600">Stock mínimo</p>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {alerts.map(alert => {
          const isCritical = alert.type === 'sin_stock'
          const timeAgo = getTimeAgo(alert.created_at)

          return (
            <div
              key={alert.id}
              className={`bg-white rounded-2xl border-2 p-4 shadow-sm ${
                isCritical ? 'border-red-200' : 'border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCritical ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  {isCritical
                    ? <XCircle className="h-5 w-5 text-red-500" />
                    : <AlertTriangle className="h-5 w-5 text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {alert.product?.name ?? 'Producto'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                  {alert.product && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                        Stock: {alert.product.stock_current}
                      </span>
                      <span className="text-gray-400">Mínimo: {alert.product.stock_minimum}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" /> {timeAgo}
                  </div>
                </div>
                {isStaff && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={isPending}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Resolver
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}
