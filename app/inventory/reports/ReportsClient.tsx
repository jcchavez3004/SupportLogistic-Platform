'use client'

import { FileDown, Package, ArrowLeftRight } from 'lucide-react'
import type { InventoryStats, InventoryProduct, InventoryMovement } from '../actions'

interface ReportsClientProps {
  stats: InventoryStats
  products: InventoryProduct[]
  movements: InventoryMovement[]
}

export function ReportsClient({ stats, products, movements }: ReportsClientProps) {

  const exportProducts = () => {
    const headers = ['Nombre', 'Categoría', 'Marca', 'Modelo', 'SKU', 'Código barras', 'Stock actual', 'Stock mínimo', 'Unidad', 'Ubicación']
    const rows = products.map(p => [
      p.name, p.category ?? '', p.brand ?? '', p.model ?? '',
      p.sku ?? '', p.barcode ?? p.internal_code ?? '',
      p.stock_current, p.stock_minimum, p.unit, p.location ?? '',
    ])
    downloadCSV('inventario-productos', headers, rows)
  }

  const exportMovements = () => {
    const headers = ['Fecha', 'Tipo', 'Producto', 'SKU', 'Cantidad', 'Stock antes', 'Stock después', 'Referencia', 'Registrado por']
    const rows = movements.map(m => [
      new Date(m.created_at).toLocaleString('es-CO'),
      m.type,
      m.product?.name ?? '', m.product?.sku ?? '',
      m.quantity, m.stock_before, m.stock_after,
      m.reference ?? '',
      m.registered_by_profile?.full_name ?? '',
    ])
    downloadCSV('inventario-movimientos', headers, rows)
  }

  const exportLowStock = () => {
    const low = products.filter(p => p.stock_current <= p.stock_minimum)
    const headers = ['Nombre', 'Stock actual', 'Stock mínimo', 'Déficit', 'Ubicación', 'SKU']
    const rows = low.map(p => [
      p.name, p.stock_current, p.stock_minimum,
      p.stock_minimum - p.stock_current,
      p.location ?? '', p.sku ?? '',
    ])
    downloadCSV('inventario-stock-bajo', headers, rows)
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reportes de Inventario</h2>
        <p className="text-sm text-gray-500">Exporta datos de tu inventario en formato CSV</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total_products}</p>
          <p className="text-xs text-gray-400">Productos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{stats.total_stock}</p>
          <p className="text-xs text-gray-400">Total unidades</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.low_stock_count + stats.out_of_stock_count}</p>
          <p className="text-xs text-gray-400">Con stock bajo</p>
        </div>
      </div>

      {/* Export options */}
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={exportProducts}
          className="bg-white rounded-2xl border-2 border-blue-200 p-6 hover:bg-blue-50 transition-colors text-left group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900">Catálogo de Productos</h3>
          <p className="text-xs text-gray-500 mt-1">Todos los productos con stock, categoría, ubicación y códigos.</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-600">
            <FileDown className="h-3.5 w-3.5" /> Descargar CSV
          </div>
        </button>

        <button
          onClick={exportMovements}
          className="bg-white rounded-2xl border-2 border-emerald-200 p-6 hover:bg-emerald-50 transition-colors text-left group"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
            <ArrowLeftRight className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-bold text-gray-900">Historial de Movimientos</h3>
          <p className="text-xs text-gray-500 mt-1">Todos los ingresos, salidas, ajustes y devoluciones.</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600">
            <FileDown className="h-3.5 w-3.5" /> Descargar CSV
          </div>
        </button>

        <button
          onClick={exportLowStock}
          className="bg-white rounded-2xl border-2 border-red-200 p-6 hover:bg-red-50 transition-colors text-left group"
        >
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
            <FileDown className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="font-bold text-gray-900">Productos Stock Bajo</h3>
          <p className="text-xs text-gray-500 mt-1">Solo productos con stock igual o inferior al mínimo.</p>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-600">
            <FileDown className="h-3.5 w-3.5" /> Descargar CSV
          </div>
        </button>
      </div>
    </div>
  )
}

function downloadCSV(name: string, headers: string[], rows: (string | number | null)[][][]  | (string | number)[][]) {
  const csv = [headers, ...rows].map(r => (r as (string | number)[]).map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
