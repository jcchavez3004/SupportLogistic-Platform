'use client'

import { useState, useTransition } from 'react'
import { X, Package, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import Image from 'next/image'
import { registerMovement, type InventoryProduct, type InventoryMovement } from '../actions'
import { StockIndicator } from './StockIndicator'
import { playBeep } from './BarcodeScanner'

interface QuickMoveModalProps {
  product: InventoryProduct
  mode: 'ingreso' | 'salida'
  onClose: () => void
  onSuccess: () => void
}

export function QuickMoveModal({ product, mode, onClose, onSuccess }: QuickMoveModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isIngreso = mode === 'ingreso'
  const color = isIngreso ? 'emerald' : 'red'

  const handleSubmit = () => {
    if (quantity <= 0) { setError('La cantidad debe ser mayor a 0'); return }
    setError(null)

    startTransition(async () => {
      const result = await registerMovement({
        productId: product.id,
        clientId: product.client_id,
        type: mode,
        quantity,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        scanned: true,
      })

      if (result.success) {
        playBeep(true)
        onSuccess()
      } else {
        playBeep(false)
        setError(result.error ?? 'Error al registrar movimiento')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${isIngreso ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
          <div className="flex items-center gap-2">
            {isIngreso ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
            <h3 className="font-bold">{isIngreso ? 'Registrar Ingreso' : 'Registrar Salida'}</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.photo_url ? (
                <Image src={product.photo_url} alt={product.name} width={64} height={64} className="object-cover" />
              ) : (
                <Package className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
              {product.sku && <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>}
              <StockIndicator current={product.stock_current} minimum={product.stock_minimum} unit={product.unit} showBar={false} />
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-4 text-2xl font-bold text-center border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (guía, orden, etc.)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: GR-2026-0123"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || quantity <= 0}
            className={`flex-1 py-3 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors ${
              isIngreso ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isPending ? 'Registrando...' : `Confirmar ${isIngreso ? 'ingreso' : 'salida'}`}
          </button>
        </div>
      </div>
    </div>
  )
}
