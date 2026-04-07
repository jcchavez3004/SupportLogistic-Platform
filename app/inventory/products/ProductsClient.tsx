'use client'

import { useState, useMemo, useTransition } from 'react'
import { Package, Search, LayoutGrid, List, Plus } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { StockIndicator } from '../components/StockIndicator'
import { createProduct, type InventoryProduct } from '../actions'
import Link from 'next/link'

interface ProductsClientProps {
  products: InventoryProduct[]
  isStaff: boolean
  clientId: string
}

export function ProductsClient({ products, isStaff, clientId }: ProductsClientProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let result = products
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    if (filter === 'ok') result = result.filter(p => p.stock_current > p.stock_minimum)
    if (filter === 'low') result = result.filter(p => p.stock_current > 0 && p.stock_current <= p.stock_minimum)
    if (filter === 'out') result = result.filter(p => p.stock_current === 0)
    return result
  }, [products, search, filter])

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [products])

  const handleCreateProduct = (formData: FormData) => {
    formData.set('client_id', clientId)
    startTransition(async () => {
      const result = await createProduct(formData)
      if (result.success) setShowNewProduct(false)
    })
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Catálogo de Productos</h2>
          <p className="text-sm text-gray-500">{products.length} productos registrados</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setView('grid')} className={`p-2 rounded-md ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}>
              <LayoutGrid className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={() => setView('table')} className={`p-2 rounded-md ${view === 'table' ? 'bg-white shadow-sm' : ''}`}>
              <List className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          {isStaff && (
            <button
              onClick={() => setShowNewProduct(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Nuevo producto
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU, código..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'ok', label: 'OK' },
            { key: 'low', label: 'Bajo' },
            { key: 'out', label: 'Agotado' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron productos.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} isStaff={isStaff} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Producto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ubicación</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StockIndicator current={p.stock_current} minimum={p.stock_minimum} unit={p.unit} showBar={false} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.location ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/inventory/products/${p.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showNewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <h3 className="font-bold text-gray-900">Nuevo Producto</h3>
              <button onClick={() => setShowNewProduct(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form action={handleCreateProduct} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input name="name" required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input name="category" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input name="brand" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                  <input name="model" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input name="sku" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de barras</label>
                <input name="barcode" placeholder="Si no tiene, se generará un código interno" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
                  <input name="stock_minimum" type="number" defaultValue={0} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <input name="unit" defaultValue="unidad" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en bodega</label>
                <input name="location" placeholder="Ej: Estante A3, Piso 2" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="description" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del producto</label>
                <input name="photo" type="file" accept="image/*" className="w-full text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <input name="notes" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewProduct(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                  {isPending ? 'Creando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
