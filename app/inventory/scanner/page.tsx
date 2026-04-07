'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowDownCircle, ArrowUpCircle, Package, Search } from 'lucide-react'
import { BarcodeScanner, playBeep } from '../components/BarcodeScanner'
import { QuickMoveModal } from '../components/QuickMoveModal'
import { StockIndicator } from '../components/StockIndicator'
import { getProductByBarcode, type InventoryProduct } from '../actions'
import Image from 'next/image'

export default function ScannerPage() {
  const searchParams = useSearchParams()
  const initialMode = searchParams.get('mode') === 'salida' ? 'salida' : 'ingreso'

  const [mode, setMode] = useState<'ingreso' | 'salida'>(initialMode)
  const [product, setProduct] = useState<InventoryProduct | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searching, setSearching] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [flash, setFlash] = useState<'success' | 'error' | null>(null)
  const [manualSearch, setManualSearch] = useState('')

  const handleScan = useCallback(async (code: string) => {
    setSearching(true)
    setNotFound(false)
    setProduct(null)

    // TODO: for staff with multiple clients, we need a client selector
    // For now we pass empty string and the server action uses the profile's client_id
    const found = await getProductByBarcode(code, '')

    setSearching(false)
    if (found) {
      setProduct(found)
      setShowModal(true)
      playBeep(true)
    } else {
      setNotFound(true)
      playBeep(false)
    }
  }, [])

  const handleSuccess = () => {
    setShowModal(false)
    setProduct(null)
    setFlash('success')
    setTimeout(() => setFlash(null), 1500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-0">
      {/* Flash overlay */}
      {flash && (
        <div className={`fixed inset-0 z-40 pointer-events-none ${
          flash === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
        } animate-pulse`} />
      )}

      {/* Mode toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 flex gap-2">
        <button
          onClick={() => setMode('ingreso')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all ${
            mode === 'ingreso'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ArrowDownCircle className="h-5 w-5" /> INGRESO
        </button>
        <button
          onClick={() => setMode('salida')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all ${
            mode === 'salida'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ArrowUpCircle className="h-5 w-5" /> SALIDA
        </button>
      </div>

      {/* Scanner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Escanear producto</h2>
        <BarcodeScanner
          onScan={handleScan}
          disabled={searching}
          placeholder="Escanea código de barras, SKU o código interno..."
        />

        {searching && (
          <div className="flex items-center gap-3 mt-4 text-gray-500">
            <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Buscando producto...</p>
          </div>
        )}

        {notFound && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-semibold text-amber-800">Producto no encontrado</p>
            <p className="text-xs text-amber-600 mt-1">
              El código escaneado no coincide con ningún producto registrado.
              Verifica el código o registra un nuevo producto.
            </p>
          </div>
        )}
      </div>

      {/* Manual search fallback */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Búsqueda manual</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && manualSearch.trim()) handleScan(manualSearch.trim()) }}
              placeholder="Buscar por nombre, SKU, código..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => manualSearch.trim() && handleScan(manualSearch.trim())}
            disabled={!manualSearch.trim() || searching}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Product preview */}
      {product && !showModal && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.photo_url ? (
                <Image src={product.photo_url} alt={product.name} width={80} height={80} className="object-cover" />
              ) : (
                <Package className="h-10 w-10 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{product.name}</p>
              {product.sku && <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>}
              <div className="mt-2">
                <StockIndicator current={product.stock_current} minimum={product.stock_minimum} unit={product.unit} />
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={`mt-4 w-full py-3 font-bold rounded-xl text-white ${
              mode === 'ingreso' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Registrar {mode}
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && product && (
        <QuickMoveModal
          product={product}
          mode={mode}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
