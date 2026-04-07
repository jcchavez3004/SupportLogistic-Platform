'use client'

import { useState, useMemo } from 'react'
import { Search, Download, ArrowLeftRight } from 'lucide-react'
import { MovementBadge } from '../components/MovementBadge'
import type { InventoryMovement } from '../actions'

const TYPES = [
  { key: 'all', label: 'Todos' },
  { key: 'ingreso', label: 'Ingreso' },
  { key: 'salida', label: 'Salida' },
  { key: 'ajuste_positivo', label: 'Ajuste (+)' },
  { key: 'ajuste_negativo', label: 'Ajuste (−)' },
  { key: 'devolucion', label: 'Devolución' },
]

interface MovementsClientProps {
  movements: InventoryMovement[]
}

export function MovementsClient({ movements }: MovementsClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = movements
    if (typeFilter !== 'all') result = result.filter(m => m.type === typeFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.product?.name?.toLowerCase().includes(q) ||
        m.product?.sku?.toLowerCase().includes(q) ||
        m.reference?.toLowerCase().includes(q)
      )
    }
    return result
  }, [movements, search, typeFilter])

  const handleExport = () => {
    const headers = ['Fecha', 'Tipo', 'Producto', 'SKU', 'Cantidad', 'Stock antes', 'Stock después', 'Referencia', 'Registrado por']
    const rows = filtered.map(m => [
      new Date(m.created_at).toLocaleString('es-CO'),
      m.type,
      m.product?.name ?? '',
      m.product?.sku ?? '',
      m.quantity,
      m.stock_before,
      m.stock_after,
      m.reference ?? '',
      m.registered_by_profile?.full_name ?? '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movimientos-inventario-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Historial de Movimientos</h2>
          <p className="text-sm text-gray-500">{movements.length} movimientos registrados</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, SKU, referencia..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron movimientos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Cantidad</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Referencia</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registrado por</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => {
                  const isPositive = ['ingreso', 'ajuste_positivo', 'devolucion'].includes(m.type)
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><MovementBadge type={m.type} /></td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{m.product?.name ?? '—'}</p>
                        {m.product?.sku && <p className="text-[10px] text-gray-400 font-mono">{m.product.sku}</p>}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : '−'}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {m.stock_before} → {m.stock_after}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{m.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m.registered_by_profile?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-400">
                        {new Date(m.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        <br />
                        {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
